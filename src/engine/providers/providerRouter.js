/**
 * providerRouter.js
 *
 * ARIA Intelligent Routing Layer
 *
 * CASCADE:
 *
 * CRITICAL →
 *   Knowledge Engine instantly
 *
 * ONLINE →
 *   Gemma 4 Cloud
 *      ↓ fail
 *   Local Gemma
 *      ↓ fail
 *   Knowledge Engine
 *
 * OFFLINE →
 *   Local Gemma
 *      ↓ fail
 *   Knowledge Engine
 */

import { processResponse } from "../../pipeline/processResponse";

import * as CloudProvider from "./gemmaCloudProvider";
import * as LocalProvider from "./gemmaLocalProvider";
import * as KnowledgeProvider from "./knowledgeProvider";

// ─────────────────────────────────────────────
// DEV FLAGS
// ─────────────────────────────────────────────

let _forceNLP = false;

// Prevent quota hammering after 429
let cloudCooldownUntil = 0;

// ─────────────────────────────────────────────
// FORCE NLP
// ─────────────────────────────────────────────

export function setForceNLP(val) {
  _forceNLP = Boolean(val);

  console.log(`[ARIA Router] ForceNLP: ${_forceNLP}`);
}

export function getForceNLP() {
  return _forceNLP;
}

// ─────────────────────────────────────────────
// ROUTING LABELS
// Used by RoutingBadge.jsx
// ─────────────────────────────────────────────

