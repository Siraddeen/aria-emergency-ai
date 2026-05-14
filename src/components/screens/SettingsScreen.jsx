import { useState, useEffect } from "react";
import NetworkModeToggle from "./NetworkModeToggle";
import {
  enableGemma4,
  disableGemma4,
  isGemma4OptedIn,
  isPermanentlyDowngraded,
  getMediaPipeStatus,
} from "../../engine/mediaPipeEngine";

/* =========================================================
   MEDIAPIPE STATE HELPERS
========================================================= */

function getMediaPipeLabel(status) {
  if (status.isReady) {
    const model = status.isGemma4 ? "Gemma 4 E2B" : "Gemma 2 2B";
    return { text: `● ${model} loaded`, color: "text-[#00d4aa]" };
  }
  if (status.isInitializing) {
    return { text: "◌ Initializing...", color: "text-[#0099ff] animate-pulse" };
  }
  return { text: "○ Standby", color: "text-[#4a5568]" };
}

/* =========================================================
   INTELLIGENCE LAYER INDICATOR
========================================================= */

function IntelligenceLayerIndicator({ engineStatus, mediaPipeStatus }) {
  const layers = [
    {
      id: "cloud",
      label: "CLOUD GEMMA 4",
      desc: "Gemma 4 31B via HF Router",
      icon: "☁",
      active: engineStatus === "cloud",
      border: "border-[#00d4aa]",
      bg: "bg-[#00d4aa]/10",
      text: "text-[#00d4aa]",
      dot: "bg-[#00d4aa]",
    },
    {
      id: "local",
      label: "LOCAL GEMMA",
      desc: mediaPipeStatus.isGemma4
        ? "Gemma 4 E2B · MediaPipe on-device"
        : "Gemma 2 2B · MediaPipe on-device",
      icon: "⚡",
      active: engineStatus === "local",
      border: "border-[#0099ff]",
      bg: "bg-[#0099ff]/10",
      text: "text-[#0099ff]",
      dot: "bg-[#0099ff]",
      statusText: mediaPipeStatus.isInitializing
        ? "Initializing MediaPipe..."
        : !mediaPipeStatus.isReady && engineStatus === "local"
          ? "Fallback to emergency engine"
          : null,
    },
    {
      id: "nlp",
      label: "EMERGENCY ENGINE",
      desc: "57-scenario deterministic engine",
      icon: "◌",
      active: engineStatus === "nlp",
      border: "border-[#ff8c00]",
      bg: "bg-[#ff8c00]/10",
      text: "text-[#ff8c00]",
      dot: "bg-[#ff8c00]",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-300
            ${layer.active ? `${layer.border} ${layer.bg}` : "border-[#1e2530] bg-[#0a0c0f]"}`}
        >
          <div className="relative flex-shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${layer.active ? layer.dot : "bg-[#2a3340]"}`} />
            {layer.active && (
              <div className={`absolute inset-0 rounded-full ${layer.dot} animate-ping opacity-40`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-mono text-[11px] font-bold tracking-widest ${layer.active ? layer.text : "text-[#4a5568]"}`}>
              {layer.icon} {layer.label}
              {layer.active && (
                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-current/20">ACTIVE</span>
              )}
            </p>
            <p className={`text-[10px] mt-0.5 truncate ${layer.active ? "text-[#8a9bb0]" : "text-[#2a3340]"}`}>
              {layer.statusText || layer.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   ARCHITECTURE DIAGRAM
========================================================= */

function ArchitectureDiagram() {
  return (
    <div className="font-mono text-[11px] text-[#8a9bb0] leading-relaxed bg-[#0a0c0f] rounded-xl p-4 border border-[#1e2530]">
      <p className="text-[#00d4aa] font-bold mb-3 tracking-widest text-[10px]">ARIA INTELLIGENCE ROUTING</p>
      <div className="flex flex-col gap-1">
        <p className="text-[#e8ecf0]">User Query</p>
        <p className="text-[#2a3340] pl-2">│</p>
        <p className="pl-2">├─ <span className="text-[#e8ecf0]">Internet available?</span></p>
        <p className="pl-2">│ ├─ Yes → <span className="text-[#00d4aa]">☁ Gemma 4 31B (HF Router)</span></p>
        <p className="pl-2">│ └─ No</p>
        <p className="pl-2">│ ├─ MediaPipe ready? → <span className="text-[#0099ff]">⚡ Local Gemma</span></p>
        <p className="pl-2">│ └─ Fallback → <span className="text-[#ff8c00]">◌ Emergency Engine</span></p>
        <p className="text-[#2a3340] pl-2">│</p>
        <p className="pl-2">└─ <span className="text-[#e8ecf0]">Response → User</span></p>
      </div>
      <div className="mt-3 pt-3 border-t border-[#1e2530] flex flex-col gap-1">
        <p className="text-[9px] text-[#4a5568] tracking-wider uppercase">Resilience</p>
        <p className="text-[10px] text-[#8a9bb0]">Graceful degradation architecture</p>
        <p className="text-[10px] text-[#8a9bb0]">Works with zero connectivity</p>
      </div>
    </div>
  );
}

/* =========================================================
   GEMMA 4 OPT-IN SECTION
========================================================= */

function Gemma4UpgradeSection({ mediaPipeStatus, onOptInChange }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null); // { eligible, reason }
  const [optedIn, setOptedIn] = useState(isGemma4OptedIn());
  const downgraded = isPermanentlyDowngraded();
  const isMobile = mediaPipeStatus.isMobile;

  // Desktop — don't show this section at all
  if (!isMobile) {
    return (
      <div className="bg-[#111418] border border-[#1e2530] rounded-xl p-4">
        <h3 className="font-mono text-[13px] font-bold tracking-widest text-[#8a9bb0] uppercase mb-1.5">
          Advanced Offline Intelligence
        </h3>
        <p className="text-[11px] text-[#4a5568] leading-relaxed">
          Gemma 4 E2B local inference is only available on mobile devices.
          Desktop uses Gemma 2 2B which is stable and fast.
        </p>
      </div>
    );
  }

  async function handleEnable() {
    setChecking(true);
    setResult(null);
    const res = await enableGemma4();
    setResult(res);
    setChecking(false);
    if (res.eligible) {
      setOptedIn(true);
      onOptInChange?.();
    }
  }

  function handleDisable() {
    disableGemma4();
    setOptedIn(false);
    setResult(null);
    onOptInChange?.();
  }

  return (
    <div className="bg-[#111418] border border-[#1e2530] rounded-xl p-4">
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="font-mono text-[13px] font-bold tracking-widest text-[#8a9bb0] uppercase">
          Advanced Offline Intelligence
        </h3>
        {optedIn && !downgraded && (
          <span className="font-mono text-[9px] px-2 py-1 rounded-full bg-[#0099ff]/10 text-[#0099ff] border border-[#0099ff]/30 flex-shrink-0 ml-2">
            ENABLED
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#4a5568] mb-3 leading-relaxed">
        Upgrade to <span className="text-[#e8ecf0]">Gemma 4 E2B</span> for more powerful offline responses.
        Requires ~2.4GB storage and a capable device. ARIA works fully with Gemma 2 by default.
      </p>

      {/* Size info */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-[#0a0c0f] rounded-lg px-3 py-2 border border-[#1e2530]">
          <p className="font-mono text-[9px] text-[#4a5568] mb-0.5">DEFAULT</p>
          <p className="font-mono text-[11px] text-[#8a9bb0] font-bold">Gemma 2 2B</p>
          <p className="font-mono text-[9px] text-[#4a5568]">~600 MB · stable</p>
        </div>
        <div className="flex items-center text-[#2a3340] font-mono text-[14px]">→</div>
        <div className={`flex-1 bg-[#0a0c0f] rounded-lg px-3 py-2 border ${optedIn && !downgraded ? "border-[#0099ff]/40" : "border-[#1e2530]"}`}>
          <p className="font-mono text-[9px] text-[#4a5568] mb-0.5">UPGRADE</p>
          <p className={`font-mono text-[11px] font-bold ${optedIn && !downgraded ? "text-[#0099ff]" : "text-[#8a9bb0]"}`}>Gemma 4 E2B</p>
          <p className="font-mono text-[9px] text-[#4a5568]">~2.4 GB · powerful</p>
        </div>
      </div>

      {/* Permanently downgraded state */}
      {downgraded && (
        <div className="flex items-start gap-2 px-3 py-3 bg-[#1a0808] border border-[#ff4444]/30 rounded-xl mb-3">
          <span className="text-[#ff4444] text-[14px] flex-shrink-0">⛔</span>
          <div>
            <p className="font-mono text-[10px] font-bold text-[#ff4444] mb-0.5">DISABLED — DEVICE INCOMPATIBLE</p>
            <p className="text-[10px] text-[#8a9bb0] leading-relaxed">
              Gemma 4 crashed on this device and has been permanently disabled for safety.
              ARIA is using Gemma 2 instead.
            </p>
          </div>
        </div>
      )}

      {/* Active state */}
      {optedIn && !downgraded && (
        <div className="flex items-start gap-2 px-3 py-3 bg-[#001a30] border border-[#0099ff]/30 rounded-xl mb-3">
          <span className="text-[#0099ff] text-[14px] flex-shrink-0">⚡</span>
          <div className="flex-1">
            <p className="font-mono text-[10px] font-bold text-[#0099ff] mb-0.5">GEMMA 4 E2B ENABLED</p>
            <p className="text-[10px] text-[#8a9bb0] leading-relaxed">
              {mediaPipeStatus.isReady && mediaPipeStatus.isGemma4
                ? "Running on-device. Full offline power active."
                : "Will download on next initialization."}
            </p>
          </div>
        </div>
      )}

      {/* Result feedback */}
      {result && !result.eligible && (
        <div className="flex items-start gap-2 px-3 py-3 bg-[#1a1000] border border-[#ff8c00]/30 rounded-xl mb-3">
          <span className="text-[#ff8c00] text-[14px] flex-shrink-0">⚠️</span>
          <div>
            <p className="font-mono text-[10px] font-bold text-[#ff8c00] mb-0.5">NOT COMPATIBLE</p>
            <p className="text-[10px] text-[#8a9bb0] leading-relaxed">{result.reason}</p>
          </div>
        </div>
      )}

      {result && result.eligible && (
        <div className="flex items-start gap-2 px-3 py-3 bg-[#001a12] border border-[#00d4aa]/30 rounded-xl mb-3">
          <span className="text-[#00d4aa] text-[14px] flex-shrink-0">✓</span>
          <p className="text-[10px] text-[#8a9bb0] leading-relaxed">{result.reason}</p>
        </div>
      )}

      {/* Action button */}
      {!downgraded && (
        <>
          {!optedIn ? (
            <button
              onClick={handleEnable}
              disabled={checking}
              className={`w-full py-3 rounded-xl font-mono text-[12px] font-bold tracking-widest border transition-all
                ${checking
                  ? "bg-[#0099ff]/10 border-[#0099ff]/40 text-[#0099ff] animate-pulse cursor-not-allowed"
                  : "bg-gradient-to-r from-[#0099ff]/20 to-[#00d4aa]/20 border-[#0099ff]/40 text-[#0099ff] active:scale-[0.98]"
                }`}
            >
              {checking ? "◌ CHECKING DEVICE..." : "⚡ ENABLE GEMMA 4 E2B"}
            </button>
          ) : (
            <button
              onClick={handleDisable}
              className="w-full py-3 rounded-xl font-mono text-[12px] font-bold tracking-widest border border-[#2a3340] bg-[#1a1f26] text-[#8a9bb0] active:scale-[0.98] transition-all"
            >
              REVERT TO GEMMA 2
            </button>
          )}
        </>
      )}

      <p className="text-[10px] text-[#2a3340] mt-2 text-center font-mono">
        ARIA works fully offline with either model
      </p>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SettingsScreen({
  isOnline,
  networkMode,
  mediaPipeStatus,
  mediaPipeCached,
  engineStatus,
  forceNLP,
  setForceNLP,
}) {
  const [nlpTestActive, setNlpTestActive] = useState(false);
  const [hfToken, setHfToken] = useState(() => localStorage.getItem("hf_token") || "");
  // re-render when opt-in state changes
  const [, forceUpdate] = useState(0);

  function handleFailureTest() {
    setNlpTestActive(true);
    setForceNLP(true);
    setTimeout(() => {
      setNlpTestActive(false);
      setForceNLP(false);
    }, 8000);
  }

  const mpLabel = getMediaPipeLabel(mediaPipeStatus);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-6">
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-[#1e2530]">
        <h2 className="font-mono text-lg font-bold tracking-wide">Settings</h2>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4">

        {/* LOCAL AI READY BANNER */}
        {mediaPipeCached && mediaPipeStatus.isReady && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[#001a12] border border-[#00d4aa]/40 rounded-xl">
            <span className="text-[#00d4aa] text-lg">⚡</span>
            <div>
              <p className="font-mono text-[11px] font-bold text-[#00d4aa] tracking-wide">
                {mediaPipeStatus.isGemma4 ? "Gemma 4 E2B ready" : "Local AI ready"}
              </p>
              <p className="text-[10px] text-[#8a9bb0] mt-0.5">ARIA now works fully offline</p>
            </div>
          </div>
        )}

        {/* INTELLIGENCE LAYERS */}
        <div className="bg-[#111418] border border-[#1e2530] rounded-xl p-4">
          <h3 className="font-mono text-[13px] font-bold tracking-widest text-[#8a9bb0] uppercase mb-3.5">
            Intelligence Layers
          </h3>
          <IntelligenceLayerIndicator
            engineStatus={forceNLP ? "nlp" : engineStatus}
            mediaPipeStatus={mediaPipeStatus}
          />
        </div>

        {/* ── GEMMA 4 UPGRADE SECTION ── */}
        <Gemma4UpgradeSection
          mediaPipeStatus={mediaPipeStatus}
          onOptInChange={() => forceUpdate((n) => n + 1)}
        />

        {/* RESILIENCE DEMO */}
        <div className="bg-[#111418] border border-[#1e2530] rounded-xl p-4">
          <h3 className="font-mono text-[13px] font-bold tracking-widest text-[#8a9bb0] uppercase mb-1.5">
            Resilience Demo
          </h3>
          <p className="text-[11px] text-[#4a5568] mb-3.5 leading-relaxed">
            Simulate local AI failure and watch ARIA gracefully degrade to the emergency engine.
          </p>
          <button
            onClick={handleFailureTest}
            disabled={nlpTestActive}
            className={`w-full py-3 rounded-xl font-mono text-[12px] font-bold tracking-widest border transition-all
              ${nlpTestActive
                ? "bg-[#ff8c00]/10 border-[#ff8c00] text-[#ff8c00] animate-pulse cursor-not-allowed"
                : "bg-[#1a1f26] border-[#2a3340] text-[#8a9bb0]"
              }`}
          >
            {nlpTestActive ? "⚠ EMERGENCY ENGINE ACTIVE" : "⚡ TEST OFFLINE FAILURE"}
          </button>
        </div>

        {/* HF TOKEN */}
        <div className="bg-[#111418] border border-[#1e2530] rounded-xl p-4">
          <h3 className="font-mono text-[13px] font-bold tracking-widest text-[#8a9bb0] uppercase mb-1.5">
            HuggingFace Token
          </h3>
          <p className="text-[11px] text-[#4a5568] mb-3.5 leading-relaxed">
            Required for Gemma 4 cloud intelligence. Stored locally on your device only.
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="password"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxx"
              className="w-full bg-[#1a1f26] border border-[#2a3340] rounded-xl px-3.5 py-3 text-[#e8ecf0] font-mono text-[13px] outline-none focus:border-[#00d4aa] placeholder:text-[#4a5568]"
            />
            <button
              onClick={() => {
                const trimmed = hfToken.trim();
                if (!trimmed) return;
                localStorage.setItem("hf_token", trimmed);
                alert("HF token saved");
              }}
              className="w-full py-3 rounded-xl font-mono text-[12px] font-bold tracking-widest bg-gradient-to-r from-[#00d4aa] to-[#0099ff] text-[#0a0c0f]"
            >
              SAVE TOKEN LOCALLY
            </button>
            <div className="flex items-center gap-2 px-1 pt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${hfToken ? "bg-[#00d4aa]" : "bg-[#ff6b35]"}`} />
              <span className="font-mono text-[11px] text-[#4a5568]">
                {hfToken ? "Gemma 4 cloud connected" : "Offline-only mode active"}
              </span>
            </div>
          </div>
        </div>

        {/* NETWORK MODE */}
        <div className="bg-[#111418] border border-[#1e2530] rounded-xl p-4">
          <h3 className="font-mono text-[13px] font-bold tracking-widest text-[#8a9bb0] uppercase mb-3.5">
            Network Mode
          </h3>
          <NetworkModeToggle
            userMode={networkMode.userMode}
            resolvedMode={networkMode.resolvedMode}
            physicallyOnline={networkMode.physicallyOnline}
            onSetMode={networkMode.setMode}
          />
        </div>

        {/* ARCHITECTURE */}
        <div className="bg-[#111418] border border-[#1e2530] rounded-xl p-4">
          <h3 className="font-mono text-[13px] font-bold tracking-widest text-[#8a9bb0] uppercase mb-3.5">
            Architecture
          </h3>
          <ArchitectureDiagram />
        </div>

        {/* SYSTEM STATUS */}
        <div className="bg-[#111418] border border-[#1e2530] rounded-xl p-4">
          <h3 className="font-mono text-[13px] font-bold tracking-widest text-[#8a9bb0] uppercase mb-3.5">
            System Status
          </h3>
          {[
            { label: "Cloud Gemma 4", value: isOnline ? "● Active" : "○ Offline", ok: isOnline },
            { label: "HF Token", value: hfToken ? "● Connected" : "○ Not set", ok: !!hfToken },
            { label: "Local MediaPipe", value: mpLabel.text, colorClass: mpLabel.color },
            { label: "Active Model", value: mediaPipeStatus.activeModel
                ? `● ${mediaPipeStatus.isGemma4 ? "Gemma 4 E2B" : "Gemma 2 2B"}`
                : "○ Not loaded",
              ok: !!mediaPipeStatus.activeModel },
            { label: "Emergency Engine", value: "● Always Active", ok: true },
            { label: "Offline Knowledge", value: "● 57 Scenarios", ok: true },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex justify-between items-center py-2 text-sm ${i < arr.length - 1 ? "border-b border-[#1e2530]" : ""}`}
            >
              <span className="text-[#e8ecf0] text-[13px]">{row.label}</span>
              <span className={`font-mono text-[11px] font-bold ${row.colorClass ? row.colorClass : row.ok ? "text-[#00d4aa]" : "text-[#ff6b35]"}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* ABOUT */}
        <div className="bg-[#111418] border border-[#1e2530] rounded-xl p-4">
          <h3 className="font-mono text-[13px] font-bold tracking-widest text-[#8a9bb0] uppercase mb-3.5">
            About ARIA
          </h3>
          <p className="text-[13px] text-[#8a9bb0] leading-relaxed mb-3">
            ARIA is a resilient AI assistant built for disaster zones,
            low-connectivity environments, and emergency response scenarios. It
            intelligently routes between cloud Gemma 4, local Gemma inference,
            and a deterministic emergency engine.
          </p>
          <span className="font-mono text-[11px] text-[#4a5568] bg-[#1a1f26] px-2.5 py-1.5 rounded-lg inline-block">
            v1.0.0 — Gemma 4 Good Hackathon 2026
          </span>
        </div>

      </div>
    </div>
  );
}
