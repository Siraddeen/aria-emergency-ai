/**
 * VoiceModeToggle.jsx
 *
 * Small toggle in AssistScreen header to turn voice mode on/off.
 * Shows support status if browser doesn't support recognition.
 */ export default function VoiceModeToggle({
  voiceMode,
  canRecognize,
  canSpeak,
  isSpeaking,
  onToggle,
  onStopSpeaking,
}) {
  if (!canRecognize && !canSpeak) return null;

  return (
    <div className="flex items-center gap-1.5">
      {/* STOP SPEAKING BUTTON */}
      {isSpeaking && voiceMode && (
        <button
          onClick={onStopSpeaking}
          className="font-mono text-[10px] text-[#ff6b35] border border-[#ff6b35]/50 px-2 py-1 rounded-lg bg-[#ff6b35]/10 active:bg-[#ff6b35]/20 transition-all animate-pulse"
        >
          ⏸ Stop
        </button>
      )}

      {/* VOICE TOGGLE */}
      <button
        onClick={onToggle}
        title={!canRecognize ? "TTS only" : "Toggle voice mode"}
        className={`
          relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-[11px] font-bold
          transition-all duration-200 overflow-hidden
          ${
            voiceMode
              ? "bg-gradient-to-r from-[#00d4aa]/20 to-[#0099ff]/20 border-[#00d4aa] text-[#00d4aa] shadow-[0_0_12px_rgba(0,212,170,0.25)]"
              : "bg-[#1a1f26] border-[#2a3340] text-[#4a5568] active:border-[#4a5568] active:text-[#8a9bb0]"
          }
        `}
      >
        {/* Animated background when active */}
        {voiceMode && (
          <span className="absolute inset-0 bg-gradient-to-r from-[#00d4aa]/10 to-[#0099ff]/10 animate-pulse" />
        )}
        <span className="relative z-10 text-[13px]">
          {voiceMode ? "🎙" : "🎤"}
        </span>
        <span className="relative z-10 tracking-wide">
          {voiceMode ? "Voice ON" : "Voice"}
        </span>
        {voiceMode && (
          <span className="relative z-10 flex gap-0.5 items-center">
            <span className="w-1 h-2.5 rounded-full bg-[#00d4aa] animate-bounce-dot" />
            <span className="w-1 h-3.5 rounded-full bg-[#00d4aa] animate-bounce-dot-2" />
            <span className="w-1 h-2 rounded-full bg-[#00d4aa] animate-bounce-dot-3" />
          </span>
        )}
      </button>
    </div>
  );
}
