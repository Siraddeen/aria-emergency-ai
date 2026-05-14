import { processResponse } from "../pipeline/processResponse";
import knowledge from "../data/knowledge.json";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const MIN_CONFIDENCE = 0.18;
const CONTEXT_WINDOW = 3;
const CONTEXT_DECAY = 0.5;
const MIN_CONTEXT_SCORE_FOR_ESCALATION = 4;

// ─────────────────────────────────────────────
// CRITICAL SCENARIO GATE
// ─────────────────────────────────────────────

const CRITICAL_SCENARIOS = new Set([
  "cpr",
  "bleeding",
  "gunshot_wound",
  "chemical_attack",
  "allergic_reaction",
  "childbirth_emergency",
  "nuclear_radiation",
  "electricity",
  "burns",
  "snakebite",
  "infection_sepsis",
  "triage",
  "spinal_injury",
  "bone_fracture",
  "fire", // ← added
  "gas_leak", // ← added
  "poison_ingestion", // ← added
  "explosive_landmine", // ← added
  "heat_exhaustion", // ← added
]);

// ─────────────────────────────────────────────
// INTENT MAP
// ─────────────────────────────────────────────

const INTENT_MAP = {
  cpr: "emergency",
  bleeding: "emergency",
  gunshot_wound: "emergency",
  chemical_attack: "emergency",
  allergic_reaction: "emergency",
  childbirth_emergency: "emergency",
  nuclear_radiation: "emergency",
  electricity: "emergency",
  burns: "emergency",
  snakebite: "emergency",
  infection_sepsis: "emergency",
  triage: "emergency",
  spinal_injury: "emergency",
  bone_fracture: "medical",
  fever: "medical",
  wound_closure: "medical",
  heat_exhaustion: "medical",
  dehydration_treatment: "medical",
  pregnancy_complications: "medical",
  psychological_first_aid: "medical",
  medicine_improvised: "medical",
  hypothermia: "medical",
  poison_ingestion: "medical",
  eye_injury: "medical",
  allergic_reaction: "emergency",
  insect_stings: "medical",
  childrens_emergency: "medical",
  water: "survival",
  water_purification_advanced: "survival",
  water_collection: "survival",
  food: "survival",
  food_preservation: "survival",
  shelter: "survival",
  fire_making: "survival",
  navigation: "survival",
  signal_rescue: "survival",
  plant_identification: "survival",
  long_term_survival: "survival",
  animal_threats: "survival",
  bridge_crossing: "survival",
  sanitation: "survival",
  vehicle_survival: "survival",
  knots_rigging: "survival",
  solar_power: "technical",
  battery_diy: "technical",
  electricity_generation: "technical",
  communication_security: "technical",
  building_defenses: "technical",
  document_preservation: "technical",
  radio_communication: "technical",
  electricity_wiring: "technical",
  communications_no_phone: "technical",
  explosive_landmine: "warfare",
  gas_leak: "warfare",
  chemical_attack: "warfare",
  nuclear_radiation: "warfare",
  fire: "emergency",
  mental: "medical",
  penicillin_antibiotics: "technical",
  improvised_weapons: "survival",
  animal_bite: "medical",
};

// ─────────────────────────────────────────────
// STOP WORDS
// ─────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "it",
  "in",
  "on",
  "at",
  "to",
  "do",
  "i",
  "am",
  "are",
  "was",
  "be",
  "my",
  "me",
  "we",
  "he",
  "she",
  "they",
  "you",
  "and",
  "or",
  "but",
  "if",
  "of",
  "for",
  "so",
  "with",
  "how",
  "what",
  "when",
  "where",
  "who",
  "can",
  "have",
  "has",
  "had",
  "not",
  "this",
  "that",
  "need",
  "help",
  "please",
  "just",
  "right",
  "now",
  "get",
  "got",
  "use",
  "feel",
  "feels",
  "feeling",
  "very",
  "also",
  "about",
  "from",
  "by",
  "up",
  "out",
  "as",
  "no",
  "yes",
  "okay",
  "ok",
  "then",
  "after",
  "before",
  "again",
  "still",
  "already",
  "him",
  "her",
  "his",
  "hers",
  "them",
  "their",
  "our",
  "its",
  "more",
  "some",
  "been",
]);

// ─────────────────────────────────────────────
// DISAMBIGUATION RULES
// When two scenarios conflict, these rules override the score winner.
// Format: { detect: [tokens that must ALL be present], winner: scenarioKey }
// Checked AFTER scoring, BEFORE selectBestMatch returns.
// ─────────────────────────────────────────────

