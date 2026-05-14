<div align="center">

# 🆘 ARIA — Adaptive Resilience Intelligence Assistant

### *AI-powered emergency guidance that works when the world doesn't*

[![Gemma 4 Good Hackathon 2026](https://img.shields.io/badge/Hackathon-Gemma%204%20Good%202026-orange?style=for-the-badge)](https://ai.google.dev/competition)
[![Built with Gemma](https://img.shields.io/badge/Powered%20by-Gemma%202.5%20Flash-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![React + Vite](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/Offline--First-PWA-purple?style=for-the-badge)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**[🌐 Live Demo](https://aria-emergency-ai.onrender.com)** • **[📱 Install as PWA](#installation)** • **[📖 Docs](#architecture)**

---

> *"In a disaster, every second is someone's life. ARIA is there when networks aren't."*

</div>

---

## 🌍 The Problem

When disasters strike — earthquakes, floods, wildfires, medical emergencies — people reach for their phones. But the very infrastructure that powers digital help is often the first thing to fail:

- **Cell towers go down.** No signal, no Google.
- **Data networks collapse.** No connection, no ChatGPT.
- **Power grids fail.** Battery is all you have.

Most AI assistants are cloud-dependent. The moment you need them most, they go silent.

**ARIA doesn't.**

---

## 💡 What is ARIA?

ARIA is an **offline-first emergency AI PWA** that delivers intelligent, context-aware survival guidance directly on your device — no internet required.

It combines:
- A **57-scenario offline knowledge engine** covering the most critical emergency situations
- **Gemma 2.5 Flash** (via Gemini API) for dynamic, conversational AI responses when online
- A **hybrid intelligence system** that seamlessly transitions between offline and online modes
- A **React PWA** that installs on any device and caches everything it needs to survive offline

ARIA is built for the people who need help the most, in the places where help is hardest to get.

---

## 🏆 Hackathon Tracks

This project is submitted to the **[Gemma 4 Good Hackathon 2026](https://ai.google.dev/competition)** across:

| Track | Why ARIA qualifies |
|---|---|
| 🥇 **Main Track** | Novel use of Gemma for real-world social impact |
| 🌵 **Cactus — Local-First Mobile** | Full offline-first PWA, zero cloud dependency for core features |
| 🌐 **Global Resilience Impact** | Designed for underserved, connectivity-limited populations worldwide |

---

## ✨ Key Features

- 🔴 **Works 100% offline** — core knowledge engine runs without any connection
- 🤖 **AI-powered responses** — Gemma 2.5 Flash provides dynamic guidance when online
- ⚡ **Hybrid intelligence** — auto-detects connectivity, switches modes seamlessly
- 📲 **Installable PWA** — add to homescreen, works like a native app
- 🗂️ **57 emergency scenarios** — fires, floods, earthquakes, medical crises, and more
- 🌍 **Designed for global use** — works on low-end devices, slow networks, or no networks
- 🔒 **Privacy-first** — no user data stored, no accounts required

---

## 🧠 Architecture — 4 Layers of Intelligence

ARIA doesn't just respond to emergencies. It *thinks* through them using a layered intelligence system, each layer activating based on what's available at the exact moment of crisis.

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER IN CRISIS                               │
│                 "What do I do right now?"                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
╔═════════════════════════════════════════════════════════════════╗
║  LAYER 1 — INSTANT PATTERN RECOGNITION  (Always Available)     ║
║                                                                 ║
║  • Keyword matching + severity classification                   ║
║  • Maps user input → emergency category in <50ms               ║
║  • Works on 0 bytes of network, 0 watts of server              ║
║  • 57 pre-built scenarios: fires, floods, cardiac, trauma...    ║
║                                                                 ║
║  "ARIA knows what kind of emergency this is before asking."     ║
╚═════════════════════════════════╦═══════════════════════════════╝
                                  │
                                  ▼
╔═════════════════════════════════════════════════════════════════╗
║  LAYER 2 — OFFLINE KNOWLEDGE ENGINE  (Always Available)        ║
║                                                                 ║
║  • Structured JSON knowledge base (57 scenarios × N fields)    ║
║  • Immediate steps, do's & don'ts, severity levels             ║
║  • Cached at install time via Service Worker                   ║
║  • Zero latency, zero dependency                               ║
║                                                                 ║
║  "ARIA gives you step-by-step guidance without the internet."  ║
╚═════════════════════════════════╦═══════════════════════════════╝
                                  │
                         Network available?
                         ┌────────┴────────┐
                        YES               NO
                         │                │
                         ▼                ▼
╔══════════════════════════╗    ╔══════════════════════════════╗
║  LAYER 3 — GEMMA 2.5     ║    ║  GRACEFUL DEGRADATION        ║
║  FLASH (Online Mode)     ║    ║                              ║
║                          ║    ║  • Full offline mode active  ║
║  • Conversational AI     ║    ║  • Layer 1+2 only            ║
║  • Context-aware answers ║    ║  • User notified clearly     ║
║  • Adapts to follow-up   ║    ║  • No broken states, ever    ║
║    questions dynamically ║    ╚══════════════════════════════╝
║  • Explains *why*, not   ║
║    just *what*           ║
╚══════════════╦═══════════╝
               │
               ▼
╔═════════════════════════════════════════════════════════════════╗
║  LAYER 4 — ADAPTIVE CONTEXT ENGINE  (hybridEngine.js)          ║
║                                                                 ║
║  • Unified routing layer across all intelligence modes         ║
║  • Maintains conversation history format consistency           ║
║  • Resolves offline ↔ online transition without data loss      ║
║  • Severity escalation: flags when professional help is needed ║
║  • Single source of truth for UI state decisions               ║
║                                                                 ║
║  "The glue that makes ARIA feel like one brain, not two."      ║
╚═════════════════════════════════════════════════════════════════╝
```

### Layer Summary

| Layer | Name | Network Needed | Role |
|---|---|---|---|
| 1️⃣ | Pattern Recognition | ❌ Never | Classifies the emergency type instantly |
| 2️⃣ | Offline Knowledge Engine | ❌ Never | Delivers structured survival steps |
| 3️⃣ | Gemma 2.5 Flash | ✅ When available | Dynamic, conversational AI guidance |
| 4️⃣ | Adaptive Context Engine | ❌ Never | Orchestrates everything, manages state |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React + Vite** | Fast, lightweight UI framework |
| **Tailwind CSS v4** | Utility-first styling |
| **PWA (Service Worker)** | Offline caching & installability |
| **Capacitor.js** | Native mobile wrapper (Android) |

### AI / Intelligence
| Technology | Purpose |
|---|---|
| **Gemma 2.5 Flash** (via Gemini API) | Primary LLM for dynamic responses |
| **Custom Offline Knowledge Engine** | 57-scenario JSON knowledge base |
| **hybridEngine.js** | Unified intelligence routing layer |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Render** | Cloud deployment & hosting |
| **GitHub Actions** | CI/CD pipeline |
| **Vite PWA Plugin** | Service worker generation |

---

## 📂 Project Structure

```
aria-emergency-ai/
├── src/
│   ├── components/         # React UI components
│   ├── engine/
│   │   ├── hybridEngine.js # Layer 4: Adaptive Context Engine
│   │   ├── knowledge.json  # Layer 2: 57-scenario knowledge base
│   │   └── classifier.js   # Layer 1: Pattern recognition
│   ├── hooks/              # React custom hooks
│   └── App.jsx             # Root component
├── public/
│   └── icons/              # PWA icons (all sizes)
├── android/                # Capacitor Android project
├── assets/                 # Static assets
├── capacitor.config.ts     # Capacitor configuration
├── vite.config.js          # Vite + PWA plugin config
└── index.html              # App entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Gemini API key ([get one free](https://aistudio.google.com/))

### Local Development

```bash
# Clone the repo
git clone https://github.com/Siraddeen/aria-emergency-ai.git
cd aria-emergency-ai

# Install dependencies
npm install

# Add your Gemini API key
echo "VITE_GEMINI_API_KEY=your_key_here" > .env

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

### Installation as PWA

1. Open the live URL on any device
2. On mobile: tap **"Add to Home Screen"** in your browser menu
3. On desktop: click the install icon in the address bar
4. ARIA is now installed and works offline

---

## 🌐 Emergency Scenarios Covered

ARIA's knowledge engine covers 57 scenarios across 8 major categories:

| Category | Examples |
|---|---|
| 🔥 Fire & Smoke | House fire, wildfire evacuation, electrical fire, car fire |
| 🌊 Floods & Water | Flash flood, drowning, water contamination |
| 🌍 Natural Disasters | Earthquake, tsunami, tornado, landslide, hurricane |
| 🏥 Medical | Cardiac arrest, choking, severe bleeding, stroke, anaphylaxis |
| ☣️ Hazardous | Gas leak, chemical exposure, carbon monoxide |
| 🌡️ Environmental | Heatstroke, hypothermia, frostbite |
| 🔒 Safety & Security | Home intrusion, civil unrest, getting lost |
| 🚗 Accidents | Vehicle crash, road accident first response |

---

## 🌍 Impact

ARIA is designed for **Global Resilience** — the communities that need emergency guidance the most are often the ones with the least reliable connectivity:

- Rural populations with limited cell coverage
- Disaster zones where infrastructure has collapsed
- Low-income regions with data-limited mobile plans
- Hikers, campers, and travelers in remote areas

By building offline-first, ARIA ensures that **the digital divide doesn't become a survival divide.**

---

## 🤝 Contributing

ARIA is open source and contributions are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "Add: your feature description"
git push origin feature/your-feature
# Open a Pull Request
```

Areas where help is especially welcome:
- 🌐 Translations (making ARIA multilingual)
- 📚 Adding more emergency scenarios to `knowledge.json`
- 📱 React Native mobile version
- 🔌 WebLLM integration for true on-device inference

---

## 👤 Built By

**Siraddeen** — Full Stack Developer & AI Builder

- 🐙 GitHub: [@Siraddeen](https://github.com/Siraddeen)
- 💼 LinkedIn: [linkedin.com/in/siraddeen](https://linkedin.com/in/siraddeen)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for the Gemma 4 Good Hackathon 2026**

*In emergencies, AI shouldn't require a signal. ARIA doesn't.*

⭐ **Star this repo if ARIA could save a life** ⭐

</div>
