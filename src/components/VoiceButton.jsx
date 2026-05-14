/**
 * VoiceButton.jsx
 *
 * Mic button that sits next to the text input in AssistScreen.
 * Shows live transcript as user speaks.
 * Auto-fills input when speech ends.
 */
import { useEffect } from "react";

export default function VoiceButton({
  voiceMode,
  isListening,
  isSpeaking,
  transcript,
  error,
  canRecognize,
  onToggleListening,
  onTranscriptReady, // called with final transcript → fills input
  clearTranscript,
}) {
  // When transcript finalizes and mic stops → push to input
  useEffect(() => {
    if (!isListening && transcript) {
      onTranscriptReady(transcript);
      clearTranscript();
    }
  }, [isListening, transcript]);

  if (!voiceMode) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* MIC BUTTON */}
      <button
        onClick={onToggleListening}
        disabled={!canRecognize}
        className={`
          w-11 h-11 rounded-full flex items-center justify-center
          flex-shrink-0 transition-all duration-200
          disabled:opacity-30 disabled:cursor-not-allowed
          ${
            isListening
              ? "bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.7)] animate-pulse scale-110"
              : isSpeaking
                ? "bg-[#00d4aa]/20 border-2 border-[#00d4aa] text-[#00d4aa]"
                : "bg-[#1a1f26] border border-[#2a3340] text-[#8a9bb0] active:border-[#00d4aa] active:text-[#00d4aa]"
          }
        `}
        aria-label={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          // Recording — animated waveform icon
          <span className="text-white text-lg">⏹</span>
        ) : isSpeaking ? (
          // ARIA is speaking
          <span className="text-[#00d4aa] text-lg animate-pulse">🔊</span>
        ) : (
          // Idle mic
          <span className="text-lg">🎤</span>
        )}
      </button>

      {/* LIVE STATUS TEXT */}
      {isListening && (
        <span className="font-mono text-[9px] text-red-400 animate-pulse whitespace-nowrap">
          LISTENING...
        </span>
      )}
      {isSpeaking && !isListening && (
        <span className="font-mono text-[9px] text-[#00d4aa] whitespace-nowrap">
          ARIA speaking
        </span>
      )}

      {/* LIVE TRANSCRIPT PREVIEW */}
      {isListening && transcript && (
        <div className="absolute bottom-20 left-4 right-4 bg-[#111418] border border-[#00d4aa]/40 rounded-xl px-3 py-2 z-10">
          <p className="text-[#00d4aa] font-mono text-[11px] font-bold mb-0.5">
            Listening...
          </p>
          <p className="text-[#e8ecf0] text-sm leading-relaxed italic">
            "{transcript}"
          </p>
        </div>
      )}

      {/* ERROR */}
      {error && !isListening && (
        <span className="font-mono text-[9px] text-red-400 text-center max-w-[60px] leading-tight">
          {error.includes("denied") ? "Mic denied" : "Try again"}
        </span>
      )}
    </div>
  );
}