const DISAMBIGUATION_RULES = [
  // "fall/fell" + "building/floor/height/roof/stairs" → always fall_injury
  // This prevents fire scenario winning because "building" hits its keywords
  {
    detect: [
      ["fall", "building"],
      ["fell", "building"],
      ["fall", "floor"],
      ["fell", "floor"],
      ["fall", "height"],
      ["fell", "height"],
      ["fall", "roof"],
      ["fell", "roof"],
      ["fall", "stairs"],
      ["fell", "stairs"],
    ],
    winner: "spinal_injury",
    boost: 8,
  },
  // "water" + "smell/smelling/smells/taste/dirty/contaminated" → water_contamination
  {
    detect: [
      ["water", "smell"],
      ["water", "smelling"],
      ["water", "smells"],
      ["water", "taste"],
      ["water", "dirty"],
      ["water", "contaminated"],
      ["water", "weird"],
    ],
    winner: "water_purification_advanced",
    boost: 8,
  },
  // "fire" + "house/home/room/inside/trapped" WITHOUT "fall/fell" → fire scenario
  {
    detect: [
      ["fire", "house"],
      ["fire", "home"],
      ["fire", "room"],
      ["fire", "inside"],
      ["fire", "trapped"],
    ],
    winner: "fire",
    boost: 6,
    exclude: ["fall", "fell"], // don't apply if user also said fall
  },
  // "solar" + any of these → solar_power
  {
    detect: [
      ["solar", "panel"],
      ["solar", "power"],
      ["solar", "kit"],
      ["solar", "setup"],
      ["solar", "energy"],
      ["solar", "home"],
      ["solar", "inverter"],
    ],
    winner: "solar_power",
    boost: 7,
  },
];

// ─────────────────────────────────────────────
// TYPO NORMALIZER
// ─────────────────────────────────────────────

function normalizeTypos(text) {
  return text
    .replace(/\bfoll\b/g, "fall")
    .replace(/\bfalling\b/g, "fall")
    .replace(/\bfallen\b/g, "fall")
    .replace(/\bbreth\b/g, "breath")
    .replace(/\bbreeth\b/g, "breathe")
    .replace(/\bcant breath\b/g, "cant breathe")
    .replace(/\bbleading\b/g, "bleeding")
    .replace(/\bbleding\b/g, "bleeding")
    .replace(/\bsmeling\b/g, "smelling")
    .replace(/\bsmellin\b/g, "smelling")
    .replace(/\bburining\b/g, "burning")
    .replace(/\bburnnig\b/g, "burning")
    .replace(/\bunconsious\b/g, "unconscious")
    .replace(/\bunconcius\b/g, "unconscious")
    .replace(/\bsolar kit\b/g, "solar panel")
    .replace(/\bsolar power kit\b/g, "solar panel")
    .replace(/\bseizer\b/g, "seizure");
}

// ─────────────────────────────────────────────
// PHRASE SIGNALS
// ─────────────────────────────────────────────

