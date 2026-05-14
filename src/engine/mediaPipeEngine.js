import { LlmInference, FilesetResolver } from "@mediapipe/tasks-genai";
import { detectScenario } from "./offlineEngine";

/* =========================================================
   MODEL CONFIG
========================================================= */

const MODELS = {
  gemma4: {
    url: "https://huggingface.co/turbo017/aria_gemma_4/resolve/main/gemma-4-E2B-it.litertlm",
    cacheKey: "gemma-4-E2B-it",
    version: "v1",
    minRamGB: 5,
    testTimeoutMs: 5000,
    sizeMB: 2400,
  },
  gemma2: {
    url: "https://huggingface.co/turbo017/aria-offline-model/resolve/main/gemma-2b-it-gpu-int4.bin",
    cacheKey: "gemma-2b-it-gpu-int4",
    version: "v1",
    sizeMB: 600,
  },
};

// localStorage key — user explicitly opted into Gemma 4
const GEMMA4_OPT_IN_KEY = "aria_gemma4_enabled";
// localStorage key — permanently downgraded after crashes
const FORCED_MODEL_KEY = "aria_forced_model";
// localStorage key — crash counter per model
const CRASH_KEY = "aria_init_crash_tracker";
const CRASH_LIMIT = 2;

let activeModelKey = null;

/* =========================================================
   INTERNAL STATE
========================================================= */

let llmInference = null;
let isReady = false;
let isInitializing = false;
let initializationPromise = null;

let downloadProgress = {
  percent: 0,
  downloadedMB: 0,
  totalMB: 0,
  text: "",
};

/* =========================================================
   PUBLIC OPT-IN API
   Called from SettingsScreen when user taps
   "Enable Advanced Offline Intelligence (Gemma 4 E2B)"
========================================================= */

export function isGemma4OptedIn() {
  return localStorage.getItem(GEMMA4_OPT_IN_KEY) === "true";
}

export function isPermanentlyDowngraded() {
  return localStorage.getItem(FORCED_MODEL_KEY) === "gemma2";
}

/**
 * Opt in to Gemma 4. Returns { eligible: bool, reason: string }
 * Caller should check eligible before triggering download.
 */
export async function enableGemma4() {
  if (!isMobileDevice()) {
    return { eligible: false, reason: "Gemma 4 local inference is only supported on mobile devices." };
  }
  if (isPermanentlyDowngraded()) {
    return { eligible: false, reason: "Gemma 4 previously crashed on this device and has been disabled for safety." };
  }

  const capResult = await runCapabilityCheck();
  if (!capResult.capable) {
    return { eligible: false, reason: capResult.reason };
  }

  localStorage.setItem(GEMMA4_OPT_IN_KEY, "true");
  return { eligible: true, reason: "Device is capable. Gemma 4 will download on next initialization." };
}

export function disableGemma4() {
  localStorage.removeItem(GEMMA4_OPT_IN_KEY);
}

/* =========================================================
   DEVICE DETECTION
========================================================= */

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/* =========================================================
   CAPABILITY CHECK
   Used both by enableGemma4() (from Settings) and
   internally before download.
   Returns { capable: bool, reason: string }
========================================================= */

async function runCapabilityCheck() {
  // RAM gate
  const ramGB = navigator.deviceMemory || null;
  if (ramGB !== null && ramGB < MODELS.gemma4.minRamGB) {
    return {
      capable: false,
      reason: `Device RAM (${ramGB}GB) is below the ${MODELS.gemma4.minRamGB}GB minimum for Gemma 4.`,
    };
  }

  // GPU gate
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      return { capable: false, reason: "No GPU/WebGL support detected on this device." };
    }
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
      const lowEndGPUs = ["mali-4", "mali-t", "adreno 3", "adreno 4", "powervr sgx"];
      if (lowEndGPUs.some((g) => renderer.includes(g))) {
        return { capable: false, reason: `GPU (${renderer}) is too weak for Gemma 4.` };
      }
    }
  } catch {
    // fall through to WASM test
  }

  // WASM smoke test
  const passed = await new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), MODELS.gemma4.testTimeoutMs);
    FilesetResolver.forGenAiTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm")
      .then(() => { clearTimeout(timeout); resolve(true); })
      .catch(() => { clearTimeout(timeout); resolve(false); });
  });

  if (!passed) {
    return { capable: false, reason: "Device GPU pipeline did not respond within 5s." };
  }

  return { capable: true, reason: "Device passed all capability checks." };
}

