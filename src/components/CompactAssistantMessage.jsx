export default function CompactAssistantMessage({ response }) {
  return (
    <div className="w-full max-w-sm px-3 py-2">
      <div className="bg-[#111418] border border-[#1f2a36] rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />

          <span className="text-[#00d4aa] text-[11px] font-mono font-bold tracking-wide uppercase">
            ARIA Offline
          </span>
        </div>

        <h3 className="text-[#e8ecf0] font-bold text-sm mb-1">
          {response.title}
        </h3>

        <p className="text-[#9aa7b5] text-[13px] leading-relaxed">
          {response.summary}
        </p>
      </div>
    </div>
  );
}
