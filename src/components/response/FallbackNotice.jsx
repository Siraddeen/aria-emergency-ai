/**
 * FallbackNotice.jsx
 *
 * Renders for uiType="fallback":
 *   - Unknown/low-confidence responses ("Limited Offline Understanding")
 *   - Clarification requests ("Tell Me More")
 *   - Cloud fallback notices (429 / degraded mode)
 *
 * Fix: shows steps as guidance bullets when available,
 * and replaces the always-empty systemNotice bar with
 * a helpful "tip" derived from the response context.
 */

export default function FallbackNotice({ response }) {
  const isCloudFallback = response.scenarioKey === "cloud_fallback";
  const isClarification = response.scenarioKey === "clarification";

  // Derive a contextual tip instead of always-blank systemNotice
  const tip = isCloudFallback
    ? "Offline intelligence active — all emergency guidance still available."
    : isClarification
    ? "Tip: describe what happened, who is affected, and any symptoms."
    : "Tip: include keywords like 'bleeding', 'not breathing', or 'fell from'.";

  return (
    <div className="mx-3 mb-3 rounded-2xl border border-yellow-500/40 bg-[#16120a] overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative flex-shrink-0">
          <div className="w-4 h-4 rounded-full bg-yellow-400 animate-spin" />
          <div className="absolute inset-0 rounded-full border border-yellow-300/40 animate-ping" />
        </div>

        <div className="flex-1">
          <h3 className="text-yellow-300 font-bold text-sm">{response.title}</h3>
          <p className="text-yellow-100/80 text-xs mt-1 leading-relaxed">
            {response.summary}
          </p>
        </div>
      </div>

      {/* GUIDANCE STEPS — shown when available (clarification bullets) */}
      {response.steps?.length > 0 && (
        <ul className="px-4 pb-3 flex flex-col gap-1.5 border-t border-yellow-500/20">
          {response.steps.map((step, i) => (
            <li
              key={i}
              className="text-yellow-100/70 text-xs leading-relaxed flex gap-2 items-start pt-1.5"
            >
              <span className="text-yellow-400 font-bold flex-shrink-0">›</span>
              {step}
            </li>
          ))}
        </ul>
      )}

      {/* BOTTOM TIP BAR */}
      <div className="px-4 py-2 border-t border-yellow-500/20 text-[11px] text-yellow-200/60 font-mono">
        {tip}
      </div>
    </div>
  );
}
