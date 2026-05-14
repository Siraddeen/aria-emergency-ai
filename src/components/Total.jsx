/**
 * Total.jsx — Root app shell.
 *
 * FIXES APPLIED:
 * 1. CriticalAlert moved INSIDE the app container div (not a sibling outside it)
 *    so it uses absolute positioning relative to the container, not fixed to
 *    the viewport — this kills the Android Chrome black screen compositor bug.
 * 2. MediaPipe init delayed to 2s and only starts once — guard against double-init.
 * 3. try/catch guards on all local AI calls for mobile safety.
 */
import { useState, useRef, useEffect, Component } from "react";
import { useARIA } from "../hooks/useARIA";
import { useVoice } from "../hooks/useVoice";
import {
  initMediaPipe,
  getMediaPipeStatus,
} from "../engine/hybridEngine";
import { setForceNLP as setEngineForceNLP } from "../engine/hybridEngine";

import HomeScreen from "./screens/HomeScreen";
import AssistScreen from "./screens/AssistScreen";
import HistoryScreen from "./screens/HistoryScreen";
import SettingsScreen from "./screens/SettingsScreen";
import CriticalAlert from "./CriticalAlert";

const NAV_ITEMS = [
  { id: "home",     label: "Home",     icon: "⊕" },
  { id: "assist",   label: "Assist",   icon: "◎" },
  { id: "history",  label: "History",  icon: "◷" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export default function Total() {
  const [activeTab, setActiveTab] = useState("home");
  const inputRef = useRef(null);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [forceNLP, setForceNLP] = useState(false);

  // ── MEDIAPIPE STATE ───────────────────────────
  const [mediaPipeStatus, setMediaPipeStatus] = useState({ isReady: false, isInitializing: false });
  const [mediaPipeCached, setMediaPipeCached] = useState(false);

  // Poll for MediaPipe status (simpler than event system for now)
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await getMediaPipeStatus();
      setMediaPipeStatus(status);
      if (status.isReady) setMediaPipeCached(true);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Start MediaPipe after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        initMediaPipe();
      } catch {
        /* silently ignore */
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Sync forceNLP → engine
  useEffect(() => {
    setEngineForceNLP(forceNLP);
  }, [forceNLP]);

  // ── ARIA ENGINE ──────────────────────────────
  const {
    messages,
    isLoading,
    isOnline,
    networkMode,
    sendMessage,
    sendQuickAction,
    clearHistory,
    selectedHistory: _,
    openSession,
    setMessages,
    setConversationHistory,
    setActiveSessionId,
  } = useARIA({
    onCriticalAlert: setActiveCriticalAlert,
  });

  // ── VOICE ────────────────────────────────────
  const voice = useVoice();

  useEffect(() => {
    if (activeTab === "assist") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!voice.voiceMode) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last?.response) {
      voice.speak(last.response);
    }
  }, [messages, voice.voiceMode]);

  async function handleSend(message) {
    await sendMessage(message);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── ENGINE STATUS ─────────────────────────────
  const engineStatus = (() => {
    if (forceNLP) return "nlp";
    if (networkMode.userMode === "online" && networkMode.physicallyOnline) return "cloud";
    if (mediaPipeStatus.isReady) return "local";
    return "nlp";
  })();

  return (
    <div className="w-full flex justify-center items-center h-screen bg-[#05070a]">
      {/*
        KEY FIX: use h-screen instead of min-h-screen to avoid extra height on mobile.
        Also remove overflow-hidden to let inner content scroll if needed.
      */}
      <div
        className="w-full max-w-[480px] h-[100dvh] border border-[#1e2530] rounded-2xl shadow-2xl overflow-auto bg-[#0a0c0f]"
        style={{ position: "relative" }}
      >
        <div className="flex flex-col h-full">

          {/* MAIN CONTENT */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "home" && (
              <HomeScreen
                onNavigate={setActiveTab}
                onQuickAction={sendQuickAction}
                isOnline={isOnline}
              />
            )}
            {activeTab === "assist" && (
              <AssistScreen
                messages={messages}
                isLoading={isLoading}
                isOnline={isOnline}
                onSend={handleSend}
                onQuickAction={sendQuickAction}
                inputRef={inputRef}
                setActiveCriticalAlert={setActiveCriticalAlert}
                selectedHistory={selectedHistory}
                setSelectedHistory={setSelectedHistory}
                voice={voice}
                mediaPipeStatus={mediaPipeStatus}
                engineStatus={engineStatus}
              />
            )}
            {activeTab === "history" && (
              <HistoryScreen
                messages={messages}
                onClear={clearHistory}
                onSelectHistory={(msg) => {
                  setSelectedHistory(msg);
                  setActiveTab("assist");
                }}
              />
            )}
            {activeTab === "settings" && (
              <SettingsScreen
                isOnline={isOnline}
                networkMode={networkMode}
                mediaPipeStatus={mediaPipeStatus}
                mediaPipeCached={mediaPipeCached}
                engineStatus={engineStatus}
                forceNLP={forceNLP}
                setForceNLP={setForceNLP}
              />
            )}
          </div>

          {/* BOTTOM NAV */}
          <nav className="flex h-[72px] bg-[#111418] border-t border-[#1e2530] flex-shrink-0">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-1
                  transition-all duration-200
                  ${activeTab === item.id ? "text-[#00d4aa] bg-[#0f1419]" : "text-[#4a5568]"}
                `}
              >
                <span className="font-mono text-xl leading-none">{item.icon}</span>
                <span className="font-mono text-[10px] font-bold tracking-[0.08em] uppercase">
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/*
          CRITICAL ALERT — rendered INSIDE the container (not outside as a sibling).
          Uses absolute inset-0 so it covers only this container, not the full viewport.
          NO backdrop-blur — causes black screen on Android Chrome.
          NO fixed positioning — same bug.
        */}
        {activeCriticalAlert && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 50,
              backgroundColor: "#000000",
            }}
          >
            <CriticalAlert
              response={activeCriticalAlert}
              onClose={() => {
                setActiveCriticalAlert(null);
                voice.stopSpeaking();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
