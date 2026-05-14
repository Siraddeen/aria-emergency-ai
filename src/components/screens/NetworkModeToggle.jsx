const MODE_OPTIONS = [
  { id: "online", label: "ONLINE", desc: "Cloud Gemma AI" },
  { id: "offline", label: "OFFLINE", desc: "Local KB + MediaPipe" },
];

export default function NetworkModeToggle({
  userMode,
  resolvedMode,
  physicallyOnline,
  onSetMode,
}) {
  return (
    <div className="bg-[#1a1f26] border border-[#2a3340] rounded-xl p-3.5 flex flex-col gap-3">
      {/* STATUS ROW */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#4a5568]">
          ACTIVE ENGINE
        </span>
        <span
          className={`flex items-center gap-1.5 font-mono text-[11px] font-bold
          ${resolvedMode === "online" ? "text-[#00d4aa]" : "text-[#ff6b35]"}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-blink" />
          {resolvedMode === "online"
            ? "Cloud Gemma Active"
            : "Local Engine Active"}
        </span>
      </div>

      {/* TWO MODE BUTTONS */}
      <div className="grid grid-cols-2 gap-1.5">
        {MODE_OPTIONS.map((mode) => {
          const isActive = userMode === mode.id;
          const isDisabled = mode.id === "online" && !physicallyOnline;

          return (
            <button
              key={mode.id}
              onClick={() => !isDisabled && onSetMode(mode.id)}
              className={`flex flex-col items-center gap-0.5 py-3 px-2 rounded-lg border transition-all
                ${
                  isActive
                    ? "bg-[#00d4aa]/10 border-[#00d4aa] text-[#00d4aa]"
                    : isDisabled
                      ? "bg-[#111418] border-[#1e2530] text-[#4a5568] opacity-35 cursor-not-allowed"
                      : "bg-[#111418] border-[#1e2530] text-[#4a5568] active:border-[#2a3340] active:text-[#8a9bb0]"
                }`}
            >
              <span className="font-mono text-[12px] font-bold tracking-wide">
                {mode.label}
              </span>
              <span className="text-[10px] opacity-70">
                {isDisabled ? "No signal" : mode.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* WARNINGS */}
      {!physicallyOnline && userMode === "online" && (
        <p className="font-mono text-[11px] text-[#ff8c00] text-center py-1.5 px-2 bg-orange-900/10 border border-orange-800/30 rounded-lg">
          ⚠ No connection detected — switching to local engine
        </p>
      )}

      {userMode === "offline" && (
        <p className="font-mono text-[11px] text-[#0099ff] text-center py-1.5 px-2 bg-blue-900/10 border border-blue-800/30 rounded-lg">
          ⚡ MediaPipe + NLP engine active
        </p>
      )}
    </div>
  );
}