const PHRASE_SIGNALS = [
  // CPR / cardiac
  ["not breathing", "cpr", 5],
  ["cant breath", "cpr", 5],
  ["cant breathe", "cpr", 5],
  ["no breath", "cpr", 5],
  ["no pulse", "cpr", 5],
  ["cardiac arrest", "cpr", 5],
  ["heart stopped", "cpr", 5],
  ["chest compressions", "cpr", 4],
  ["stopped breathing", "cpr", 4],
  ["isnt breathing", "cpr", 4],
  ["not responding", "cpr", 3],
  ["stopped responding", "cpr", 3],
  ["wont wake up", "cpr", 3],
  ["wont wake", "cpr", 3],
  ["unconscious", "cpr", 3],
  ["not able to breathe", "cpr", 5],
  ["unable to breathe", "cpr", 5],
  ["not able to breath", "cpr", 5],
  // Bleeding
  ["red streaks", "infection_sepsis", 5],
  ["blood poisoning", "infection_sepsis", 5],
  ["spreading redness", "infection_sepsis", 4],
  ["arterial bleeding", "bleeding", 5],
  ["spurting blood", "bleeding", 5],
  ["wont stop bleeding", "bleeding", 4],
  ["lots of blood", "bleeding", 3],
  ["heavy bleeding", "bleeding", 4],
  ["bleeding badly", "bleeding", 4],
  // Gunshot
  ["sucking wound", "gunshot_wound", 5],
  ["chest wound", "gunshot_wound", 4],
  ["bullet hole", "gunshot_wound", 5],
  ["gun shot", "gunshot_wound", 4],
  ["got shot", "gunshot_wound", 4],
  // Fever / heat
  ["high fever", "fever", 3],
  ["burning up", "fever", 3],
  ["heat stroke", "heat_exhaustion", 5],
  ["heat exhaustion", "heat_exhaustion", 5],
  // Water
  ["no water", "water", 4],
  ["dirty water", "water", 3],
  ["water source", "water", 3],
  ["need water", "water", 3],
  // Water contamination
  ["water smell", "water_purification_advanced", 4],
  ["water is smelling", "water_purification_advanced", 5],
  ["water smells", "water_purification_advanced", 5],
  ["smells weird", "water_purification_advanced", 3],
  ["bad smell water", "water_purification_advanced", 5],
  ["water smelling bad", "water_purification_advanced", 5],
  ["water tastes bad", "water_purification_advanced", 4],
  ["water looks dirty", "water_purification_advanced", 4],
  ["weird smell water", "water_purification_advanced", 4],
  ["smelling water", "water_purification_advanced", 3],
  ["is smelling", "water_purification_advanced", 3],
  // Warfare
  ["chemical attack", "chemical_attack", 5],
  ["gas attack", "chemical_attack", 5],
  ["nerve agent", "chemical_attack", 5],
  ["land mine", "explosive_landmine", 5],
  ["trip wire", "explosive_landmine", 4],
  ["suspicious object", "explosive_landmine", 4],
  ["unexploded bomb", "explosive_landmine", 5],
  ["nuclear blast", "nuclear_radiation", 5],
  ["radiation exposure", "nuclear_radiation", 5],
  ["fallout shelter", "nuclear_radiation", 4],
  ["radioactive cloud", "nuclear_radiation", 5],
  // Energy
  ["solar panel", "solar_power", 5],
  ["solar setup", "solar_power", 4],
  ["charge controller", "solar_power", 4],
  ["solar power kit", "solar_power", 5],
  ["solar inverter", "solar_power", 4],
  ["prepare solar", "solar_power", 3],
  ["setup solar", "solar_power", 4],
  ["solar at home", "solar_power", 4],
  ["solar power home", "solar_power", 4],
  ["solar power system", "solar_power", 5],
  ["solar energy", "solar_power", 4],
  ["solar kit", "solar_power", 4],
  ["solar generator", "solar_power", 4],
  ["battery pack", "battery_diy", 4],
  ["car battery", "battery_diy", 4],
  ["generate electricity", "electricity_generation", 4],
  ["no electricity", "electricity_generation", 3],
  ["no power", "electricity_generation", 3],
  // Gas
  ["gas leak", "gas_leak", 5],
  ["smell gas", "gas_leak", 5],
  // Animals / bites
  ["snake bite", "snakebite", 5],
  ["bitten by snake", "snakebite", 5],
  ["anaphylactic shock", "allergic_reaction", 5],
  ["throat closing", "allergic_reaction", 5],
  ["epi pen", "allergic_reaction", 4],
  // Survival
  ["food preservation", "food_preservation", 4],
  ["preserve food", "food_preservation", 4],
  ["start fire", "fire_making", 4],
  ["make fire", "fire_making", 4],
  ["no lighter", "fire_making", 4],
  ["find north", "navigation", 4],
  ["no gps", "navigation", 4],
  ["water filter", "water_purification_advanced", 4],
  ["purify water", "water_purification_advanced", 4],
  ["boil water", "water_purification_advanced", 3],
  ["broken bone", "bone_fracture", 5],
  ["build shelter", "shelter", 4],
  ["emergency shelter", "shelter", 4],
  ["signal for help", "signal_rescue", 4],
  ["rescue signal", "signal_rescue", 4],
  // Medical
  ["mass casualty", "triage", 5],
  ["who to help first", "triage", 5],
  ["multiple casualties", "triage", 5],
  ["willow bark", "medicine_improvised", 5],
  ["natural medicine", "medicine_improvised", 4],
  ["collect water", "water_collection", 4],
  ["morning dew", "water_collection", 4],
  ["close wound", "wound_closure", 4],
  ["stitch wound", "wound_closure", 4],
  ["childbirth", "childbirth_emergency", 5],
  ["giving birth", "childbirth_emergency", 5],
  ["baby coming", "childbirth_emergency", 4],
  ["labor contractions", "childbirth_emergency", 4],
  ["long term survival", "long_term_survival", 5],
  ["secure communication", "communication_security", 4],
  ["sandbag wall", "building_defenses", 5],
  ["defensive position", "building_defenses", 4],
  ["animal attack", "animal_threats", 5],
  ["bear attack", "animal_threats", 5],
  ["important documents", "document_preservation", 4],
  ["edible plants", "plant_identification", 4],
  ["safe to eat", "plant_identification", 3],
  ["cross river", "bridge_crossing", 4],
  ["psychological first aid", "psychological_first_aid", 5],
  // Fall / injury — boosted weights to beat fire keyword accumulation
  ["fell from", "spinal_injury", 5],
  ["fall from building", "spinal_injury", 8],
  ["fell from building", "spinal_injury", 8],
  ["fell down stairs", "spinal_injury", 5],
  ["fell off", "spinal_injury", 5],
  ["fall from height", "spinal_injury", 7],
  ["fell from height", "spinal_injury", 7],
  ["fell down", "spinal_injury", 4],
  ["hard fall", "spinal_injury", 3],
  ["fallen from", "spinal_injury", 5],
  ["fell from a", "spinal_injury", 6],
  ["fall from a", "spinal_injury", 6],
  // Fire — around/in house context
  ["fire around", "fire", 5],
  ["fire in the house", "fire", 5],
  ["house on fire", "fire", 5],
  ["building on fire", "fire", 5],
  ["room on fire", "fire", 5],
  ["fire around the house", "fire", 6],
  // Burns / fire
  ["burning skin", "burns", 4],
  ["severe burn", "burns", 5],
  ["caught fire", "burns", 4],
  // Electric
  ["electric wire", "electricity", 5],
  ["wire exposed", "electricity", 4],
  // Drowning
  ["under water", "cpr", 4],
  ["someone drowning", "cpr", 5],
];