/* =========================================================
   CRASH LOOP GUARD
========================================================= */

function getCrashCount(modelKey) {
  try {
    const data = JSON.parse(localStorage.getItem(CRASH_KEY) || "{}");
    return data[modelKey] || 0;
  } catch { return 0; }
}

function incrementCrashCount(modelKey) {
  try {
    const data = JSON.parse(localStorage.getItem(CRASH_KEY) || "{}");
    data[modelKey] = (data[modelKey] || 0) + 1;
    localStorage.setItem(CRASH_KEY, JSON.stringify(data));
    console.warn(`[ARIA] Crash count for ${modelKey}: ${data[modelKey]}`);
  } catch {}
}

function resetCrashCount(modelKey) {
  try {
    const data = JSON.parse(localStorage.getItem(CRASH_KEY) || "{}");
    delete data[modelKey];
    localStorage.setItem(CRASH_KEY, JSON.stringify(data));
  } catch {}
}

async function wipeCacheForModel(modelKey) {
  if (!window.caches) return;
  try {
    const cache = await caches.open(getCacheName(modelKey));
    await cache.delete(MODELS[modelKey].cacheKey);
    console.warn(`[ARIA] Wiped corrupt cache for ${modelKey}`);
  } catch {}
}

/* =========================================================
   CACHE HELPERS
========================================================= */

function getCacheName(modelKey) {
  return `aria-model-cache-${MODELS[modelKey].version}-${modelKey}`;
}

async function getCachedModel(modelKey) {
  if (!window.caches) return null;
  try {
    const cache = await caches.open(getCacheName(modelKey));
    const response = await cache.match(MODELS[modelKey].cacheKey);
    if (!response) return null;
    const blob = await response.blob();
    if (blob.size < 100 * 1024 * 1024) {
      console.warn(`[ARIA] Cached ${modelKey} corrupt — removing`);
      await cache.delete(MODELS[modelKey].cacheKey);
      return null;
    }
    console.log(`[ARIA] Cache hit: ${modelKey}`);
    return blob;
  } catch (err) {
    console.warn("[ARIA] Cache read failed:", err);
    return null;
  }
}

async function cacheModel(blob, modelKey) {
  if (!window.caches) return;
  try {
    const cache = await caches.open(getCacheName(modelKey));
    await cache.put(MODELS[modelKey].cacheKey, new Response(blob));
    console.log(`[ARIA] Model cached: ${modelKey}`);
  } catch (err) {
    console.warn("[ARIA] Cache write failed:", err);
  }
}

/* =========================================================
   DOWNLOAD MODEL
========================================================= */

async function downloadModel(modelKey, onProgress) {
  console.log(`[ARIA] Downloading ${modelKey}...`);
  const response = await fetch(MODELS[modelKey].url);
  if (!response.ok) throw new Error(`Model download failed: ${response.status}`);

  const totalBytes = Number(response.headers.get("content-length"));
  const totalMB = totalBytes ? (totalBytes / 1024 / 1024).toFixed(0) : 0;
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    while (window.ARIA_PAUSE_DOWNLOAD) {
      await new Promise((r) => setTimeout(r, 300));
    }
    if (window.ARIA_SKIP_DOWNLOAD) {
      console.warn("[ARIA] Download skipped by user");
      reader.cancel();
      throw new Error("DOWNLOAD_SKIPPED");
    }

    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    received += value.length;

    const percent = totalBytes ? Math.round((received / totalBytes) * 100) : 0;
    const downloadedMB = (received / 1024 / 1024).toFixed(0);

    downloadProgress = {
      percent,
      downloadedMB,
      totalMB,
      text: `Downloading ${modelKey === "gemma4" ? "Gemma 4 E2B" : "Gemma 2"}... ${percent}%`,
    };
    if (typeof onProgress === "function") onProgress(downloadProgress);
  }

  const blob = new Blob(chunks);
  await cacheModel(blob, modelKey);
  return blob;
}

