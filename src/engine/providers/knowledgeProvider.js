/**
 * knowledgeProvider.js
 *
 * SINGLE RESPONSIBILITY: Query the 57-scenario NLP knowledge engine.
 *
 * This is the deterministic layer — always works, zero connectivity,
 * zero latency. Used for:
 *   1. CRITICAL queries that bypass AI entirely (speed > creativity)
 *   2. Final fallback when cloud + local AI both fail
 *   3. Quick actions from the home screen
 */

import {
  getOfflineResponse,
  getQuickResponse,
  detectScenario,
  cloudFallbackResponse,
} from "../offlineEngine";

// ─────────────────────────────────────────────
// CRITICAL SCENARIO SET
// These bypass Gemma cloud entirely — deterministic speed wins.
// "not breathing" should never wait 2s for a network roundtrip.
// ─────────────────────────────────────────────

const CRITICAL_BYPASS_PHRASES = new Set([
  "not breathing",
  "no breathing",
  "stopped breathing",
  "cant breathe",
  "can't breathe",
  "no breath",
  "no pulse",
  "cardiac arrest",
  "heart stopped",
  "cpr",
  "chest compressions",
  "severe bleeding",
  "bleeding out",
  "hemorrhage",
  "spurting blood",
  "unconscious",
  "unresponsive",
  "not responding",
  "choking",
  "drowning",
  "electrocution",
  "anaphylaxis",
  "anaphylactic",
  "gunshot",
  "got shot",
]);

/**
 * isCriticalBypass()
 *
 * Returns true if the message matches a phrase that should ALWAYS
 * route to the deterministic knowledge engine — no AI, no latency.
 */
export function isCriticalBypass(userMessage) {
  const lower = (userMessage || "").toLowerCase();
  for (const phrase of CRITICAL_BYPASS_PHRASES) {
    if (lower.includes(phrase)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

/**
 * query()
 *
 * @param {string} userMessage
 * @param {Array}  conversationHistory
 * @param {string} reason  — why we ended up here (for routingReason metadata)
 * @returns {Object}  normalized ARIA response (source: "knowledge")
 *
 * This never throws — it always returns something useful.
 */
export function query(userMessage, conversationHistory = [], reason = "knowledge_engine") {
  const startTime = Date.now();

  const response = getOfflineResponse(userMessage, conversationHistory);

  const latencyMs = Date.now() - startTime;

  return {
    ...response,
    routingReason: reason,
    latencyMs,
  };
}

/**
 * quickQuery()
 *
 * Direct scenario key lookup — used by quick action buttons.
 * Always instant, always deterministic.
 */
export function quickQuery(scenarioKey) {
  return {
    ...getQuickResponse(scenarioKey),
    routingReason: "quick_action",
    latencyMs: 0,
  };
}

/**
 * cloudFallback()
 *
 * Returns the standardized "Cloud AI unavailable" notice card.
 */
export function cloudFallback() {
  return {
    ...cloudFallbackResponse(),
    routingReason: "cloud_quota_exceeded",
  };
}

// Re-export for external use
export { detectScenario };
