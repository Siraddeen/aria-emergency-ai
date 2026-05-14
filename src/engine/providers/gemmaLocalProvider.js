/**
 * gemmaLocalProvider.js
 *
 * SINGLE RESPONSIBILITY: Query the local Gemma 2B model via MediaPipe.
 *
 * Returns a normalized ARIA response or throws if not ready.
 * providerRouter decides whether/when to call this.
 */

import { parseMediaPipeResponse } from "../../pipeline/parseMediaPipeResponse";
import { detectScenario } from "../offlineEngine";

// Dynamic import — isolated to prevent mobile crashes on devices that
// don't support WebGPU/WASM. If it fails, this provider is unavailable.
let _mod = null;

async function getModule() {
  if (_mod) return _mod;
  try {
    _mod = await import("../mediaPipeEngine");
    return _mod;
  } catch (err) {
    console.warn("[ARIA LocalProvider] mediaPipeEngine unavailable:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────

export async function getStatus() {
  const mod = await getModule();
  if (!mod) return { isReady: false, isInitializing: false };
  return mod.getMediaPipeStatus();
}

export function getStatusSync() {
  return _mod?.getMediaPipeStatus() ?? { isReady: false, isInitializing: false };
}

// ─────────────────────────────────────────────
// INIT (called by useMediaPipe hook — unchanged)
// ─────────────────────────────────────────────

export async function init(onProgress) {
  const mod = await getModule();
  if (!mod) return false;
  return mod.initMediaPipe(onProgress);
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

/**
 * query()
 *
 * @param {string} userMessage
 * @returns {Promise<Object>}  normalized ARIA response (source: "mediapipe")
 *
 * @throws {Error} "LOCAL_AI_NOT_READY" — model not loaded yet
 * @throws {Error} "TIMEOUT"            — local inference > 45s
 * @throws {Error} Any inference error
 */
export async function query(userMessage) {
  const mod = await getModule();
  if (!mod) throw new Error("LOCAL_AI_NOT_READY");

  const { isReady } = mod.getMediaPipeStatus();
  if (!isReady) throw new Error("LOCAL_AI_NOT_READY");

  const startTime = Date.now();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), 45000)
  );

  const rawText = await Promise.race([
    mod.getMediaPipeResponse(userMessage),
    timeoutPromise,
  ]);

  const latencyMs = Date.now() - startTime;

  // parseMediaPipeResponse extracts structured fields from the LLM prose
  const parsed = parseMediaPipeResponse(rawText, userMessage, detectScenario);

  return {
    ...parsed,
    mode: "offline",
    source: "mediapipe",
    routingReason: "local_ai",
    latencyMs,
  };
}