// ─────────────────────────────────────────────
// CONTEXT ESCALATION RULES
// ─────────────────────────────────────────────

const CONTEXT_ESCALATION = [
  {
    from: "bleeding",
    triggers: [
      "responding",
      "unconscious",
      "breathing",
      "pulse",
      "woke",
      "wake",
      "collapsed",
      "fell",
      "fainted",
    ],
    boost: "cpr",
    weight: 6,
  },
  {
    from: "bone_fracture",
    triggers: [
      "numb",
      "numbness",
      "cannot feel",
      "back hurts",
      "neck hurts",
      "tingling",
      "paralyzed",
      "can't move",
      "cannot move",
    ],
    boost: "spinal_injury",
    weight: 6,
  },
  {
    from: "fever",
    triggers: [
      "responding",
      "unconscious",
      "collapsed",
      "fitting",
      "seizure",
      "breathing",
    ],
    boost: "cpr",
    weight: 5,
  },
  {
    from: "fire",
    triggers: ["trapped", "burned", "burn", "inside", "cant get out", "smoke"],
    boost: "burns",
    weight: 4,
  },
  {
    from: "gunshot_wound",
    triggers: ["blood", "bleeding", "losing blood", "pale", "cold", "dying"],
    boost: "bleeding",
    weight: 4,
  },
  {
    from: "infection_sepsis",
    triggers: ["unconscious", "collapsed", "responding", "breathing", "pulse"],
    boost: "cpr",
    weight: 5,
  },
  {
    from: "chemical_attack",
    triggers: [
      "breathing",
      "cant breathe",
      "convulsing",
      "twitching",
      "eyes",
      "skin",
      "foaming",
    ],
    boost: "chemical_attack",
    weight: 3,
  },
  {
    from: "dehydration_treatment",
    triggers: [
      "unconscious",
      "responding",
      "confused",
      "breathing",
      "pulse",
      "collapsed",
    ],
    boost: "cpr",
    weight: 4,
  },
  {
    from: "snakebite",
    triggers: [
      "breathing",
      "swelling",
      "cant swallow",
      "paralyzed",
      "eyes",
      "drooping",
    ],
    boost: "snakebite",
    weight: 3,
  },
  {
    from: "pregnancy_complications",
    triggers: [
      "pushing",
      "crowning",
      "baby",
      "born",
      "contractions",
      "water broke",
    ],
    boost: "childbirth_emergency",
    weight: 5,
  },
  {
    from: "heat_exhaustion",
    triggers: [
      "unconscious",
      "responding",
      "collapsed",
      "breathing",
      "pulse",
      "confused",
    ],
    boost: "heat_exhaustion",
    weight: 4,
  },
];

// ─────────────────────────────────────────────
// CASUAL PATTERNS
// ─────────────────────────────────────────────

const casualPatterns = [
  "hello",
  "hi",
  "who are you",
  "thanks",
  "thank you",
  "homelander",
  "how are you",
];

// ─────────────────────────────────────────────
// AMBIGUOUS SINGLE WORDS → clarification
// ─────────────────────────────────────────────

const AMBIGUOUS_SINGLE_WORDS = new Set([
  "water",
  "fire",
  "food",
  "cold",
  "hot",
  "sick",
  "hurt",
  "pain",
  "help",
  "danger",
  "emergency",
  "injured",
  "bleeding",
  "burn",
  "fall",
  "poison",
  "gas",
  "smoke",
  "wound",
  "lost",
  "shelter",
  "fever",
]);

