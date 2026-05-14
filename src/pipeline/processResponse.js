/**
 * processResponse.js
 *
 * Pipeline order — each step feeds the next:
 *
 * 1. normalizeResponse  → clean shape, spreads ALL engine fields (userQuery preserved)
 * 2. resolveSeverity    → keyword scan userQuery + knowledge.json severity field
 * 3. resolveIntent      → sets intent if engine didn't provide one
 * 4. resolveUiType      → severity + intent → correct UI component
 *
 * CRITICAL: No || short-circuits that skip recalculation.
 * Each step runs unconditionally and overwrites the previous value.
 *
 * WHY THIS ORDER MATTERS:
 * - normalizeResponse must run first so userQuery survives into resolveSeverity
 * - resolveSeverity must run before resolveUiType (uiType depends on severity)
 * - resolveIntent must run before resolveUiType (uiType depends on intent)
 */

import { normalizeResponse } from "./normalizeResponse";
import { resolveSeverity } from "./resolveSeverity";
import { resolveIntent } from "../components/intents/intentResolver";
import { resolveUiType } from "./resolveUiType";

export function processResponse(raw) {
  // Step 1: Normalize — clean shape, ALL engine fields preserved via spread
  const normalized = normalizeResponse(raw);

  // Step 2: Severity — knowledge.json field wins, then userQuery keyword scan,
  // then response content scan. Never skipped.
  normalized.severity = resolveSeverity(normalized);

  // Step 3: Intent — trust engine value if set, otherwise derive from context
  normalized.intent = resolveIntent(normalized);

  // Step 4: UI type — always recalculate from resolved severity + intent.
  // Engine's uiType is only used as a tiebreaker inside resolveUiType.
  normalized.uiType = resolveUiType(normalized);

  return normalized;
}
