/**
 * parseMediaPipeResponse.js
 *
 * Cleans raw MediaPipe/Gemma local output into structured ARIA format.
 */

function cleanLine(line) {
  return line
    .replace(/^#+\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^[-•]\s*/g, "")
    .trim();
}

function pushUnique(arr, value) {
  if (!value) return;
  if (!arr.includes(value)) arr.push(value);
}

export function parseMediaPipeResponse(rawText, userQuery, detectScenario) {
  if (!rawText || typeof rawText !== "string") {
    return null;
  }

  const lines = rawText.split("\n").map(cleanLine).filter(Boolean);

  let title = "Local Intelligence";
  let summary = "";

  const steps = [];
  const avoid = [];
  const seekHelp = [];

  let current = "summary";

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    const upper = line.toUpperCase();

    // ─────────────────────────────
    // HEADERS
    // ─────────────────────────────

    if (upper.startsWith("TITLE") || upper.startsWith("EMERGENCY RESPONSE")) {
      const cleaned = line.replace(/TITLE:?/i, "").trim();

      if (cleaned.length > 3) {
        title = cleaned;
      }

      continue;
    }

    if (upper.startsWith("SUMMARY")) {
      current = "summary";

      const cleaned = line.replace(/SUMMARY:?/i, "").trim();

      if (cleaned) summary = cleaned;

      continue;
    }

    if (
      upper.includes("IMMEDIATE ACTION") ||
      upper.includes("IMMEDIATE STEP")
    ) {
      current = "steps";
      continue;
    }

    if (upper.includes("DO NOT") || upper.includes("AVOID")) {
      current = "avoid";
      continue;
    }

    if (upper.includes("SEEK HELP") || upper.includes("EMERGENCY HELP")) {
      current = "help";
      continue;
    }

    // ─────────────────────────────
    // REMOVE NUMBERING
    // ─────────────────────────────

    const cleaned = line.replace(/^\d+\./, "").trim();

    // ─────────────────────────────
    // SECTION ROUTING
    // ─────────────────────────────

    if (current === "steps") {
      pushUnique(steps, cleaned);
      continue;
    }

    if (current === "avoid") {
      pushUnique(avoid, cleaned);
      continue;
    }

    if (current === "help") {
      pushUnique(seekHelp, cleaned);
      continue;
    }

    // ─────────────────────────────
    // SUMMARY BUILDING
    // ─────────────────────────────

    if (!summary && cleaned.length > 20) {
      summary = cleaned;
    }
  }

  // ─────────────────────────────
  // FALLBACKS
  // ─────────────────────────────

  if (!summary) {
    summary = rawText.slice(0, 180) + "...";
  }

  if (steps.length === 0) {
    steps.push(
      "Assess the situation carefully",
      "Prioritize immediate safety",
      "Seek emergency help if needed",
    );
  }

  return {
    title,
    summary,
    steps,
    avoid,
    when_to_seek_help: seekHelp,
    scenarioKey: detectScenario ? detectScenario(userQuery) : "unknown",
    source: "mediapipe",
    mode: "offline",
    userQuery,
    rawOutput: rawText,
  };
}