const DETERMINISTIC_EMERGENCIES = [
  {
    triggers: [
      "swallowed bleach",
      "swallowed cleaner",
      "drank bleach",
      "drank chemical",
      "poison cleaner",
      "chemical ingestion",
    ],
    scenario: "poison_ingestion",
  },

  {
    triggers: ["not breathing", "no pulse", "cardiac arrest"],
    scenario: "cpr",
  },

  {
    triggers: ["spurting blood", "bleeding badly", "bleeding out"],
    scenario: "bleeding",
  },

  {
    triggers: ["electrocuted", "electric shock", "live wire"],
    scenario: "electricity",
  },
];

// ─────────────────────────────────────────────
// TOKENIZER
// ─────────────────────────────────────────────

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// ─────────────────────────────────────────────
// DISAMBIGUATION — apply after scoring
// Detects token combos that should hard-override the winner
// ─────────────────────────────────────────────

function applyDisambiguation(scores, inputText) {
  const tokens = tokenize(inputText);
  const text = inputText.toLowerCase();

  for (const rule of DISAMBIGUATION_RULES) {
    // Check exclude tokens — if any present, skip this rule
    if (
      rule.exclude &&
      rule.exclude.some((ex) => tokens.includes(ex) || text.includes(ex))
    ) {
      continue;
    }

    // Check if ANY of the detect token pairs both appear in input
    const triggered = rule.detect.some((pair) =>
      pair.every((token) => tokens.includes(token) || text.includes(token)),
    );

    if (triggered && scores[rule.winner] !== undefined) {
      scores[rule.winner] += rule.boost;
      console.log(
        `[ARIA Disambig] Rule triggered → ${rule.winner} (+${rule.boost})`,
      );
    }
  }

  return scores;
}

// ─────────────────────────────────────────────
// CORE SCENARIO SCORER
// ─────────────────────────────────────────────

function scoreInput(inputText, multiplier = 1.0) {
  const safeInput = (inputText || "").toLowerCase();
  const text = safeInput.replace(/[^\w\s]/g, " ");
  const tokens = tokenize(safeInput);
  const scores = {};

  for (const key of Object.keys(knowledge)) {
    if (key !== "default") scores[key] = 0;
  }

  // PASS 1 — PHRASE MATCHING (dominant)
  for (const signal of PHRASE_SIGNALS) {
    const phrase = (signal?.[0] || "").toLowerCase();
    const scenarioKey = signal?.[1];
    const weight = signal?.[2] || 0;
    if (phrase && text.includes(phrase) && scores[scenarioKey] !== undefined) {
      scores[scenarioKey] += weight * multiplier;
    }
  }

  // PASS 2 — KEYWORD MATCHING (reduced weight)
  for (const [key, scenario] of Object.entries(knowledge)) {
    if (key === "default") continue;
    if (!scenario || !Array.isArray(scenario.keywords)) continue;
    for (const rawKeyword of scenario.keywords) {
      const keyword = (rawKeyword || "").toLowerCase().trim();
      if (!keyword) continue;
      if (keyword.includes(" ") && text.includes(keyword)) {
        scores[key] += 0.7 * multiplier;
      } else {
        for (const token of tokens) {
          if (keyword === token) scores[key] += 0.2 * multiplier;
        }
      }
    }
  }

  // PASS 3 — TITLE TOKEN MATCHING (tiebreaker)
  for (const [key, scenario] of Object.entries(knowledge)) {
    if (key === "default") continue;
    const title = scenario?.title || "";
    const titleTokens = tokenize(title);
    for (const tt of titleTokens) {
      if (tt && tokens.includes(tt)) scores[key] += 0.5 * multiplier;
    }
  }

  return scores;
}

// ─────────────────────────────────────────────
// CONTEXT WINDOW SCORER
// ─────────────────────────────────────────────

function scoreWithContext(currentInput, history = []) {
  let scores = scoreInput(currentInput, 1.0);

  // Apply disambiguation on current input BEFORE context blending
  scores = applyDisambiguation(scores, currentInput);

  const pastUserMessages = history
    .filter((m) => m.role === "user")
    .slice(-CONTEXT_WINDOW)
    .reverse();

  pastUserMessages.forEach((msg, index) => {
    const decay = Math.pow(CONTEXT_DECAY, index + 1);
    const pastScores = scoreInput(msg.content, decay);
    for (const key of Object.keys(scores)) {
      scores[key] += pastScores[key] ?? 0;
    }
  });

  // Context Escalation — guarded by minimum history score
  const historyScores = {};
  for (const key of Object.keys(scores)) historyScores[key] = 0;

  pastUserMessages.forEach((msg, index) => {
    const decay = Math.pow(CONTEXT_DECAY, index + 1);
    const ps = scoreInput(msg.content, decay);
    for (const key of Object.keys(historyScores)) {
      historyScores[key] += ps[key] ?? 0;
    }
  });

  const topHistoryKey = Object.keys(historyScores).reduce((a, b) =>
    historyScores[a] > historyScores[b] ? a : b,
  );
  const topHistoryScore = historyScores[topHistoryKey] ?? 0;

  if (topHistoryScore >= MIN_CONTEXT_SCORE_FOR_ESCALATION) {
    const currentText = currentInput.toLowerCase();
    const currentTokens = tokenize(currentInput);

    for (const rule of CONTEXT_ESCALATION) {
      if (rule.from === topHistoryKey) {
        const triggered = rule.triggers.some(
          (t) => currentText.includes(t) || currentTokens.includes(t),
        );
        if (triggered && scores[rule.boost] !== undefined) {
          scores[rule.boost] += rule.weight;
          console.log(
            `[ARIA Context] Escalation: ${rule.from} → ${rule.boost} (+${rule.weight})`,
          );
        }
      }
    }
  }

  return scores;
}

