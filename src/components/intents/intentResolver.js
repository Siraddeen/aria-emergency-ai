/**
 * intentResolver.js
 *
 * Resolves intent from normalized response.
 * Called AFTER resolveSeverity so we can use severity in our logic.
 *
 * PRIORITY ORDER:
 * 1. Engine already set a valid intent → trust it (offlineEngine sets these via INTENT_MAP)
 * 2. Severity === "critical" → "emergency" (catch-all for fallback responses)
 * 3. Source/category signals → derive intent
 * 4. Default → "informational"
 */

import { INTENTS } from "./intentConfig";

// Valid intent values — must match intentConfig.js
const VALID_INTENTS = new Set(Object.values(INTENTS));

export function resolveIntent(response) {
  // ── Priority 1: Engine-set intent ─────────────────────────────────
  // offlineEngine.js sets intent via INTENT_MAP for every known scenario.
  // If it's a valid intent value, trust it completely.
  if (response.intent && VALID_INTENTS.has(response.intent)) {
    return response.intent;
  }

  // ── Priority 2: Critical severity → emergency intent ───────────────
  // Catches fallback/unknown responses where the userQuery triggered
  // critical severity but no scenario was matched.
  if (response.severity === "critical") {
    return INTENTS.EMERGENCY;
  }

  // ── Priority 3: Source-based derivation ────────────────────────────
  if (response.source === "conversation") {
    return INTENTS.CONVERSATIONAL;
  }

  if (response.fallback === true || response.source === "fallback") {
    return INTENTS.UNSUPPORTED;
  }

  if (response.source === "clarification") {
    return INTENTS.UNSUPPORTED;
  }

  // ── Priority 4: Category-based derivation ──────────────────────────
  const categoryMap = {
    health: INTENTS.MEDICAL,
    medical: INTENTS.MEDICAL,
    survival: INTENTS.SURVIVAL,
    communication: INTENTS.COMMUNICATION,
    fire: INTENTS.EMERGENCY,
    warfare: INTENTS.EMERGENCY,
  };

  if (response.category && categoryMap[response.category]) {
    return categoryMap[response.category];
  }

  // ── Default ─────────────────────────────────────────────────────────
  return INTENTS.INFORMATIONAL;
}
