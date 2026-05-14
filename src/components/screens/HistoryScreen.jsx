export default function HistoryScreen({ messages, onClear, onSelectHistory }) {
  const assistantMessages = messages.filter((m) => m.role === "assistant");

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-[#1e2530]">
        <h2 className="font-mono text-lg font-bold tracking-wide">
          Session History
        </h2>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="border border-[#ff4444] text-[#ff4444] px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold active:bg-red-900/20 transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      {assistantMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 text-[#4a5568] text-center p-10 min-h-[200px]">
          <span className="font-mono text-4xl text-[#2a3340]">◷</span>
          <p className="text-[15px] leading-relaxed">
            No history yet.
            <br />
            Your emergency queries will appear here.
          </p>
        </div>
      ) : (
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {[...assistantMessages].reverse().map((msg) => (
            <button
              key={msg.id}
              onClick={() => onSelectHistory(msg)}
              className="bg-[#111418] border border-[#1e2530] rounded-xl p-3.5 w-full text-left active:border-[#00d4aa] transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[15px] font-bold text-[#e8ecf0]">
                  {msg.response?.title || "Emergency Query"}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded
                  ${
                    msg.response?.mode === "online"
                      ? "bg-[#00d4aa]/15 text-[#00d4aa]"
                      : "bg-[#ff6b35]/15 text-[#ff6b35]"
                  }`}
                >
                  {msg.response?.mode}
                </span>
              </div>
              <p className="text-[13px] text-[#8a9bb0] italic mb-1.5 leading-snug">
                "{msg.text}"
              </p>
              <p className="font-mono text-[11px] text-[#4a5568]">
                {new Date(msg.timestamp).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
