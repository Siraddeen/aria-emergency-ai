/**
 * gemmaCloudProvider.js
 *
 * Talks to HuggingFace Inference API — google/gemma-4-31B-it
 * Single responsibility: build prompt → call API → parse → return ARIA shape.
 */

import { saveOnlineInteraction } from "../ariaMemory";

// ─────────────────────────────────────────────
// HF TOKEN
// ─────────────────────────────────────────────

function getHFToken() {
  return (
    localStorage.getItem("hf_token") || import.meta.env.VITE_HF_TOKEN || ""
  );
}

// ─────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are ARIA — Adaptive Resilience Intelligence Assistant.

You are a calm emergency survival assistant designed for disaster zones, war zones, low connectivity, and survival situations.

Always: stay calm, give actionable steps, prioritize safety, avoid panic, be concise but practical.

Estimate severity:
- critical: immediate life threat (cardiac arrest, not breathing, severe bleeding, gunshot)
- high: serious but not immediately fatal (broken bone, deep wound, high fever, fire)
- medium: concerning but manageable (smelly water, mild injury, contamination risk)
- low: informational, general safety questions, no immediate danger

Return ONLY valid JSON. No markdown. No text outside the JSON object.

{
  "title": "Brief title",
  "category": "health|fire|electricity|water|general|survival|technical",
  "severity": "low|medium|high|critical",
  "confidence": 85,
  "scenarioKey": "closest_known_key_or_null",
  "summary": "One clear sentence",
  "steps": ["Action 1", "Action 2"],
  "avoid": ["Do not do this"],
  "when_to_seek_help": ["Condition 1"]
}

For scenarioKey use one of: cpr, bleeding, burns, fire, fever, bone_fracture, fall_injury,
spinal_injury, drowning, snakebite, allergic_reaction, choking, electric_shock, gas_leak,
chemical_attack, nuclear_radiation, heat_exhaustion, dehydration_treatment, infection_sepsis,
gunshot_wound, childbirth_emergency, triage, wound_closure, water, water_purification_advanced,
water_collection, food_preservation, shelter, fire_making, navigation, signal_rescue,
plant_identification, animal_threats, long_term_survival, solar_power, battery_diy,
electricity_generation, building_defenses, document_preservation, communication_security,
explosive_landmine, psychological_first_aid, medicine_improvised, bridge_crossing — or null.`;

// ─────────────────────────────────────────────
// SAFE JSON PARSE — strips markdown fences
// ─────────────────────────────────────────────

function parseGemmaResponse(rawText) {
  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();
  return JSON.parse(cleaned);
}

// ─────────────────────────────────────────────
// FALLBACK SHAPE — when parse fails
// ─────────────────────────────────────────────

function buildParseFallback(rawText) {
  return {
    title: "ARIA Response",
    category: "general",
    severity: "medium",
    confidence: 40,
    scenarioKey: null,
    summary: rawText.slice(0, 300),
    steps: ["Follow general safety precautions"],
    avoid: ["Do not panic"],
    when_to_seek_help: ["If the situation worsens"],
  };
}

// ─────────────────────────────────────────────
// CLASSIFY HF ERROR
// ─────────────────────────────────────────────

function classifyError(status) {
  if (status === 429) return "QUOTA_EXCEEDED";
  if (status === 401 || status === 403) return "NO_HF_TOKEN";
  return `HF_ERROR_${status}`;
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

/**
 * query()
 *
 * @throws "NO_HF_TOKEN"       — token missing or rejected
 * @throws "QUOTA_EXCEEDED"    — 429 from HuggingFace
 * @throws "TIMEOUT"           — request took > 20s
 * @throws "EMPTY_RESPONSE"    — model returned nothing
 */
export async function query(userMessage, conversationHistory = []) {
  const token = getHFToken();
  if (!token) throw new Error("NO_HF_TOKEN");

  const historyMessages = conversationHistory.slice(-6).map((m) => ({
    role: m.role === "model" ? "assistant" : "user",

    content: m.parts?.[0]?.text || m.content || "",
  }));

  const messages = [
    {
      role: "user",
      content: SYSTEM_PROMPT,
    },

    ...historyMessages,

    {
      role: "user",
      content: userMessage,
    },
  ];

  const startTime = Date.now();

  // 20s timeout — HF can be slower than Gemini
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), 20000),
  );

  const fetchPromise = fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-4-31B-it:novita",
        messages,
      }),
    },
  );

  let response;
  try {
    response = await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    throw err; // TIMEOUT or network error
  }

  if (!response.ok) {
    throw new Error(classifyError(response.status));
  }

  const latencyMs = Date.now() - startTime;
  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || "";

  if (!rawText) throw new Error("EMPTY_RESPONSE");

  let parsed;
  try {
    parsed = parseGemmaResponse(rawText);
  } catch (err) {
    console.warn("[ARIA Cloud] JSON parse fallback:", err.message);
    parsed = buildParseFallback(rawText);
  }

  const finalResponse = {
    mode: "online",
    source: "gemma-4-cloud",
    routingReason: "cloud_ai",
    latencyMs,
    ...parsed,
  };

  try {
    saveOnlineInteraction(userMessage, finalResponse);
  } catch (e) {
    console.warn("[ARIA Memory] Save failed:", e);
  }

  return finalResponse;
}
