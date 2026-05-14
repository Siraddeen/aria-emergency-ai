/**
 * gemmaEngine.js — ARIA Online AI Engine
 *
 * CHANGE: Replaced saveToLocalMemory() with saveOnlineInteraction() from ariaMemory.js
 * This feeds the adaptive learning system — every online response now teaches
 * ARIA new phrase → scenario mappings that work in offline mode.
 *
 * Also added scenarioKey inference to the JSON response so offlineEngine can
 * match against known knowledge.json entries when learning from online chats.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveOnlineInteraction } from "./ariaMemory";

// const GEMMA_API_KEY = import.meta.env.VITE_GEMMA_API_KEY;
function getApiKey() {
  return (
    localStorage.getItem("aria_api_key") ||
    import.meta.env.VITE_GEMMA_API_KEY ||
    ""
  );
}
// const genAI = new GoogleGenerativeAI(GEMMA_API_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// Added scenarioKey field — maps to knowledge.json keys so offline learning
// can directly reuse existing scenario data rather than storing duplicates.
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are ARIA — Adaptive Resilience Intelligence Assistant.

You are an emergency survival assistant designed for real-world crisis situations including war zones, natural disasters, and low-connectivity environments.

Your role is to provide calm, clear, life-saving guidance.

IMPORTANT RULES:
- Always stay calm and practical
- Never cause panic — be direct but reassuring
- Prioritize immediate safety above everything
- Give concrete, actionable steps
- Be brief but complete
- Estimate emergency severity accurately using these rules:
  * critical: immediate life threat (cardiac arrest, not breathing, severe bleeding, gunshot)
  * high: serious but not immediately fatal (broken bone, deep wound, high fever, fire)
  * medium: concerning but manageable (smelly water, mild injury, potential contamination)
  * low: informational, general safety questions, no immediate danger
- Smelly or questionable water = medium, NOT critical
- Questions about safety precautions = low or medium
- Confidence should be from 0 to 100

You MUST respond ONLY in valid JSON with this exact structure (no markdown, no extra text):

{
  "title": "Brief title of the situation",
  "category": "health|fire|electricity|water|general|survival|technical",
  "severity": "low|medium|high|critical",
  "confidence": 85,
  "scenarioKey": "the_closest_matching_scenario_key_or_null",
  "summary": "One clear sentence summary",
  "steps": ["Immediate action 1", "Immediate action 2", "Step 3"],
  "avoid": ["Thing to avoid 1", "Thing to avoid 2"],
  "when_to_seek_help": ["Condition requiring professional help 1", "Condition 2"]
}

For scenarioKey, use one of these known values when applicable (or null if none fit):
cpr, bleeding, burns, fire, fever, bone_fracture, fall_injury, spinal_injury,
drowning, snakebite, allergic_reaction, choking, electric_shock, gas_leak,
chemical_attack, nuclear_radiation, heat_exhaustion, dehydration_treatment,
infection_sepsis, gunshot_wound, childbirth_emergency, triage, wound_closure,
water, water_purification_advanced, water_collection, food_preservation,
shelter, fire_making, navigation, signal_rescue, plant_identification,
animal_threats, long_term_survival, solar_power, battery_diy,
electricity_generation, building_defenses, document_preservation,
communication_security, explosive_landmine, psychological_first_aid,
medicine_improvised, bridge_crossing
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function getGemmaResponse(userMessage, conversationHistory = []) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const historyText = conversationHistory
      .slice(-10)
      .map((msg) => {
        if (msg.role === "user") {
          return `User: ${msg.parts?.[0]?.text || msg.content || ""}`;
        }
        return `Assistant: ${msg.parts?.[0]?.text || msg.content || ""}`;
      })
      .join("\n");

    const fullPrompt = `${SYSTEM_PROMPT}

Conversation History:
${historyText}

Current User Message:
${userMessage}
`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("Empty AI response");

    // Strip markdown code fences if Gemini wraps in them
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.warn("[ARIA Gemma] JSON parse failed, raw response:", cleaned);
      // Return a safe fallback structure
      return {
        mode: "online",
        source: "gemma",
        title: "AI Response",
        category: "general",
        severity: "medium",
        confidence: 40,
        scenarioKey: null,
        summary: cleaned,
        steps: ["Follow general safety precautions"],
        avoid: ["Do not panic"],
        when_to_seek_help: ["If situation worsens"],
      };
    }

    const finalResponse = {
      mode: "online",
      source: "gemma",
      ...parsed,
    };

    // ── ADAPTIVE LEARNING: save to ariaMemory for offline use ─────────────
    // This is the core of the self-sufficiency system.
    // Next time the user types something similar offline, ARIA will know it.
    saveOnlineInteraction(userMessage, finalResponse);

    return finalResponse;
  } catch (err) {
    console.error("[ARIA Gemma] SDK Error:", err);
    throw err;
  }
}