// ─────────────────────────────────────────────
// BEST MATCH SELECTOR
// ─────────────────────────────────────────────

function selectBestMatch(scores) {
  const maxScore = Math.max(...Object.values(scores));

  if (maxScore <= 0) {
    return { key: "default", confidence: 0, topMatches: [], matchReasons: [] };
  }

  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const bestKey = sorted[0][0];

  const confidence =
    maxScore >= 8
      ? 0.97
      : maxScore >= 5
        ? 0.95
        : maxScore >= 4
          ? 0.8
          : maxScore >= 3
            ? 0.65
            : maxScore >= 2
              ? 0.45
              : 0.2;

  const matchReasons = buildMatchReasons(bestKey, scores[bestKey]);

  return {
    key: confidence >= MIN_CONFIDENCE ? bestKey : "default",
    confidence,
    topMatches: sorted,
    matchReasons,
  };
}

// ─────────────────────────────────────────────
// MATCH REASON BUILDER
// ─────────────────────────────────────────────

function buildMatchReasons(scenarioKey, totalScore) {
  return [
    `Matched scenario: ${scenarioKey}`,
    `Confidence score: ${totalScore.toFixed(1)}`,
  ];
}

function buildDetailedMatchReasons(input, scenarioKey) {
  const text = (input || "").toLowerCase().replace(/[^\w\s]/g, " ");
  const reasons = [];
  for (const signal of PHRASE_SIGNALS) {
    const phrase = (signal?.[0] || "").toLowerCase();
    const key = signal?.[1];
    const weight = signal?.[2] || 0;
    if (key === scenarioKey && text.includes(phrase)) {
      reasons.push(`"${phrase}" detected (+${weight})`);
    }
  }
  return reasons.length > 0
    ? reasons
    : [`Keyword pattern match for ${scenarioKey}`];
}

// ─────────────────────────────────────────────
// MEMORY MATCHING
// ─────────────────────────────────────────────

function findBestMemoryMatch(input, memory) {
  if (!memory || memory.length === 0) return null;
  const tokens = tokenize(input);
  if (tokens.length < 3) return null;

  let bestMatch = null;
  let bestConfidence = 0;

  for (const item of memory) {
    if (!item.tokens || !Array.isArray(item.tokens)) continue;
    let matchCount = 0;
    for (const word of tokens) {
      if (item.tokens.includes(word)) matchCount++;
    }
    const confidence = matchCount / tokens.length;
    if (confidence > bestConfidence && confidence >= 0.65) {
      bestConfidence = confidence;
      bestMatch = item;
    }
  }

  return bestMatch;
}

// ─────────────────────────────────────────────
// INTENT + UI TYPE RESOLVER
// ─────────────────────────────────────────────

function resolveIntentAndUiType(scenarioKey, confidence) {
  const intent = INTENT_MAP[scenarioKey] || "guidance";
  const isCritical = CRITICAL_SCENARIOS.has(scenarioKey) && confidence >= 0.55;
  const uiType = isCritical
    ? "critical"
    : intent === "technical"
      ? "informational"
      : "standard";
  return { intent, uiType };
}

// ─────────────────────────────────────────────
// RESPONSE BUILDERS
// ─────────────────────────────────────────────

function buildResponse(
  scenarioKey,
  confidence,
  userQuery,
  source = "knowledge",
) {
  const scenario = knowledge[scenarioKey] ?? knowledge["default"];
  const { intent, uiType } = resolveIntentAndUiType(scenarioKey, confidence);
  const matchReasons = buildDetailedMatchReasons(userQuery, scenarioKey);

  return processResponse({
    mode: "offline",
    source,
    scenarioKey,
    confidence,
    userQuery,
    intent,
    uiType,
    matchReasons,
    severity: scenario.severity || null,
    title: scenario.title,
    category: scenario.category,
    summary: scenario.summary,
    steps: scenario.steps,
    avoid: scenario.avoid,
    when_to_seek_help: scenario.when_to_seek_help,
  });
}

