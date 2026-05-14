/**
 * RoutingBadge.jsx
 *
 * Displays ARIA's routing decision inline in every response card.
 * Shows source, routing reason, and latency.
 *
 * Judges love observable intelligence systems.
 * Users trust a system that explains how it decided.
 */

import { ROUTING_REASONS } from "../../engine/providers/providerRouter";

// ─────────────────────────────────────────────
// SOURCE → STYLE MAP
// ─────────────────────────────────────────────

const SOURCE_STYLES = {
  "gemma-cloud": {
    dot: "bg-[#00d4aa] shadow-[0_0_6px_#00d4aa]",
    text: "text-[#00d4aa]",
    border: "border-[#00d4aa]/30",
    bg: "bg-[#00d4aa]/5",
  },
  mediapipe: {
    dot: "bg-[#0099ff] shadow-[0_0_6px_#0099ff]",
    text: "text-[#0099ff]",
    border: "border-[#0099ff]/30",
    bg: "bg-[#0099ff]/5",
  },
  knowledge: {
    dot: "bg-[#ff6b35]",
    text: "text-[#ff6b35]",
    border: "border-[#ff6b35]/30",
    bg: "bg-[#ff6b35]/5",
  },
  fallback: {
    dot: "bg-yellow-400 animate-pulse",
    text: "text-yellow-300",
    border: "border-yellow-500/30",
    bg: "bg-yellow-900/10",
  },
  memory: {
    dot: "bg-purple-400",
    text: "text-purple-300",
    border: "border-purple-500/30",
    bg: "bg-purple-900/10",
  },
};

const DEFAULT_STYLE = {
  dot: "bg-[#4a5568]",
  text: "text-[#4a5568]",
  border: "border-[#2a3340]",
  bg: "bg-transparent",
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function RoutingBadge({ response }) {
  if (!response) return null;

  const { source, routingReason, latencyMs, mode } = response;

  // Only show for non-trivial sources
  if (!source || source === "conversation") return null;

  const style = SOURCE_STYLES[source] || DEFAULT_STYLE;
  const label = ROUTING_REASONS[routingReason] || `◎ ${source}`;

  return (
    <div
      className={`
        flex items-center justify-between gap-2
        px-2.5 py-1.5 rounded-lg border
        ${style.border} ${style.bg}
        font-mono text-[9px] font-bold tracking-wide
      `}
    >
      {/* LEFT: dot + label */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
        <span className={style.text}>{label}</span>
      </div>

      {/* RIGHT: latency (only for non-instant responses) */}
      {latencyMs > 0 && (
        <span className="text-[#4a5568] tabular-nums">
          {latencyMs < 1000
            ? `${latencyMs}ms`
            : `${(latencyMs / 1000).toFixed(1)}s`}
        </span>
      )}
    </div>
  );
}
