/**
 * AssistScreen.jsx
 */
import { useState, useRef, useEffect } from "react";
import ChatMessage from "../response/ChatMessage";
import TypingIndicator from "../response/TypingIndicator";
import VoiceButton from "../VoiceButton";
import VoiceModeToggle from "../VoiceModeToggle";
import { onDownloadProgress } from "../../engine/mediaPipeEngine";

const QUICK_ACTIONS = [
  { key: "fever", label: "Fever / Illness", icon: "🤒" },
  { key: "bleeding", label: "Bleeding / Injury", icon: "🩹" },
  { key: "fire", label: "Fire / Danger", icon: "🔥" },
  { key: "electricity", label: "Electric Shock", icon: "⚡" },
  { key: "water", label: "Water Safety", icon: "💧" },
  { key: "mental", label: "Panic / Stress", icon: "🧠" },
];

// ── MEDIAPIPE STATUS BANNER ──────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) return `${mb.toFixed(0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function MediaPipeBanner({ mediaPipeStatus }) {
  const [dlProgress, setDlProgress] = useState({
    loaded: 0,
    total: 0,
    active: false,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const unsub = onDownloadProgress(setDlProgress);
    return unsub;
  }, []);

  if (isHidden || !mediaPipeStatus.isInitializing || mediaPipeStatus.isReady) {
    return null;
  }

  const hasRealProgress = dlProgress.total > 0;

  const percent = hasRealProgress
    ? Math.min(100, Math.round((dlProgress.loaded / dlProgress.total) * 100))
    : 0;

  const downloadedMB = (dlProgress.loaded / 1024 / 1024).toFixed(0);

  const totalGB = (dlProgress.total / 1024 / 1024 / 1024).toFixed(2);

  // ─────────────────────────────
  // ACTIONS
  // ─────────────────────────────

  const togglePause = () => {
    const next = !isPaused;

    setIsPaused(next);

    window.ARIA_PAUSE_DOWNLOAD = next;
  };

  const continueInBackground = () => {
    setIsHidden(true);
  };

  const skipOfflineInstall = () => {
    window.ARIA_SKIP_DOWNLOAD = true;
    setIsHidden(true);
  };

  return (
    <div className="w-full max-w-full min-w-0 mb-2 rounded-x1 border border-[#123044] bg-[#09111b] overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="flex items-start justify-between px-3 py-3">
        <div className="flex items-start gap-2">
          <span className="text-[#ff8c42] animate-pulse mt-0.5">⚡</span>

          <div className="flex flex-col">
            <span className="font-mono text-[11px] font-bold tracking-[0.08em] text-[#8ee7ff]">
             Installing Offline AI
            </span>

            <span className="font-mono text-[9px] text-[#5d7b8a] mt-0.5">
            Offline emergency mode active
            </span>
          </div>
        </div>

        <span className="font-mono text-[9px] text-[#4ade80]">one-time</span>
      </div>

      {/* PROGRESS */}
      <div className="px-3 pb-2">
        <div className="w-full h-2 rounded-full overflow-hidden bg-[#13202d]">
          <div
            className="h-full bg-gradient-to-r from-[#00d4aa] to-[#00a6ff] transition-all duration-300"
            style={{
              width: `${percent}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="font-mono text-[10px] text-[#7dd3fc]">
            {downloadedMB} MB / {totalGB} GB
          </span>

          <span className="font-mono text-[10px] text-[#8ee7ff]">
            {percent}%
          </span>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-1.5 px-2 pb-2 w-full">
        <button
          onClick={togglePause}
          className="
flex-1
min-w-0
h-8
rounded-lg
border
font-mono
text-[9px]
tracking-[0.05em]
active:scale-[0.98]
"
        >
          {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
        </button>

        <button
          onClick={continueInBackground}
          className="h-9 rounded-lg border border-[#123044]
        bg-[#0b1724]
        text-[#8ee7ff]
        font-mono text-[10px] tracking-[0.08em]
        active:scale-[0.98]"
        >
          BACKGROUND
        </button>

        <button
          onClick={skipOfflineInstall}
          className="h-9 rounded-lg border border-[#3b1d1d]
        bg-[#1a1010]
        text-[#ff7b7b]
        font-mono text-[10px] tracking-[0.08em]
        active:scale-[0.98]"
        >
          SKIP
        </button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AssistScreen({
  messages,
  isLoading,
  isOnline,
  onSend,
  onQuickAction,
  inputRef,
  setActiveCriticalAlert,
  selectedHistory,
  setSelectedHistory,
  mediaPipeStatus,
  voice,
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const skipNextAutoScroll = useRef(false);

  // ── SCROLL LOGIC ─────────────────────────────
  useEffect(() => {
    if (selectedHistory) {
      const element = document.getElementById(`message-${selectedHistory.id}`);
      const container = messagesContainerRef.current;
      if (element && container) {
        skipNextAutoScroll.current = true;
        container.scrollTo({
          top: element.offsetTop - container.offsetTop - 120,
          behavior: "smooth",
        });
        setSelectedHistory(null);
      }
      return;
    }
    if (skipNextAutoScroll.current) {
      skipNextAutoScroll.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, selectedHistory]);

  // ── SEND ─────────────────────────────────────
  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── VOICE TRANSCRIPT → INPUT ─────────────────
  function handleTranscriptReady(text) {
    if (!text) return;
    setInput(text);
    setTimeout(() => {
      if (text.trim()) {
        onSend(text.trim());
        setInput("");
      }
    }, 600);
  }

  // Show banner only when offline and model isn't ready
  // Show download banner regardless of online/offline — model downloads while online
  const showBanner = !mediaPipeStatus.isReady && mediaPipeStatus.isInitializing;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1e2530] bg-[#111418] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-base font-bold tracking-wide text-[#e8ecf0]">
            Emergency Assist
          </span>

          <div className="flex items-center gap-2">
            <VoiceModeToggle
              voiceMode={voice.voiceMode}
              canRecognize={voice.canRecognize}
              canSpeak={voice.canSpeak}
              isSpeaking={voice.isSpeaking}
              onToggle={voice.toggleVoiceMode}
              onStopSpeaking={voice.stopSpeaking}
            />
            <span
              className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-full border
              ${
                isOnline
                  ? "text-[#00d4aa] border-[#00d4aa] bg-[#00d4aa]/10"
                  : "text-[#ff6b35] border-[#ff6b35] bg-[#ff6b35]/10"
              }`}
            >
              {isOnline ? "◉ Online" : "◎ Offline"}
            </span>
          </div>
        </div>

        {/* QUICK CHIPS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {QUICK_ACTIONS.slice(0, 4).map((a) => (
            <button
              key={a.key}
              onClick={() => onQuickAction(a.key, a.label)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1f26] border border-[#2a3340] rounded-full text-[13px] font-semibold text-[#8a9bb0] whitespace-nowrap flex-shrink-0 active:bg-[#2a3340] active:text-[#e8ecf0] transition-all"
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto  overflow-x-hidden no-scrollbar px-2 sm:px-4 py-3 flex flex-col gap-3 win-w-0"
      >
        {/* MediaPipe state banner */}
        {showBanner && <MediaPipeBanner mediaPipeStatus={mediaPipeStatus} />}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#4a5568] text-center min-h-[200px]">
            <span className="font-mono text-4xl text-[#2a3340]">◎</span>
            <p className="text-[15px] leading-relaxed">
              Describe your situation.
              <br />
              ARIA will guide you step by step.
            </p>
            <p className="text-[13px]">Works online and offline.</p>
            {voice.voiceMode && (
              <p className="text-[12px] text-[#00d4aa] font-mono animate-pulse">
                🎤 Voice mode active — tap mic to speak
              </p>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            setActiveCriticalAlert={setActiveCriticalAlert}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT ROW */}
      <div className="relative flex items-end gap-2.5 px-4 py-3 border-t border-[#1e2530] bg-[#111418] flex-shrink-0">
        <textarea
          ref={inputRef}
          autoFocus
          className="flex-1 bg-[#1a1f26] border border-[#2a3340] rounded-xl px-3.5 py-3 text-[#e8ecf0] font-main text-[15px] resize-none outline-none leading-snug max-h-24 no-scrollbar focus:border-[#00d4aa] placeholder:text-[#4a5568] transition-colors disabled:opacity-50"
          placeholder={
            voice.voiceMode && voice.isListening
              ? "Listening..."
              : voice.voiceMode
                ? "Tap 🎤 or type your situation..."
                : "What's happening? Describe your situation..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={isLoading}
        />

        <VoiceButton
          voiceMode={voice.voiceMode}
          isListening={voice.isListening}
          isSpeaking={voice.isSpeaking}
          transcript={voice.transcript}
          error={voice.error}
          canRecognize={voice.canRecognize}
          onToggleListening={voice.toggleListening}
          onTranscriptReady={handleTranscriptReady}
          clearTranscript={voice.clearTranscript}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#0099ff] border-none flex items-center justify-center text-lg font-bold text-[#0a0c0f] flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