function buildUnknownResponse(userQuery) {
  return processResponse({
    mode: "offline",
    source: "fallback",
    scenarioKey: "unknown",
    confidence: 0,
    userQuery,
    intent: "guidance",
    uiType: "fallback",
    fallback: true,
    severity: null,
    title: "Limited Offline Understanding",
    category: "general",
    summary:
      "ARIA could not confidently identify this situation in offline mode.",
    steps: [
      "Describe physical symptoms more clearly",
      "Mention pain, injury, danger, or emergency details",
      "Reconnect to internet for advanced AI assistance if possible",
    ],
    avoid: [
      "Do not ignore severe symptoms",
      "Do not rely on uncertain assumptions",
    ],
    when_to_seek_help: [
      "If symptoms worsen",
      "If breathing or consciousness changes",
      "If severe pain or bleeding occurs",
    ],
  });
}

function buildClarificationResponse(userQuery) {
  return processResponse({
    mode: "offline",
    source: "clarification",
    scenarioKey: "clarification",
    confidence: 0,
    userQuery,
    intent: "guidance",
    uiType: "fallback",
    fallback: true,
    severity: "low",
    title: "Tell Me More",
    category: "general",
    summary: `"${userQuery}" could mean many things. Describe your situation in more detail so ARIA can give you the right guidance.`,
    steps: [
      "Is someone injured or in immediate danger?",
      "Describe symptoms: pain, breathing, bleeding, consciousness?",
      "What happened? (fall, fire, bite, chemical exposure, etc.)",
      "How many people are affected?",
    ],
    avoid: ["Do not waste time — describe the emergency clearly"],
    when_to_seek_help: ["If life-threatening danger exists, act immediately"],
  });
}

// ─────────────────────────────────────────────
// PUBLIC: CLOUD FALLBACK
// ─────────────────────────────────────────────

export function cloudFallbackResponse() {
  return processResponse({
    mode: "degraded",
    source: "fallback",
    scenarioKey: "cloud_fallback",
    confidence: 1,
    severity: "medium",
    intent: "system",
    uiType: "fallback",
    fallback: true,
    title: "Cloud AI Temporarily Unavailable",
    category: "system",
    summary:
      "ARIA continues operating using local offline emergency intelligence (429 limit reached)",
    steps: [
      "Emergency assistance remains available offline",
      "Critical survival guidance still works locally",
      "Cloud AI services will retry automatically",
    ],
    avoid: ["Do not rely on cloud-only features temporarily"],
    when_to_seek_help: [
      "Reconnect internet if advanced AI reasoning is required",
    ],
  });
}

// ─────────────────────────────────────────────
// PUBLIC: MAIN OFFLINE RESPONSE
// ─────────────────────────────────────────────

