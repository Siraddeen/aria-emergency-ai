/**
 * hybridEngine.js — SHIM
 *
 * This file now delegates entirely to providerRouter.
 * All existing imports of hybridEngine throughout the codebase
 * continue to work without any changes.
 *
 * The real routing logic lives in:
 *   src/engine/providers/providerRouter.js
 */

export {
  getResponse,
  getQuickResponse,
  getNetworkStatus,
  getMediaPipeStatus,
  getMediaPipeStatusSync,
  initMediaPipe,
  setForceNLP,
  getForceNLP,
  ROUTING_REASONS,
} from "./providers/providerRouter";
