export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3.5 bg-[#111418] border border-[#2a3340] rounded-xl w-fit">
      <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-bounce-dot" />
      <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-bounce-dot-2" />
      <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-bounce-dot-3" />
      <p className="font-mono text-xs text-[#8a9bb0] ml-1">
        ARIA is analyzing...
      </p>
    </div>
  );
}