export function getOfflineResponse(input, history = []) {
  const rawInput = (input || "").toLowerCase().trim();
  const normalizedInput = normalizeTypos(rawInput);
  for (const emergency of DETERMINISTIC_EMERGENCIES) {
    for (const trigger of emergency.triggers) {
      if (normalizedInput.includes(trigger)) {
        console.log(
          "[ARIA Offline] Deterministic Emergency:",
          emergency.scenario,
        );

        return processResponse({
          ...knowledge[emergency.scenario],

          scenarioKey: emergency.scenario,

          source: "offline",

          mode: "offline",

          confidence: 100,

          deterministic: true,

          routingReason: "deterministic_emergency",
        });
      }
    }
  }
  // STEP 1 — CASUAL DETECTION
  if (casualPatterns.some((p) => normalizedInput.includes(p))) {
    return processResponse({
      mode: "offline",
      source: "conversation",
      intent: "conversational",
      category: "general",
      severity: "low",
      confidence: 0.95,
      uiType: "compact",
      userQuery: normalizedInput,
      title: "ARIA Offline Assistant",
      summary:
        "Offline mode prioritizes emergency assistance. Describe a safety, medical, survival, or crisis situation.",
      steps: [
        "Describe a medical emergency",
        "Mention injuries or symptoms",
        "Explain danger or survival situation",
      ],
      avoid: ["Do not rely solely on offline mode for critical diagnosis"],
      when_to_seek_help: ["If immediate danger exists"],
    });
  }

  // STEP 2 — SINGLE AMBIGUOUS WORD → clarification
  const tokens = tokenize(normalizedInput);
  if (
    tokens.length <= 1 &&
    AMBIGUOUS_SINGLE_WORDS.has(normalizedInput.trim())
  ) {
    console.log("[ARIA] Ambiguous single word:", normalizedInput);
    return buildClarificationResponse(normalizedInput);
  }

  // STEP 3 — MEMORY MATCH
  try {
    const memory = JSON.parse(localStorage.getItem("aria_memory") || "[]");
    const memMatch = findBestMemoryMatch(normalizedInput, memory);
    if (memMatch) {
      console.log("[ARIA Memory] Match found");
      const { intent, uiType } = resolveIntentAndUiType(
        memMatch.response?.scenarioKey || "default",
        1,
      );
      return processResponse({
        mode: "offline",
        source: "memory",
        confidence: 1,
        userQuery: normalizedInput,
        intent,
        uiType,
        title: memMatch.response?.title || "Memory Match",
        category: memMatch.response?.category || "general",
        severity: memMatch.response?.severity || null,
        summary:
          memMatch.response?.summary ||
          "Related previous emergency guidance found.",
        steps: memMatch.response?.steps || [],
        avoid: memMatch.response?.avoid || [],
        when_to_seek_help: memMatch.response?.when_to_seek_help || [],
      });
    }
  } catch (e) {
    console.warn("[ARIA] Memory read failed:", e);
  }

  // STEP 4 — CONTEXT + SCORING + DISAMBIGUATION
  const scores = scoreWithContext(normalizedInput, history);
  const { key, confidence, topMatches, matchReasons } = selectBestMatch(scores);

  // DEBUG
  console.log("━━━━━━━━━━━━━━━━━━━");
  console.log("[ARIA Offline] RAW INPUT:", rawInput);
  console.log("[ARIA Offline] NORMALIZED:", normalizedInput);
  console.log("[ARIA Offline] TOP MATCHES:", topMatches);
  console.log("[ARIA Offline] SELECTED:", key, "| CONFIDENCE:", confidence);
  console.log("[ARIA Offline] REASONS:", matchReasons);
  console.log("━━━━━━━━━━━━━━━━━━━");

  // STEP 5 — LOW CONFIDENCE → fallback
  if (!key || key === "default" || confidence < MIN_CONFIDENCE) {
    console.warn("[ARIA Offline] Low confidence → fallback");
    return buildUnknownResponse(normalizedInput);
  }

  // STEP 6 — BUILD MATCHED RESPONSE
  return buildResponse(key, confidence, normalizedInput, "knowledge");
}

// ─────────────────────────────────────────────
// PUBLIC: QUICK ACTION
// ─────────────────────────────────────────────

export function getQuickResponse(scenarioKey) {
  if (!knowledge[scenarioKey]) return getOfflineResponse("help");
  return buildResponse(scenarioKey, 1, scenarioKey, "quick");
}

// ─────────────────────────────────────────────
// PUBLIC: SCENARIO DETECTION ONLY
// ─────────────────────────────────────────────

export function detectScenario(input, history = []) {
  const normalized = normalizeTypos((input || "").toLowerCase().trim());

  // ─────────────────────────────────────────────
  // DETERMINISTIC EMERGENCY OVERRIDE
  // Hard-lock critical medical emergencies
  // BEFORE semantic scoring
  // ─────────────────────────────────────────────

  const scores = scoreWithContext(normalized, history);
  const { key } = selectBestMatch(scores);
  return key;
}

// ─────────────────────────────────────────────
// PUBLIC: CRITICAL BYPASS CHECK
// Called by providerRouter before any AI routing.
// Returns true if the input matches a life-threatening
// scenario that must skip AI and go straight to
// the deterministic knowledge engine.
// ─────────────────────────────────────────────

const BYPASS_SCENARIOS = new Set([
  "cpr",
  "bleeding",
  "gunshot_wound",
  "fire",
  "gas_leak",
  "chemical_attack",
  "allergic_reaction",
  "electricity",
  "burns",
  "poison_ingestion",
  "childbirth_emergency",
  "nuclear_radiation",
  "explosive_landmine",
  "spinal_injury",
  "infection_sepsis",
  "heat_exhaustion",
]);

export function isCriticalBypass(input) {
  const normalized = normalizeTypos((input || "").toLowerCase().trim());

  // Deterministic triggers always bypass
  for (const emergency of DETERMINISTIC_EMERGENCIES) {
    for (const trigger of emergency.triggers) {
      if (normalized.includes(trigger)) return true;
    }
  }

  // Score-based bypass for high-confidence critical scenarios
  const scores = scoreInput(normalized, 1.0);
  const { key, confidence } = selectBestMatch(scores);
  return BYPASS_SCENARIOS.has(key) && confidence >= 0.45;
}
// ─────────────────────────────────────────────
// PUBLIC: ALL SCENARIOS
// ─────────────────────────────────────────────

export function getAllScenarios() {
  return Object.entries(knowledge)
    .filter(([key]) => key !== "default")
    .map(([key, scenario]) => ({
      key,
      title: scenario.title,
      category: scenario.category,
      intent: INTENT_MAP[key] || "guidance",
    }));
}
