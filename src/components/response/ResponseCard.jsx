import { useState } from "react";
import CompactAssistantMessage from "../CompactAssistantMessage";
import CriticalAlert from "../CriticalAlert";
import FallbackNotice from "../FallbackNotice";
import CategoryBadge from "./CategoryBadge";

import RoutingBadge from "./RoutingBadge";

const SEVERITY_COLORS = {
  low: "border-blue-400",
  medium: "border-yellow-400",
  high: "border-orange-500",
  critical:
    "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.45)] animate-criticalPulse",
};

export default function ResponseCard({ response }) {
  const [expanded, setExpanded] = useState({
    steps: true,
    avoid: false,
    help: false,
  });
  const [showCritical, setShowCritical] = useState(true);

  if (response.uiType === "critical" || response.severity === "critical") {
    if (!showCritical) return null;

    return (
      <CriticalAlert
        response={response}
        onClose={() => setShowCritical(false)}
      />
    );
  }
  if (response.uiType === "fallback") {
    return <FallbackNotice response={response} />;
  }
  if (response.uiType === "compact") {
    return <CompactAssistantMessage response={response} />;
  }

  const toggle = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const isOnline = response.mode === "online";
  const severityBorder =
    SEVERITY_COLORS[response.severity] || "border-[#2a3340]";

  return (
    <div
      className={`bg-[#111418] border ${severityBorder} rounded-xl overflow-hidden w-full max-w-sm transition-all duration-300`}
    >
      {/* CRITICAL BANNER */}
      {response.severity === "critical" && (
        <div className="bg-red-500/15 border-b border-red-500 px-3 py-2">
          <p className="text-red-400 font-mono text-[11px] font-bold tracking-wider animate-pulse">
            ⚠ CRITICAL EMERGENCY — IMMEDIATE ACTION REQUIRED
          </p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1a1f26] border-b border-[#1e2530]">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isOnline
                ? "bg-[#00d4aa] shadow-[0_0_6px_#00d4aa]"
                : "bg-[#ff6b35]"
            } animate-blink`}
          />
          <span className="font-mono text-[10px] text-[#8a9bb0] font-bold tracking-wide">
            {isOnline
              ? "AI Response"
              : response.fallback
                ? "Offline Fallback"
                : "Offline Mode"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
              response.severity === "critical"
                ? "bg-red-500 text-white"
                : response.severity === "high"
                  ? "bg-orange-500 text-black"
                  : response.severity === "medium"
                    ? "bg-yellow-400 text-black"
                    : "bg-blue-400 text-black"
            }`}
          >
            {response.severity?.toUpperCase()}
          </span>
          <CategoryBadge category={response.category} />
        </div>
      </div>
      <RoutingBadge response={response} />
      {/* MEMORY NOTICE */}
      {response.source === "memory" && (
        <div className="px-3 py-1 text-[10px] text-yellow-400 font-mono border-b border-[#1e2530]">
          ⚡ Learned from previous situations
        </div>
      )}

      {/* TITLE */}
      <h3 className="font-main text-lg font-bold px-3.5 pt-3 pb-1 text-[#e8ecf0] tracking-tight">
        {response.title}
      </h3>

      {/* SUMMARY */}
      <p className="text-sm text-[#8a9bb0] px-3.5 pb-3 leading-relaxed border-b border-[#1e2530]">
        {response.summary}
      </p>

      {/* STEPS */}
      <div className="border-b border-[#1e2530]">
        <button
          onClick={() => toggle("steps")}
          className="flex items-center gap-2 w-full px-3.5 py-3 text-[#e8ecf0] font-semibold text-sm text-left active:bg-[#1a1f26]"
        >
          <span>✅</span>
          <span className="flex-1">
            {response.uiLabel || "Immediate Steps"}
          </span>
          <span className="text-[#4a5568] text-xs">
            {expanded.steps ? "▲" : "▼"}
          </span>
        </button>

        {expanded.steps && (
          <ol className="px-3.5 pb-3 flex flex-col gap-2">
            {response.steps?.map((step, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#00d4aa] text-[#0a0c0f] flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[13px] text-[#e8ecf0] leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* AVOID */}
      <div className="border-b border-[#1e2530]">
        <button
          onClick={() => toggle("avoid")}
          className="flex items-center gap-2 w-full px-3.5 py-3 text-[#e8ecf0] font-semibold text-sm text-left active:bg-[#1a1f26]"
        >
          <span>🚫</span>
          <span className="flex-1">What NOT To Do</span>
          <span className="text-[#4a5568] text-xs">
            {expanded.avoid ? "▲" : "▼"}
          </span>
        </button>

        {expanded.avoid && (
          <ul className="px-3.5 pb-3 flex flex-col gap-1.5">
            {response.avoid?.map((item, i) => (
              <li
                key={i}
                className="text-[13px] text-[#8a9bb0] leading-relaxed pl-4 relative before:content-['✕'] before:absolute before:left-0 before:text-[#ff4444] before:text-[11px] before:font-bold before:top-0.5"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* WHEN TO SEEK HELP */}
      <div>
        <button
          onClick={() => toggle("help")}
          className="flex items-center gap-2 w-full px-3.5 py-3 text-[#e8ecf0] font-semibold text-sm text-left active:bg-[#1a1f26]"
        >
          <span>🚨</span>
          <span className="flex-1">When To Seek Help</span>
          <span className="text-[#4a5568] text-xs">
            {expanded.help ? "▲" : "▼"}
          </span>
        </button>

        {expanded.help && (
          <ul className="px-3.5 pb-3 flex flex-col gap-1.5">
            {response.when_to_seek_help?.map((item, i) => (
              <li
                key={i}
                className="text-[13px] text-[#8a9bb0] leading-relaxed pl-4 relative before:content-['!'] before:absolute before:left-0 before:text-[#ff8c00] before:text-[11px] before:font-bold before:font-mono before:top-0.5"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