/* =========================================================
   FETCH PROGRESS INTERCEPTOR
========================================================= */

let _downloadProgress = { loaded: 0, total: 0, active: false };
let _progressListeners = [];

export function onDownloadProgress(cb) {
  _progressListeners.push(cb);
  return () => { _progressListeners = _progressListeners.filter((l) => l !== cb); };
}

function emitProgress() {
  _progressListeners.forEach((cb) => cb({ ..._downloadProgress }));
}

const _origFetch = window.fetch.bind(window);
let _fetchPatched = false;

function patchFetch() {
  if (_fetchPatched) return;
  _fetchPatched = true;
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const isModelFile =
      /\.(bin|task|gguf|tflite|litertlm)(\?|$)/i.test(url) ||
      url.includes("gemma") ||
      url.includes("mediapipe");

    if (!isModelFile) return _origFetch(input, init);

    const response = await _origFetch(input, init);
    if (!response.ok || !response.body) return response;

    const total = parseInt(response.headers.get("content-length") || "0", 10);
    _downloadProgress = { loaded: 0, total, active: true };
    emitProgress();

    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      while (window.ARIA_PAUSE_DOWNLOAD) {
        await new Promise((r) => setTimeout(r, 300));
      }
      if (window.ARIA_SKIP_DOWNLOAD) {
        reader.cancel();
        throw new Error("DOWNLOAD_SKIPPED");
      }
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      _downloadProgress.loaded += value.length;
      emitProgress();
    }

    _downloadProgress.active = false;
    emitProgress();

    const blob = new Blob(chunks);
    return new Response(blob, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };
}

/* =========================================================
   INITIALIZE MEDIAPIPE

   Decision flow — in strict order:

   1. Desktop?         → gemma2 always, no exceptions
   2. Permanently downgraded (crash history)?  → gemma2
   3. User opted in to Gemma 4?
        → check cache first
        → if not cached: re-run capability check, then download
   4. Default (no opt-in):
        → gemma2 cache → download gemma2
   5. LlmInference crashes → crash guard → retry gemma2
========================================================= */

