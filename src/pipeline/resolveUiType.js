/**
 * resolveUiType.js
 *
 * CRITICAL FIX: fallback/unknown check MUST come before severity checks.
 *
 * RULE ORDER (non-negotiable):
 * 0. Unknown/fallback source → always "fallback" (checked FIRST)
 * 1. Critical severity → "critical"
 * 2. High severity + emergency/medical/warfare intent → "critical"
 * 3. Conversational → "compact"
 * 4. Technical/educational → "informational"
 * 5. Engine uiType as tiebreaker
 * 6. Default → "standard"
 */

export function resolveUiType(response) {
  const { severity, intent, source, fallback, scenarioKey, uiType: engineUiType } = response;

  // ── Rule 0: Fallback / unknown — ALWAYS checked first ──────────────
  if (
    fallback === true ||
    source === "fallback" ||
    source === "clarification" ||
    scenarioKey === "unknown" ||
    scenarioKey === "clarification" ||
    scenarioKey === "cloud_fallback"
  ) {
    return "fallback";
  }

  // ── Rule 1: Critical severity → critical UI ────────────────────────
  if (severity === "critical") {
    return "critical";
  }

  // ── Rule 2: High severity + emergency/medical/warfare → critical UI ─
  if (
    severity === "high" &&
    (intent === "emergency" || intent === "medical" || intent === "warfare")
  ) {
    return "critical";
  }

  // ── Rule 3: Conversational → compact UI ────────────────────────────
  if (intent === "conversational" || source === "conversation") {
    return "compact";
  }

  // ── Rule 4: Technical/educational → informational UI ───────────────
  if (intent === "technical" || intent === "informational") {
    return "informational";
  }

  // ── Rule 5: Engine explicitly set a valid uiType → use it ──────────
  const validUiTypes = ["critical", "standard", "compact", "fallback", "informational"];
  if (engineUiType && validUiTypes.includes(engineUiType)) {
    return engineUiType;
  }

  // ── Default ─────────────────────────────────────────────────────────
  return "standard";
}
