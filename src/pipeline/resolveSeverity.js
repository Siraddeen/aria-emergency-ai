/**
 * resolveSeverity.js
 *
 * PURPOSE
 * -------
 * Determines how dangerous a situation is.
 *
 * IMPORTANT:
 * - Severity ≠ confidence
 * - Severity should ALWAYS bias toward safety
 * - Life-threatening situations MUST escalate deterministically
 *
 * FINAL ARCHITECTURE
 * ------------------
 * PRIORITY ORDER:
 *
 * 1. Explicit CRITICAL from knowledge engine
 * 2. Scenario-key critical escalation
 * 3. Raw user query keyword scan
 * 4. Response content scan
 * 5. Existing authored severity fallback
 * 6. Default → "low"
 *
 * WHY THIS EXISTS
 * ---------------
 * Old architecture trusted knowledge severity too early:
 *
 *   cpr → severity: "medium"
 *
 * which blocked escalation forever.
 *
 * This new system allows:
 *
 *   medium → high → critical
 *
 * based on actual danger signals.
 */

// ─────────────────────────────────────────────
// DETERMINISTIC CRITICAL SCENARIOS
// These ALWAYS become critical.
// Never trust AI for these.
// ─────────────────────────────────────────────

const CRITICAL_SCENARIOS = new Set([
  "cpr",
  "cardiac_arrest",
  "not_breathing",
  "severe_bleeding",
  "hemorrhage",
  "gunshot",
  "drowning",
  "electrocution",
  "electricity",
  "poison_ingestion",
  "anaphylaxis",
  "stroke",
  "seizure",
  "overdose",
  "fire_trapped",
  "explosion",
  "collapsed_person",
]);

// ─────────────────────────────────────────────
// CRITICAL KEYWORDS
// ─────────────────────────────────────────────

const CRITICAL_KEYWORDS = [
  // Breathing
  "not breathing",
  "no breathing",
  "stopped breathing",
  "cant breathe",
  "can't breathe",
  "unable to breathe",
  "no pulse",
  "cpr",
  "cardiac arrest",
  "heart stopped",

  // Consciousness
  "unconscious",
  "unresponsive",
  "not responding",
  "wont wake",
  "won't wake",

  // Bleeding
  "bleeding out",
  "spurting blood",
  "severe bleeding",
  "hemorrhage",

  // Trauma
  "gunshot",
  "got shot",
  "bullet wound",
  "stab wound",
  "impalement",

  // Airway
  "choking",
  "airway blocked",

  // Electrical
  "electrocution",
  "electrocuted",
  "live wire",

  // Water
  "drowning",
  "underwater",
  "cant swim",

  // Poison
  "poisoning",
  "drank bleach",
  "swallowed cleaner",
  "chemical ingestion",

  // Fire
  "trapped in fire",
  "house on fire",
  "burning building",
];

// ─────────────────────────────────────────────
// HIGH KEYWORDS
// ─────────────────────────────────────────────

const HIGH_KEYWORDS = [
  "fire",
  "burn",
  "blood",
  "injury",
  "fracture",
  "broken bone",
  "smoke inhalation",
  "collapse",
  "electric shock",
  "flood",
  "earthquake",
  "radiation",
  "snake bite",
  "heat stroke",
  "hypothermia",
  "trapped",
];

// ─────────────────────────────────────────────
// MEDIUM KEYWORDS
// ─────────────────────────────────────────────

const MEDIUM_KEYWORDS = [
  "pain",
  "sprain",
  "bruise",
  "cut",
  "swelling",
  "dizzy",
  "vomiting",
  "headache",
  "panic",
  "stress",
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function matchesKeywords(text, keywords) {
  if (!text || typeof text !== "string") {
    return false;
  }

  const lower = text.toLowerCase();

  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

// ─────────────────────────────────────────────
// MAIN RESOLVER
// ─────────────────────────────────────────────

export function resolveSeverity(response = {}) {
  const existingSeverity = response.severity;
  const scenarioKey = (response.scenarioKey || "").toLowerCase();

  // ─────────────────────────────────────────
  // PRIORITY 1:
  // Explicit CRITICAL from engine/knowledge
  // ─────────────────────────────────────────

  if (existingSeverity === "critical") {
    return "critical";
  }

  // ─────────────────────────────────────────
  // PRIORITY 2:
  // Deterministic critical scenarios
  // ─────────────────────────────────────────

  if (CRITICAL_SCENARIOS.has(scenarioKey)) {
    return "critical";
  }

  // ─────────────────────────────────────────
  // PRIORITY 3:
  // Raw user query scan
  // Fastest + safest escalation layer
  // ─────────────────────────────────────────

  const userText = (response.userQuery || "").toLowerCase();

  if (userText) {
    if (matchesKeywords(userText, CRITICAL_KEYWORDS)) {
      return "critical";
    }

    if (matchesKeywords(userText, HIGH_KEYWORDS)) {
      return "high";
    }

    if (matchesKeywords(userText, MEDIUM_KEYWORDS)) {
      return "medium";
    }
  }

  // ─────────────────────────────────────────
  // PRIORITY 4:
  // Response content scan
  // Used for quick actions / KB-only flows
  // ─────────────────────────────────────────

  const responseText = [
    response.title,
    response.summary,
    ...(response.steps || []),
    ...(response.actions || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (matchesKeywords(responseText, CRITICAL_KEYWORDS)) {
    return "critical";
  }

  if (matchesKeywords(responseText, HIGH_KEYWORDS)) {
    return "high";
  }

  if (matchesKeywords(responseText, MEDIUM_KEYWORDS)) {
    return "medium";
  }

  // ─────────────────────────────────────────
  // PRIORITY 5:
  // Preserve authored severity if present
  // ONLY after escalation checks
  // ─────────────────────────────────────────

  if (
    existingSeverity &&
    ["high", "medium", "low"].includes(existingSeverity)
  ) {
    return existingSeverity;
  }

  // ─────────────────────────────────────────
  // DEFAULT
  // ─────────────────────────────────────────

  return "low";
}
