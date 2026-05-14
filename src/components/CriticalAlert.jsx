/**
 * CriticalAlert.jsx
 *
 * Full-screen critical emergency overlay.
 *
 * FIXES:
 * - Removed `fixed inset-0` — positioning now handled by parent (Total.jsx)
 *   which wraps this in `absolute inset-0` inside the app container.
 * - Removed `backdrop-blur-sm` — causes pure black rendering on Android Chrome
 *   due to GPU compositor layer bug with high-opacity dark overlays.
 * - Component now fills its parent container (h-full w-full flex flex-col).
 */

import EmergencyActions from "./EmergencyActions";

export default function CriticalAlert({ response, onClose }) {
  return (
    <div className="flex flex-col h-full w-full bg-[#050505] overflow-hidden">

      {/* CLOSE BUTTON */}
      <button
        onClick={() => onClose?.()}
        style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}
        className="bg-[#1a1f26] border border-[#2a3340] text-white px-3 py-1.5 rounded-lg text-sm font-bold"
      >
        ✕ CLOSE
      </button>

      {/* CRITICAL HEADER */}
      <div className="bg-red-600 px-4 py-3 border-b border-red-400 flex-shrink-0 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-lg tracking-wider">
              ⚠ CRITICAL EMERGENCY
            </h1>
            <p className="text-red-100 text-sm">Immediate action required</p>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-sm">
              {response.confidence
                ? `${Math.round(
                    response.confidence > 1
                      ? response.confidence
                      : response.confidence * 100
                  )}% match`
                : "High confidence"}
            </div>
            <div className="text-red-100 text-xs uppercase">
              Threat Level Critical
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-5">

        {/* TITLE */}
        <h2 className="text-white text-2xl font-black leading-tight mb-4">
          {response.title}
        </h2>

        {/* SUMMARY */}
        <div className="bg-[#151515] border border-red-500/40 rounded-2xl p-4 mb-5">
          <p className="text-[#d7dce2] text-base leading-relaxed">
            {response.summary}
          </p>
        </div>

        {/* IMMEDIATE STEPS */}
        <div className="space-y-3 mb-5">
          <h3 className="text-red-400 font-black text-base uppercase tracking-wider">
            Immediate Actions
          </h3>
          {response.steps?.map((step, index) => (
            <div
              key={index}
              className="bg-[#111418] border border-[#2a2f36] rounded-xl p-3.5 flex gap-3 items-start"
            >
              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <div className="text-[#f1f5f9] text-sm leading-relaxed">
                {step}
              </div>
            </div>
          ))}
        </div>

        {/* AVOID */}
        {response.avoid?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-orange-400 font-black text-sm uppercase tracking-wider">
              Do NOT
            </h3>
            {response.avoid.map((item, i) => (
              <div
                key={i}
                className="flex gap-3 items-start bg-[#1a0a00] border border-orange-900/40 rounded-xl px-4 py-3"
              >
                <span className="text-orange-400 font-black text-sm flex-shrink-0 mt-0.5">✕</span>
                <span className="text-[#d7a060] text-sm leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM — Emergency Actions */}
      <EmergencyActions />
    </div>
  );
}