export const ROUTING_REASONS = {
  critical_emergency: "⚡ Critical Emergency — Instant Local Response",

  cloud_ai: "◉ Gemma 4 Cloud Intelligence Active",

  cloud_timeout: "◎ Cloud Timeout — Local AI Active",

  cloud_quota_exceeded: "⚠ Cloud Quota Reached — Offline Intelligence Active",

  cloud_no_key: "○ No HuggingFace Token — Offline Mode",

  cloud_error: "◎ Cloud Unavailable — Local Intelligence Active",

  local_ai: "◉ Local Gemma AI Active",

  local_ai_not_ready: "○ Local AI Loading — Emergency Engine Active",

  knowledge_engine: "◎ Emergency Knowledge Engine Active",

  quick_action: "⚡ Quick Action",

  offline_mode: "◎ Offline Mode — Local Intelligence Active",

  forced_nlp: "○ NLP Engine (Dev Mode)",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function resolveOnline(forcedMode) {
  if (forcedMode === "offline") {
    return false;
  }

  if (forcedMode === "online") {
    return navigator.onLine;
  }

  return navigator.onLine;
}

function finalize(raw, routingReason) {
  return processResponse({
    ...raw,

    routingReason: routingReason || raw.routingReason || "knowledge_engine",
  });
}

// ─────────────────────────────────────────────
// ERROR CLASSIFIER
// ─────────────────────────────────────────────

function classifyCloudError(err) {
  const msg = (err?.message || "").toUpperCase();

  if (msg === "NO_HF_TOKEN") {
    return "cloud_no_key";
  }

  if (msg === "TIMEOUT") {
    return "cloud_timeout";
  }

  if (msg === "EMPTY_RESPONSE") {
    return "cloud_error";
  }

  if (msg === "QUOTA_EXCEEDED") {
    return "cloud_quota_exceeded";
  }

  if (msg.includes("429")) {
    return "cloud_quota_exceeded";
  }

  if (msg.includes("401") || msg.includes("403")) {
    return "cloud_no_key";
  }

  return "cloud_error";
}

// ─────────────────────────────────────────────
// ONLINE CASCADE
// Cloud → Local → Knowledge
// ─────────────────────────────────────────────

async function routeOnline(userMessage, conversationHistory) {
  // ─────────────────────────────
  // CLOUD COOLDOWN
  // ─────────────────────────────

  if (Date.now() < cloudCooldownUntil) {
    console.warn("[ARIA Router] Cloud cooldown active");

    return routeOffline(userMessage, conversationHistory);
  }

  // ─────────────────────────────
  // LAYER 1 — GEMMA 4 CLOUD
  // ─────────────────────────────

  try {
    console.log("[ARIA Router] → Gemma 4 Cloud");

    const raw = await CloudProvider.query(userMessage, conversationHistory);

    return finalize(raw, "cloud_ai");
  } catch (err) {
    const reason = classifyCloudError(err);

    console.warn(`[ARIA Router] Cloud failed (${reason})`, err.message);

    // Activate cooldown after quota hit

    if (reason === "cloud_quota_exceeded") {
      cloudCooldownUntil = Date.now() + 60000;

      console.warn("[ARIA Router] Cloud cooldown = 60s");
    }

    // ─────────────────────────
    // LAYER 2 — LOCAL GEMMA
    // ─────────────────────────

    if (!_forceNLP) {
      try {
        const status = LocalProvider.getStatusSync();

        if (status?.isReady) {
          console.log("[ARIA Router] → Local Gemma");

          const raw = await LocalProvider.query(userMessage);

          return finalize(
            raw,

            reason === "cloud_timeout" ? "cloud_timeout" : "local_ai",
          );
        }

        console.warn("[ARIA Router] Local model not ready");
      } catch (localErr) {
        console.warn("[ARIA Router] Local failed:", localErr.message);
      }
    }

    // ─────────────────────────
    // LAYER 3 — KNOWLEDGE
    // ─────────────────────────

    console.log("[ARIA Router] → Knowledge Engine");

    const isQuota = reason === "cloud_quota_exceeded";

    const isNoKey = reason === "cloud_no_key";

    const raw = KnowledgeProvider.query(
      userMessage,
      conversationHistory,
      reason,
    );
    // If no HF token — silently fall through to knowledge engine
    // Don't show a warning card, just answer normally
    if (isNoKey) {
      return finalize(raw, "knowledge_engine");
    }

    return finalize(
      {
        ...raw,
        fallback: true,
        title: isQuota ? "Cloud AI Quota Reached" : "Cloud AI Unavailable",
        summary: isQuota
          ? "Cloud quota exceeded. ARIA switched to offline emergency intelligence automatically."
          : "Cloud AI unavailable. Running on offline emergency intelligence.",
      },
      reason,
    );
  }
}

// ─────────────────────────────────────────────
// OFFLINE CASCADE
// Local → Knowledge
// ─────────────────────────────────────────────

async function routeOffline(userMessage, conversationHistory) {
  // ─────────────────────────────
  // LOCAL GEMMA
  // ─────────────────────────────

  if (!_forceNLP) {
    try {
      const status = LocalProvider.getStatusSync();

      if (status?.isReady) {
        console.log("[ARIA Router] → Local Gemma (offline)");

        const raw = await LocalProvider.query(userMessage);

        return finalize(raw, "local_ai");
      }

      console.warn("[ARIA Router] Local model not ready");
    } catch (err) {
      console.warn("[ARIA Router] Local offline failed:", err.message);
    }
  }

  // ─────────────────────────────
  // KNOWLEDGE ENGINE
  // ─────────────────────────────

  console.log("[ARIA Router] → Knowledge Engine (offline)");

  const raw = KnowledgeProvider.query(
    userMessage,
    conversationHistory,

    _forceNLP ? "forced_nlp" : "offline_mode",
  );

  return finalize(
    raw,

    _forceNLP ? "forced_nlp" : "offline_mode",
  );
}

// ─────────────────────────────────────────────
// MAIN PUBLIC ROUTER
// ─────────────────────────────────────────────

export async function getResponse(
  userMessage,
  conversationHistory = [],
  forcedMode = "auto",
) {
  // ─────────────────────────────
  // CRITICAL BYPASS
  // ─────────────────────────────

  if (KnowledgeProvider.isCriticalBypass(userMessage)) {
    console.log("[ARIA Router] ⚡ CRITICAL BYPASS");

    const raw = KnowledgeProvider.query(
      userMessage,
      conversationHistory,
      "critical_emergency",
    );

    return finalize(raw, "critical_emergency");
  }

  // ─────────────────────────────
  // ONLINE / OFFLINE DECISION
  // ─────────────────────────────

  const isOnline = resolveOnline(forcedMode);

  return isOnline
    ? routeOnline(userMessage, conversationHistory)
    : routeOffline(userMessage, conversationHistory);
}

// ─────────────────────────────────────────────
// QUICK ACTIONS
// ─────────────────────────────────────────────

export function getQuickResponse(scenarioKey) {
  return finalize(
    KnowledgeProvider.quickQuery(scenarioKey),

    "quick_action",
  );
}

// ─────────────────────────────────────────────
// STATUS HELPERS
// ─────────────────────────────────────────────

export function getNetworkStatus() {
  return navigator.onLine;
}

export async function getMediaPipeStatus() {
  return LocalProvider.getStatus();
}

export function getMediaPipeStatusSync() {
  return LocalProvider.getStatusSync();
}

export async function initMediaPipe(onProgress) {
  return LocalProvider.init(onProgress);
}