export async function initMediaPipe(onProgress = () => {}) {
  patchFetch();

  if (isReady && llmInference) return llmInference;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      isInitializing = true;

      const mobile = isMobileDevice();
      const optedIn = isGemma4OptedIn();
      const permanentlyDowngraded = isPermanentlyDowngraded();

      console.log(`[ARIA] Platform: ${mobile ? "mobile" : "desktop"} | Gemma4 opt-in: ${optedIn} | Downgraded: ${permanentlyDowngraded}`);

      let modelBlob = null;
      let chosenModelKey = null;

      // ── Rule 1: Desktop → always gemma2 ─────────────────────────────
      if (!mobile) {
        console.log("[ARIA] Desktop → Gemma 2");
        chosenModelKey = "gemma2";
        modelBlob = await getCachedModel("gemma2");
        if (!modelBlob) {
          if (!navigator.onLine) throw new Error("No cached model and device is offline");
          modelBlob = await downloadModel("gemma2", onProgress);
        }
      }

      // ── Rule 2+3: Mobile + opted in + not downgraded → try gemma4 ───
      else if (mobile && optedIn && !permanentlyDowngraded) {
        console.log("[ARIA] Mobile + Gemma 4 opt-in → attempting Gemma 4");

        // Check crash count first — if already failed before, skip
        const crashes = getCrashCount("gemma4");
        if (crashes >= CRASH_LIMIT) {
          console.warn("[ARIA] Gemma 4 crash limit reached — switching to Gemma 2 permanently");
          localStorage.setItem(FORCED_MODEL_KEY, "gemma2");
          localStorage.removeItem(GEMMA4_OPT_IN_KEY);
          await wipeCacheForModel("gemma4");
          resetCrashCount("gemma4");
          chosenModelKey = "gemma2";
          modelBlob = await getCachedModel("gemma2");
          if (!modelBlob) {
            if (!navigator.onLine) throw new Error("No cached model and device is offline");
            modelBlob = await downloadModel("gemma2", onProgress);
          }
        } else {
          // Try gemma4 cache first
          modelBlob = await getCachedModel("gemma4");
          if (modelBlob) {
            chosenModelKey = "gemma4";
          } else {
            // Not cached — re-verify capability before 2.4GB download
            if (!navigator.onLine) throw new Error("No cached model and device is offline");
            const cap = await runCapabilityCheck();
            if (cap.capable) {
              chosenModelKey = "gemma4";
              modelBlob = await downloadModel("gemma4", onProgress);
            } else {
              // Device failed re-check — disable opt-in silently, use gemma2
              console.warn(`[ARIA] Capability re-check failed: ${cap.reason} → Gemma 2`);
              localStorage.removeItem(GEMMA4_OPT_IN_KEY);
              showIncompatiblePopup(cap.reason);
              chosenModelKey = "gemma2";
              modelBlob = await getCachedModel("gemma2");
              if (!modelBlob) modelBlob = await downloadModel("gemma2", onProgress);
            }
          }
        }
      }

      // ── Rule 4: Default mobile (no opt-in) → gemma2 ─────────────────
      else {
        console.log("[ARIA] Mobile default → Gemma 2");
        chosenModelKey = "gemma2";
        modelBlob = await getCachedModel("gemma2");
        if (!modelBlob) {
          if (!navigator.onLine) throw new Error("No cached model and device is offline");
          modelBlob = await downloadModel("gemma2", onProgress);
        }
      }

      // ── Init LLM with chosen model ───────────────────────────────────
      console.log(`[ARIA] Initializing MediaPipe with ${chosenModelKey}...`);

      const fileset = await FilesetResolver.forGenAiTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm"
      );

      const blobUrl = URL.createObjectURL(modelBlob);

      try {
        llmInference = await LlmInference.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: blobUrl },
          maxTokens: 512,
          topK: 40,
          temperature: 0.4,
          randomSeed: Math.floor(Math.random() * 10000),
        });
        URL.revokeObjectURL(blobUrl);
      } catch (initErr) {
        URL.revokeObjectURL(blobUrl);
        console.error(`[ARIA] LlmInference failed for ${chosenModelKey}:`, initErr);

        if (chosenModelKey === "gemma4") {
          // Crash guard
          incrementCrashCount("gemma4");
          const crashes = getCrashCount("gemma4");
          if (crashes >= CRASH_LIMIT) {
            localStorage.setItem(FORCED_MODEL_KEY, "gemma2");
            localStorage.removeItem(GEMMA4_OPT_IN_KEY);
            console.warn("[ARIA] Gemma 4 crash limit hit — permanently downgraded");
          }
          await wipeCacheForModel("gemma4");
          showIncompatiblePopup("Gemma 4 failed to initialize. Falling back to Gemma 2.");

          // Retry with gemma2
          let g2Blob = await getCachedModel("gemma2");
          if (!g2Blob) {
            if (!navigator.onLine) throw new Error("Gemma 4 crashed and no Gemma 2 cache available offline");
            g2Blob = await downloadModel("gemma2", onProgress);
          }
          const g2Url = URL.createObjectURL(g2Blob);
          llmInference = await LlmInference.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: g2Url },
            maxTokens: 512,
            topK: 40,
            temperature: 0.4,
            randomSeed: Math.floor(Math.random() * 10000),
          });
          URL.revokeObjectURL(g2Url);
          chosenModelKey = "gemma2";
        } else {
          throw initErr;
        }
      }

      resetCrashCount(chosenModelKey);
      activeModelKey = chosenModelKey;
      isReady = true;
      isInitializing = false;

      console.log(`[ARIA] Offline AI ready (${chosenModelKey})`);
      return llmInference;

    } catch (err) {
      console.error("[ARIA] MediaPipe init failed:", err);
      initializationPromise = null;
      isInitializing = false;
      throw err;
    }
  })();

  return initializationPromise;
}

