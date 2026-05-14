/**
 * ariaMemory.js — ARIA Adaptive Learning System
 *
 * HOW IT WORKS:
 * Every time ARIA responds online (via Gemma/Gemini), this module:
 *   1. Extracts the scenario + intent from the response
 *   2. Saves the user's exact phrasing → scenario mapping to localStorage
 *   3. Builds a "phrase index" — raw user phrases linked to scenario keys
 *
 * When ARIA is offline:
 *   1. offlineEngine checks phrase index FIRST (before scoring)
 *   2. If user's input fuzzy-matches a saved phrase → uses that scenario
 *   3. This means "fire around the house" gets learned after ONE online session
 *      and matched correctly in all future offline sessions
 *
 * Storage keys:
 *   aria_memory        — legacy format (kept for backward compat)
 *   aria_phrase_index  — new: { phrase: scenarioKey, ... }
 *   aria_learned_kb    — new: { scenarioKey: { title, summary, steps, ... } }
 *
 * This is the self-sufficiency layer: offline ARIA gets smarter every time
 * the user goes online, with zero manual updates needed.
 */

const PHRASE_INDEX_KEY = "aria_phrase_index";
const LEARNED_KB_KEY   = "aria_learned_kb";
const LEGACY_MEMORY_KEY = "aria_memory";

const MAX_PHRASE_ENTRIES = 300;  // ~30KB, safe for localStorage
const MAX_KB_ENTRIES     = 80;   // full scenario objects are bigger

// ─────────────────────────────────────────────────────────────────────────────
// WRITE — called by gemmaEngine after every successful online response
// ─────────────────────────────────────────────────────────────────────────────

/**
 * saveOnlineInteraction(userInput, gemmaResponse)
 *
 * gemmaResponse shape (what processResponse returns):
 * {
 *   scenarioKey, title, summary, steps, avoid, when_to_seek_help,
 *   category, intent, severity, confidence, source, mode
 * }
 */
