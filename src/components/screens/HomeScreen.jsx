const QUICK_ACTIONS = [
  {
    key: "fever",
    label: "Fever / Illness",
    icon: "🤒",
    border: "border-l-red-400",
  },
  {
    key: "bleeding",
    label: "Bleeding / Injury",
    icon: "🩹",
    border: "border-l-red-600",
  },
  {
    key: "fire",
    label: "Fire / Danger",
    icon: "🔥",
    border: "border-l-orange-500",
  },
  {
    key: "electricity",
    label: "Electric Shock",
    icon: "⚡",
    border: "border-l-yellow-400",
  },
  {
    key: "water",
    label: "Water Safety",
    icon: "💧",
    border: "border-l-sky-400",
  },
  {
    key: "mental",
    label: "Panic / Stress",
    icon: "🧠",
    border: "border-l-purple-400",
  },
];

export { QUICK_ACTIONS };

// ─────────────────────────────────────────────
// APK download URL — swap this once you push to GitHub Releases
// ─────────────────────────────────────────────
const APK_URL =
  "https://huggingface.co/turbo017/ARIA/resolve/main/ARIA%20V3.apk";

const APK_SIZE = "5.8 MB";

export default function HomeScreen({ onNavigate, onQuickAction, isOnline }) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar flex flex-col gap-6 px-5 pb-6">
      {/* Hero */}
      <div className="flex flex-col items-center pt-10 pb-2 gap-3">
        <div
          className="relative w-18 h-18 flex items-center justify-center"
          style={{ width: 72, height: 72 }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-[#00d4aa] animate-pulse-ring" />
          <div
            className="w-13 h-13 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#0099ff] flex items-center justify-center font-mono text-2xl font-bold text-[#0a0c0f] z-10"
            style={{ width: 52, height: 52 }}
          >
            A
          </div>
        </div>
        <h1 className="font-mono text-3xl font-bold tracking-[0.15em] text-[#00d4aa]">
          ARIA
        </h1>
        <p className="text-[13px] text-[#8a9bb0] tracking-wide text-center max-w-[260px] leading-relaxed">
          Adaptive Resilience Intelligence Assistant
        </p>
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono text-[11px] font-bold tracking-wide
          ${
            isOnline
              ? "bg-[#00d4aa]/10 border-[#00d4aa] text-[#00d4aa]"
              : "bg-[#ff6b35]/10 border-[#ff6b35] text-[#ff6b35]"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-blink" />
          {isOnline
            ? "AI Online — Full Capability"
            : "Offline Mode — Local Knowledge Active"}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-2.5">
        <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#4a5568]">
          EMERGENCY QUICK ACCESS
        </p>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.key}
            onClick={() => {
              onQuickAction(action.key, action.label);
              onNavigate("assist");
            }}
            className={`flex items-center gap-3.5 px-4 py-3.5 bg-[#111418] border border-[#1e2530] border-l-4 ${action.border} rounded-lg w-full text-left active:bg-[#1a1f26] active:translate-x-0.5 transition-all`}
          >
            <span className="text-xl">{action.icon}</span>
            <span className="flex-1 text-[15px] font-semibold text-[#e8ecf0] tracking-tight">
              {action.label}
            </span>
            <span className="text-[#4a5568] text-base">→</span>
          </button>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => onNavigate("assist")}
        className="flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-[#00d4aa] to-[#0099ff] rounded-xl font-main text-base font-bold tracking-wide text-[#0a0c0f] active:opacity-80 active:scale-[0.98] transition-all"
      >
        <span>⊕</span> Ask ARIA Anything
      </button>

      {/* ── MOBILE APP DOWNLOAD ────────────────────── */}
      <div className="rounded-2xl border border-[#1e2530] bg-[#111418] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2530]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#0099ff] flex items-center justify-center font-mono text-sm font-bold text-[#0a0c0f] flex-shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#e8ecf0] font-bold text-sm">ARIA for Android</p>
            <p className="text-[#4a5568] font-mono text-[10px]">
              v1.0.0 · {APK_SIZE} · No Play Store needed
            </p>
          </div>
          <span className="font-mono text-[10px] font-bold text-[#00d4aa] bg-[#00d4aa]/10 border border-[#00d4aa]/30 px-2 py-0.5 rounded-full flex-shrink-0">
            FREE
          </span>
        </div>

        {/* Feature pills */}
        <div className="flex gap-2 px-4 py-3 flex-wrap">
          {[
            { icon: "⚡", label: "Works Offline" },
            { icon: "🧠", label: "On-device AI" },
            { icon: "🛡", label: "57 Scenarios" },
          ].map((f) => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 font-mono text-[10px] text-[#8a9bb0] bg-[#1a1f26] border border-[#2a3340] px-2.5 py-1 rounded-full"
            >
              <span>{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* Download button */}
        <div className="px-4 pb-4">
          <a
            href={APK_URL}
            download="ARIA.apk"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#1a1f26] border border-[#2a3340] hover:border-[#00d4aa]/50 hover:bg-[#00d4aa]/5 rounded-xl transition-all group"
          >
            <span className="text-lg">📥</span>

            <div className="text-left">
              <p className="text-[#e8ecf0] font-bold text-sm group-hover:text-[#00d4aa] transition-colors">
                Download APK
              </p>

              <p className="font-mono text-[10px] text-[#4a5568]">
                Android 8.0+ · Sideload required
              </p>
            </div>
          </a>

          {/* Sideload hint */}
          <p className="text-center font-mono text-[10px] text-[#4a5568] mt-2.5 leading-relaxed">
            Settings → Install unknown apps → Allow
          </p>
        </div>
      </div>
      {/* ── END MOBILE APP DOWNLOAD ───────────────── */}
    </div>
  );
}

// const QUICK_ACTIONS = [
//   {
//     key: "fever",
//     label: "Fever / Illness",
//     icon: "🤒",
//     border: "border-l-red-400",
//   },
//   {
//     key: "bleeding",
//     label: "Bleeding / Injury",
//     icon: "🩹",
//     border: "border-l-red-600",
//   },
//   {
//     key: "fire",
//     label: "Fire / Danger",
//     icon: "🔥",
//     border: "border-l-orange-500",
//   },
//   {
//     key: "electricity",
//     label: "Electric Shock",
//     icon: "⚡",
//     border: "border-l-yellow-400",
//   },
//   {
//     key: "water",
//     label: "Water Safety",
//     icon: "💧",
//     border: "border-l-sky-400",
//   },
//   {
//     key: "mental",
//     label: "Panic / Stress",
//     icon: "🧠",
//     border: "border-l-purple-400",
//   },
// ];

// export { QUICK_ACTIONS };

// export default function HomeScreen({ onNavigate, onQuickAction, isOnline }) {
//   return (
//     <div className="h-full overflow-y-auto no-scrollbar flex flex-col gap-6 px-5 pb-6">
//       {/* Hero */}
//       <div className="flex flex-col items-center pt-10 pb-2 gap-3">
//         <div
//           className="relative w-18 h-18 flex items-center justify-center"
//           style={{ width: 72, height: 72 }}
//         >
//           <div className="absolute inset-0 rounded-full border-2 border-[#00d4aa] animate-pulse-ring" />
//           <div
//             className="w-13 h-13 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#0099ff] flex items-center justify-center font-mono text-2xl font-bold text-[#0a0c0f] z-10"
//             style={{ width: 52, height: 52 }}
//           >
//             A
//           </div>
//         </div>
//         <h1 className="font-mono text-3xl font-bold tracking-[0.15em] text-[#00d4aa]">
//           ARIA
//         </h1>
//         <p className="text-[13px] text-[#8a9bb0] tracking-wide text-center max-w-[260px] leading-relaxed">
//           Adaptive Resilience Intelligence Assistant
//         </p>
//         <div
//           className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono text-[11px] font-bold tracking-wide
//           ${
//             isOnline
//               ? "bg-[#00d4aa]/10 border-[#00d4aa] text-[#00d4aa]"
//               : "bg-[#ff6b35]/10 border-[#ff6b35] text-[#ff6b35]"
//           }`}
//         >
//           <span className="w-1.5 h-1.5 rounded-full bg-current animate-blink" />
//           {isOnline
//             ? "AI Online — Full Capability"
//             : "Offline Mode — Local Knowledge Active"}
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <div className="flex flex-col gap-2.5">
//         <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#4a5568]">
//           EMERGENCY QUICK ACCESS
//         </p>
//         {QUICK_ACTIONS.map((action) => (
//           <button
//             key={action.key}
//             onClick={() => {
//               onQuickAction(action.key, action.label);
//               onNavigate("assist");
//             }}
//             className={`flex items-center gap-3.5 px-4 py-3.5 bg-[#111418] border border-[#1e2530] border-l-4 ${action.border} rounded-lg w-full text-left active:bg-[#1a1f26] active:translate-x-0.5 transition-all`}
//           >
//             <span className="text-xl">{action.icon}</span>
//             <span className="flex-1 text-[15px] font-semibold text-[#e8ecf0] tracking-tight">
//               {action.label}
//             </span>
//             <span className="text-[#4a5568] text-base">→</span>
//           </button>
//         ))}
//       </div>

//       {/* CTA */}
//       <button
//         onClick={() => onNavigate("assist")}
//         className="flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-[#00d4aa] to-[#0099ff] rounded-xl font-main text-base font-bold tracking-wide text-[#0a0c0f] active:opacity-80 active:scale-[0.98] transition-all"
//       >
//         <span>⊕</span> Ask ARIA Anything
//       </button>
//     </div>
//   );
// }