/* =========================================================
   QUERY LOCAL MODEL
========================================================= */

export async function getMediaPipeResponse(userMessage) {
  if (!llmInference || !isReady) {
    throw new Error("Offline AI not initialized");
  }

  const scenario = detectScenario(userMessage);
  const safeScenario =
    scenario && scenario !== "unknown"
      ? scenario
      : "general assistance / non-emergency";

  const systemPrompt = `
You are ARIA, an emergency survival assistant.

Your FIRST priority is immediate life safety.

Rules:
- If the situation is an emergency, prioritize evacuation and life-saving steps.
- If the user query is NOT an emergency (e.g., build something, technical help, casual chat), provide helpful, concise instructions for that specific task.
- Do NOT hallucinate danger if none is mentioned.
- Use short, tactical steps for any instruction.
- Treat fire, bleeding, unconsciousness, smoke, explosions, weapons, collapse, drowning, electrocution, and breathing issues as critical emergencies.

Current context:
${safeScenario}

Required format (only use sections that are relevant):

TITLE: [Topic Name]
SUMMARY: [Brief description]

IMMEDIATE ACTIONS:
1. [Action 1]
2. [Action 2]
3. [Action 3]

DO NOT:
- [Warning for the specific task]

SEEK HELP IF:
- [Condition for escalation]
`;

  const prompt = `
<start_of_turn>user
${systemPrompt}

User situation:
${userMessage}
<end_of_turn>

<start_of_turn>model
`;

  try {
    const response = await llmInference.generateResponse(prompt);
    return response;
  } catch (err) {
    console.error("[ARIA] Local AI generation failed:", err);
    throw err;
  }
}

/* =========================================================
   COMPATIBILITY POPUP
========================================================= */

function showIncompatiblePopup(reason) {
  const existing = document.getElementById("aria-compat-popup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "aria-compat-popup";
  popup.style.cssText = `
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
    background: #1a1f26; border: 1px solid #ff8c00; border-radius: 12px;
    padding: 14px 18px; max-width: 340px; width: calc(100% - 32px);
    z-index: 9999; font-family: 'Space Mono', monospace;
    box-shadow: 0 4px 24px rgba(0,0,0,0.6); animation: aria-slide-up 0.3s ease;
  `;
  popup.innerHTML = `
    <style>
      @keyframes aria-slide-up {
        from { opacity:0; transform:translateX(-50%) translateY(16px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
    </style>
    <div style="display:flex;align-items:flex-start;gap:10px;">
      <span style="font-size:20px;flex-shrink:0;">⚠️</span>
      <div>
        <p style="color:#ff8c00;font-size:11px;font-weight:700;margin:0 0 4px;letter-spacing:0.05em;">GEMMA 4 NOT COMPATIBLE</p>
        <p style="color:#8a9bb0;font-size:11px;margin:0 0 8px;line-height:1.5;">
          Using <span style="color:#00d4aa;font-weight:700;">Gemma 2</span> for emergency assistance.
        </p>
        <p style="color:#4a5568;font-size:10px;margin:0;">${reason}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()"
        style="background:none;border:none;color:#4a5568;font-size:16px;cursor:pointer;flex-shrink:0;padding:0;line-height:1;">✕</button>
    </div>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup?.remove(), 8000);
}

/* =========================================================
   STATUS
========================================================= */

export function getMediaPipeStatus() {
  return {
    isReady,
    isInitializing,
    downloadProgress,
    activeModel: activeModelKey,
    isGemma4: activeModelKey === "gemma4",
    isMobile: isMobileDevice(),
    gemma4OptedIn: isGemma4OptedIn(),
    permanentlyDowngraded: isPermanentlyDowngraded(),
  };
}