export function saveOnlineInteraction(userInput, gemmaResponse) {
  if (!userInput || !gemmaResponse) return;

  try {
    const normalizedInput = userInput.toLowerCase().trim();

    // ── 1. Save to phrase index ────────────────────────────────────────────
    const scenarioKey = gemmaResponse.scenarioKey || _inferScenarioKey(gemmaResponse);
    if (scenarioKey && scenarioKey !== "unknown" && scenarioKey !== "default") {
      _savePhraseEntry(normalizedInput, scenarioKey, {
        title:    gemmaResponse.title,
        intent:   gemmaResponse.intent,
        severity: gemmaResponse.severity,
      });
    }

    // ── 2. Save learned KB entry if we have full scenario data ─────────────
    if (
      scenarioKey &&
      gemmaResponse.title &&
      gemmaResponse.summary &&
      Array.isArray(gemmaResponse.steps) &&
      gemmaResponse.steps.length > 0
    ) {
      _saveLearnedKbEntry(scenarioKey, {
        title:             gemmaResponse.title,
        summary:           gemmaResponse.summary,
        steps:             gemmaResponse.steps,
        avoid:             gemmaResponse.avoid || [],
        when_to_seek_help: gemmaResponse.when_to_seek_help || [],
        category:          gemmaResponse.category || "general",
        intent:            gemmaResponse.intent   || "guidance",
        severity:          gemmaResponse.severity || null,
        learnedAt:         Date.now(),
        learnedFrom:       normalizedInput,
      });
    }

    // ── 3. Legacy format (keep for backward compat with old memory reader) ─
    _saveLegacyMemory(normalizedInput, gemmaResponse);

  } catch (e) {
    console.warn("[ARIA Memory] Save failed:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — called by offlineEngine before phrase scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * findLearnedMatch(userInput)
 * Returns { scenarioKey, learnedScenario, confidence, matchedPhrase } or null
 *
 * Two-pass lookup:
 *   Pass A — exact phrase index hit (confidence 0.92)
 *   Pass B — fuzzy token overlap against all saved phrases (confidence 0.70–0.85)
 */
export function findLearnedMatch(userInput) {
  if (!userInput) return null;

  const normalizedInput = userInput.toLowerCase().trim();
  const inputTokens = _tokenize(normalizedInput);
  if (inputTokens.length < 2) return null;

  try {
    const phraseIndex = _loadPhraseIndex();
    if (Object.keys(phraseIndex).length === 0) return null;

    // PASS A — exact substring match
    for (const [savedPhrase, entry] of Object.entries(phraseIndex)) {
      if (
        normalizedInput.includes(savedPhrase) ||
        savedPhrase.includes(normalizedInput)
      ) {
        const learnedScenario = _loadLearnedScenario(entry.scenarioKey);
        if (learnedScenario) {
          console.log(`[ARIA Memory] Exact phrase hit: "${savedPhrase}" → ${entry.scenarioKey}`);
          return {
            scenarioKey:   entry.scenarioKey,
            learnedScenario,
            confidence:    0.92,
            matchedPhrase: savedPhrase,
          };
        }
      }
    }

    // PASS B — fuzzy token overlap (≥60% overlap required)
    let bestScore = 0;
    let bestEntry = null;
    let bestPhrase = null;

    for (const [savedPhrase, entry] of Object.entries(phraseIndex)) {
      const savedTokens = _tokenize(savedPhrase);
      if (savedTokens.length < 2) continue;

      const overlap = _tokenOverlap(inputTokens, savedTokens);
      if (overlap > bestScore && overlap >= 0.60) {
        bestScore = overlap;
        bestEntry = entry;
        bestPhrase = savedPhrase;
      }
    }

    if (bestEntry) {
      const learnedScenario = _loadLearnedScenario(bestEntry.scenarioKey);
      if (learnedScenario) {
        const confidence = 0.60 + (bestScore - 0.60) * 1.25; // map 0.60–1.0 → 0.70–0.90 approx
        console.log(`[ARIA Memory] Fuzzy hit: "${bestPhrase}" (${(bestScore*100).toFixed(0)}%) → ${bestEntry.scenarioKey}`);
        return {
          scenarioKey:   bestEntry.scenarioKey,
          learnedScenario,
          confidence:    Math.min(confidence, 0.90),
          matchedPhrase: bestPhrase,
        };
      }
    }

  } catch (e) {
    console.warn("[ARIA Memory] Read failed:", e);
  }

  return null;
}

/**
 * getLearnedScenario(scenarioKey)
 * Returns learned scenario data or null — used by offlineEngine buildResponse
 */
export function getLearnedScenario(scenarioKey) {
  return _loadLearnedScenario(scenarioKey);
}

/**
 * getMemoryStats()
 * Returns stats for SettingsScreen display
 */
export function getMemoryStats() {
  try {
    const phraseIndex  = _loadPhraseIndex();
    const learnedKb    = _loadLearnedKb();
    const legacy       = JSON.parse(localStorage.getItem(LEGACY_MEMORY_KEY) || "[]");
    return {
      phrasesLearned:    Object.keys(phraseIndex).length,
      scenariosLearned:  Object.keys(learnedKb).length,
      legacyEntries:     legacy.length,
      totalEntries:      Object.keys(phraseIndex).length + legacy.length,
    };
  } catch {
    return { phrasesLearned: 0, scenariosLearned: 0, legacyEntries: 0, totalEntries: 0 };
  }
}

/**
 * clearMemory()
 * Wipes all learned data — called from SettingsScreen
 */
export function clearMemory() {
  try {
    localStorage.removeItem(PHRASE_INDEX_KEY);
    localStorage.removeItem(LEARNED_KB_KEY);
    localStorage.removeItem(LEGACY_MEMORY_KEY);
    console.log("[ARIA Memory] All memory cleared");
    return true;
  } catch (e) {
    console.warn("[ARIA Memory] Clear failed:", e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","is","it","in","on","at","to","do","i","am","are","was",
  "be","my","me","we","he","she","they","you","and","or","but","if","of",
  "for","so","with","how","what","when","where","who","can","have","has",
  "had","not","this","that","need","help","please","just","right","now",
  "get","got","use","feel","feels","very","also","about","from","by","up",
  "out","as","no","yes","okay","ok","then","after","before","again","still",
]);

function _tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function _tokenOverlap(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setB = new Set(tokensB);
  const matches = tokensA.filter((t) => setB.has(t)).length;
  return matches / Math.max(tokensA.length, tokensB.length);
}

/**
 * Infer scenarioKey from Gemini response when it doesn't provide one explicitly.
 * Maps category/title keywords to known scenario keys.
 */
function _inferScenarioKey(response) {
  const text = `${response.title || ""} ${response.category || ""} ${response.summary || ""}`.toLowerCase();

  const MAP = [
    ["not breathing","cardiac","cpr"],       ["bleeding","hemorrhage","bleeding"],
    ["burn","fire skin","burns"],            ["fire","evacuation","flame","fire"],
    ["water","purif","contamina","water_purification_advanced"],
    ["food","preserv","food_preservation"],  ["shelter","build shelter","shelter"],
    ["fracture","broken bone","bone_fracture"],
    ["fall","fell","fall_injury"],           ["drown","drowning"],
    ["snake","venom","snakebite"],           ["allerg","anaphyl","allergic_reaction"],
    ["choke","airway","choking"],            ["spinal","spine","neck break","spinal_injury"],
    ["fever","temperature","fever"],         ["heat stroke","heat exhaustion","heat_exhaustion"],
    ["electric","zap","electric_shock"],     ["gas leak","gas_leak"],
    ["chemical attack","nerve","chemical_attack"],
    ["nuclear","radiation","nuclear_radiation"],
    ["childbirth","labor","childbirth_emergency"],
    ["navigate","direction","navigation"],   ["signal","rescue","signal_rescue"],
    ["solar","panel","solar_power"],         ["battery","battery_diy"],
    ["landmine","explosive","explosive_landmine"],
    ["triage","casualty","triage"],
  ];

  for (const keywords of MAP) {
    const key = keywords[keywords.length - 1];
    for (let i = 0; i < keywords.length - 1; i++) {
      if (text.includes(keywords[i])) return key;
    }
  }
  return null;
}

function _savePhraseEntry(phrase, scenarioKey, meta = {}) {
  const index = _loadPhraseIndex();

  // Don't save very short or very long phrases
  if (phrase.length < 4 || phrase.length > 120) return;

  index[phrase] = {
    scenarioKey,
    savedAt: Date.now(),
    ...meta,
  };

  // Trim to max size (drop oldest entries)
  const entries = Object.entries(index).sort(([, a], [, b]) => b.savedAt - a.savedAt);
  const trimmed = Object.fromEntries(entries.slice(0, MAX_PHRASE_ENTRIES));

  localStorage.setItem(PHRASE_INDEX_KEY, JSON.stringify(trimmed));
}

function _saveLearnedKbEntry(scenarioKey, data) {
  const kb = _loadLearnedKb();
  kb[scenarioKey] = data;

  // Trim to max — drop oldest learned entries
  const entries = Object.entries(kb).sort(([, a], [, b]) => b.learnedAt - a.learnedAt);
  const trimmed = Object.fromEntries(entries.slice(0, MAX_KB_ENTRIES));

  localStorage.setItem(LEARNED_KB_KEY, JSON.stringify(trimmed));
}

function _saveLegacyMemory(input, response) {
  const existing = JSON.parse(localStorage.getItem(LEGACY_MEMORY_KEY) || "[]");
  existing.push({
    input,
    tokens: _tokenize(input),
    response,
    timestamp: Date.now(),
  });
  localStorage.setItem(LEGACY_MEMORY_KEY, JSON.stringify(existing.slice(-100)));
}

function _loadPhraseIndex() {
  try {
    return JSON.parse(localStorage.getItem(PHRASE_INDEX_KEY) || "{}");
  } catch {
    return {};
  }
}

function _loadLearnedKb() {
  try {
    return JSON.parse(localStorage.getItem(LEARNED_KB_KEY) || "{}");
  } catch {
    return {};
  }
}

function _loadLearnedScenario(scenarioKey) {
  if (!scenarioKey) return null;
  const kb = _loadLearnedKb();
  return kb[scenarioKey] || null;
}
