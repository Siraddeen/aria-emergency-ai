<div align="center">

<h1>🆘 ARIA</h1>
<h3>Adaptive Resilience Intelligence Assistant</h3>

<p><em>AI-powered emergency guidance that works when the world doesn't.</em></p>

[![Hackathon](https://img.shields.io/badge/Gemma%204%20Good%20Hackathon-2026-FF6B35?style=for-the-badge)](https://ai.google.dev/competition)
[![Gemma 4](https://img.shields.io/badge/Gemma%204-Cloud%20%2B%20On--Device-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Offline First](https://img.shields.io/badge/Offline--First-PWA-7C3AED?style=for-the-badge)](https://web.dev/progressive-web-apps/)
[![React](https://img.shields.io/badge/React%20+%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://vitejs.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-On--Device%20AI-00897B?style=for-the-badge)](https://mediapipe.dev/)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

<br/>

**[🌐 Live Demo](https://aria-emergency-ai.onrender.com)** &nbsp;•&nbsp; **[📱 Install PWA](#-getting-started)** &nbsp;•&nbsp; **[🧠 Architecture](#-architecture--4-layers-of-intelligence)**

<br/>

> *"In a disaster, every second is someone's life.*
> *ARIA is there when networks aren't."*

</div>

---

## 🌍 The Problem

When disasters strike — earthquakes, floods, wildfires, medical crises — the first thing people do is reach for their phones. But the infrastructure that powers digital help is often the **first thing to collapse**:

- **Cell towers go down.** No signal. No cloud AI.
- **Data networks fail.** No connection. No answers.
- **Power grids cut out.** Your battery is all you have.

Every AI assistant you know — ChatGPT, Gemini, Claude — goes completely silent the moment you need it most. They're 100% cloud-dependent.

**ARIA is not.**

---

## 💡 What is ARIA?

ARIA is an **offline-first emergency AI PWA** that delivers intelligent, context-aware survival guidance — directly on your device — with **zero internet required** for its core features.

When online, ARIA connects to **Cloud Gemma 4** (via HuggingFace) for the most powerful conversational AI responses. When offline, it falls back to **on-device Gemma models via MediaPipe** — selecting **Gemma 2 2B** for lower-end devices or **Gemma 4 E2B** for higher-end ones. And when even that isn't available, a **57-scenario deterministic knowledge engine** ensures ARIA never goes silent.

**One app. Four layers of intelligence. Works anywhere.**

---

## 🏆 Hackathon Tracks

Submitted to the **[Gemma 4 Good Hackathon 2026](https://ai.google.dev/competition)** across three tracks:

| Track | Qualification |
|:---|:---|
| 🥇 **Main Track** | Novel multi-model Gemma architecture solving a real global emergency problem |
| 🌵 **Cactus — Local-First Mobile** | True on-device LLM inference via MediaPipe — zero cloud required for core AI |
| 🌐 **Global Resilience Impact** | Built for disaster zones, rural populations, and connectivity-limited regions |

---

## ✨ Features

| | Feature |
|:---:|:---|
| 🔴 | **100% offline capable** — on-device Gemma inference via MediaPipe, no server needed |
| ☁️ | **Cloud Gemma 4** when online — full conversational AI via HuggingFace |
| 📱 | **Device-adaptive AI** — auto-selects Gemma 2 2B (lower-end) or Gemma 4 E2B (higher-end) |
| ⚡ | **Hybrid routing engine** — switches AI modes based on connectivity & hardware in real time |
| 🧠 | **57 emergency scenarios** — deterministic knowledge base, always available as final fallback |
| 📲 | **Installable PWA** — add to homescreen on any device, works like a native app |
| 🔒 | **Privacy-first** — HuggingFace token stored locally only, never sent anywhere |
| 🌍 | **Runs on anything** — low-end phones, slow networks, no network at all |
| 🧪 | **Built-in resilience demo** — test offline failure and watch graceful degradation live |

---

## 🧠 Architecture — 4 Layers of Intelligence

ARIA doesn't just respond to emergencies — it **thinks** through them. Every query passes through a layered intelligence system. Each layer activates based on exactly what is available at the moment of crisis.

```
╔══════════════════════════════════════════════════════════════╗
║                      USER IN CRISIS                          ║
║                 "What do I do right now?"                    ║
╚══════════════════════════╦═══════════════════════════════════╝
                           ║
                           ▼
╔══════════════════════════════════════════════════════════════╗
║        LAYER 1 — INSTANT PATTERN RECOGNITION                 ║
║                  [ Always Available ]                        ║
╠══════════════════════════════════════════════════════════════╣
║  ▸ Keyword matching + severity classification in <50ms       ║
║  ▸ Maps user input → emergency category instantly            ║
║  ▸ Zero network, zero server, zero latency                   ║
║  ▸ Covers 57 scenario types: fire, flood, cardiac, trauma... ║
╚══════════════════════════╦═══════════════════════════════════╝
                           ║
                           ▼
╔══════════════════════════════════════════════════════════════╗
║        LAYER 2 — OFFLINE KNOWLEDGE ENGINE                    ║
║                  [ Always Available ]                        ║
╠══════════════════════════════════════════════════════════════╣
║  ▸ 57-scenario structured JSON knowledge base                ║
║  ▸ Immediate steps, do's & don'ts, severity levels           ║
║  ▸ Fully cached via Service Worker at install time           ║
║  ▸ The guaranteed last line of defence — never fails         ║
╚══════════════════════════╦═══════════════════════════════════╝
                           ║
           ╔═══════════════╩════════════════╗
           ║                                ║
      [ Online? YES ]                [ Online? NO ]
           ║                                ║
           ▼                                ▼
╔══════════════════════╗      ╔═════════════════════════════════╗
║  LAYER 3A            ║      ║  LAYER 3B — LOCAL GEMMA         ║
║  CLOUD GEMMA 4       ║      ║  via MediaPipe                  ║
║  via HuggingFace     ║      ╠═════════════════════════════════╣
╠══════════════════════╣      ║  Device capability check:       ║
║  ▸ Full Gemma 4      ║      ║                                 ║
║    cloud inference   ║      ║  Lower-end  → Gemma 2 2B        ║
║  ▸ Most powerful     ║      ║  Higher-end → Gemma 4 E2B       ║
║    responses         ║      ║                                 ║
║  ▸ HF token stored   ║      ║  ▸ True on-device inference     ║
║    locally only      ║      ║  ▸ No data leaves the device    ║
╚══════════╦═══════════╝      ╚══════════════════╦══════════════╝
           ║                                     ║
           ╚═══════════════╦═════════════════════╝
                           ║
                           ▼
╔══════════════════════════════════════════════════════════════╗
║        LAYER 4 — ADAPTIVE CONTEXT ENGINE                     ║
║                  hybridEngine.js                             ║
╠══════════════════════════════════════════════════════════════╣
║  ▸ Detects network status + device capability in real-time   ║
║  ▸ Routes to best available engine automatically             ║
║  ▸ Maintains conversation history across engine switches     ║
║  ▸ Graceful degradation — no broken states, ever             ║
║  ▸ Severity escalation — flags when pros are needed          ║
║  ▸ Single source of truth for all UI decisions               ║
║                                                              ║
║       "The brain that decides which brain to use."           ║
╚══════════════════════════════════════════════════════════════╝
```

### Routing Decision Tree

```
Is internet available?
│
├── YES ──► Cloud Gemma 4 (HuggingFace)          [Most powerful]
│
└── NO
     │
     └── Is MediaPipe ready?
          │
          ├── YES
          │    ├── Higher-end device? ──► Gemma 4 E2B (MediaPipe)
          │    └── Lower-end device?  ──► Gemma 2 2B  (MediaPipe)
          │
          └── NO ──────────────────────► Emergency Engine (knowledge.json)
```

### Layer Reference

| # | Layer | Network | Device | Role |
|:---:|:---|:---:|:---:|:---|
| 1️⃣ | Pattern Recognition | ❌ | Any | Classify emergency type in <50ms |
| 2️⃣ | Offline Knowledge Engine | ❌ | Any | Structured survival steps, always on |
| 3️⃣A | Cloud Gemma 4 — HuggingFace | ✅ | Any | Full conversational AI when online |
| 3️⃣B | Local Gemma 2 2B — MediaPipe | ❌ | Lower-end | On-device AI for budget phones |
| 3️⃣B | Local Gemma 4 E2B — MediaPipe | ❌ | Higher-end | On-device AI for capable phones |
| 4️⃣ | Adaptive Context Engine | ❌ | Any | Routes everything, manages all state |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Role |
|:---|:---|
| React + Vite | UI framework — fast, lightweight |
| Tailwind CSS v4 | Utility-first styling |
| PWA + Service Worker | Offline caching, installability |
| Capacitor.js | Android native wrapper |

### AI & Intelligence
| Technology | Role |
|:---|:---|
| **Gemma 4** via HuggingFace Router | Cloud LLM — online mode |
| **Gemma 4 E2B** via MediaPipe | On-device LLM — higher-end offline |
| **Gemma 2 2B** via MediaPipe | On-device LLM — lower-end offline |
| **knowledge.json** | 57-scenario deterministic fallback engine |
| **hybridEngine.js** | Intelligence routing & context management |

### Infrastructure
| Technology | Role |
|:---|:---|
| Render | Cloud hosting & deployment |
| GitHub Actions | CI/CD pipeline |
| Vite PWA Plugin | Service worker generation |
| HuggingFace | Gemma 4 cloud inference endpoint |

---

## 📁 Project Structure

```
aria-emergency-ai/
├── src/
│   ├── components/          # React UI components
│   ├── engine/
│   │   ├── hybridEngine.js  # Layer 4: routing, state, degradation logic
│   │   └── knowledge.json   # Layer 2: 57-scenario offline knowledge base
│   ├── hooks/               # Custom React hooks
│   └── App.jsx              # Root component & entry point
├── public/
│   └── icons/               # PWA icons (all resolutions)
├── android/                 # Capacitor Android project
├── assets/                  # Static assets
├── capacitor.config.ts      # Capacitor configuration
├── vite.config.js           # Vite + PWA plugin config
├── testGemini.js            # API connectivity test script
└── index.html               # HTML entry point
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A free [HuggingFace token](https://huggingface.co/settings/tokens) *(for Cloud Gemma 4 — offline works without it)*

### Run Locally

```bash
# 1. Clone
git clone https://github.com/Siraddeen/aria-emergency-ai.git
cd aria-emergency-ai

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Visit `http://localhost:5173` — ARIA is running.

> To enable Cloud Gemma 4: open the **Settings** tab in the app, paste your HuggingFace token, and hit **Save Token Locally**. It never leaves your device.

### Build for Production

```bash
npm run build
npm run preview
```

### Install as PWA

1. Open the live URL on any phone or desktop
2. **Mobile:** tap browser menu → *"Add to Home Screen"*
3. **Desktop:** click the install icon in the address bar
4. Done — ARIA is installed and works fully offline

### Test Offline Resilience

Open **Settings → Resilience Demo** and tap **"Test Offline Failure"**.

Watch ARIA degrade gracefully in real time:
`Cloud Gemma 4` → `Local Gemma (MediaPipe)` → `Emergency Engine`

No broken UI. No error screens. Just silent, seamless fallback — exactly what you need in a crisis.

---

## 🗂️ Emergency Scenarios Covered

57 scenarios across 8 categories — all available offline:

| Category | Scenarios Include |
|:---|:---|
| 🔥 Fire & Smoke | House fire, wildfire evacuation, electrical fire, car fire |
| 🌊 Floods & Water | Flash flood, drowning, contaminated water |
| 🌍 Natural Disasters | Earthquake, tsunami, tornado, landslide, hurricane |
| 🏥 Medical | Cardiac arrest, choking, severe bleeding, stroke, anaphylaxis |
| ☣️ Hazardous | Gas leak, chemical exposure, carbon monoxide poisoning |
| 🌡️ Environmental | Heatstroke, hypothermia, frostbite |
| 🔒 Safety & Security | Home intrusion, civil unrest, being lost |
| 🚗 Accidents | Vehicle crash, road accident first response |

---

## 🌍 Real-World Impact

The people who need emergency AI the most are often the ones with the least access to it:

- Rural communities with no cell coverage
- Disaster zones where towers and infrastructure are down
- Low-income regions with limited or expensive mobile data
- Hikers, campers, and travelers in remote areas
- Developing countries where internet is unreliable

ARIA runs **real on-device Gemma inference** — not just static cached text — so it can answer follow-up questions, adapt to context, and think through complex situations even with zero connectivity.

The digital divide should never become a survival divide.

---

## 🔧 System Status (Live App)

| Component | Status |
|:---|:---|
| Cloud Gemma 4 (HuggingFace) | ✅ Active when token set |
| Local Gemma 2 2B (MediaPipe) | ✅ Loaded — stable, lower-end |
| Local Gemma 4 E2B (MediaPipe) | ✅ Available — powerful, higher-end |
| Emergency Knowledge Engine | ✅ Always Active — 57 scenarios |
| Offline Mode | ✅ Fully functional |

---

## 🤝 Contributing

Contributions are welcome — especially from people who've seen disasters firsthand.

```bash
git checkout -b feature/your-feature
git commit -m "Add: description"
git push origin feature/your-feature
# Open a Pull Request
```

**High-impact areas:**
- 🌐 Multilingual support (translate ARIA's knowledge base)
- 📚 Add more scenarios to `knowledge.json`
- 📱 Expand the Android build via Capacitor
- 🔬 Benchmark Gemma 2 2B vs Gemma 4 E2B on real devices

---

## 👤 Built By

**Siraddeen** — Full Stack Developer & AI Builder

- GitHub: [@Siraddeen](https://github.com/Siraddeen)
- LinkedIn: [linkedin.com/in/siraddeen](https://linkedin.com/in/siraddeen)

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

<br/>

**Built for the Gemma 4 Good Hackathon 2026**

*In emergencies, AI shouldn't require a signal.*
*ARIA doesn't.*

<br/>

⭐ **Star this repo if ARIA could save a life** ⭐

</div>
