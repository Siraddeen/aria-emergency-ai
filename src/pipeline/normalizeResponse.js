function cleanText(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\*\*/g, "")
    .replace(/^#+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanArray(arr) {
  if (!Array.isArray(arr)) return [];

  return [
    ...new Set(
      arr
        .filter(Boolean)
        .map(cleanText)
        .filter((x) => x.length > 0),
    ),
  ];
}

export function normalizeResponse(raw = {}) {
  return {
    ...raw,

    id: raw.id ?? crypto.randomUUID(),

    title: cleanText(raw.title) || "ARIA Response",

    summary:
      cleanText(raw.summary) || "ARIA could not generate a detailed response.",

    severity: raw.severity ?? "medium",

    uiType: raw.uiType ?? null,

    intent: raw.intent ?? null,

    category: raw.category ?? "general",

    mode: raw.mode ?? "offline",

    source: raw.source ?? "offline",

    confidence: typeof raw.confidence === "number" ? raw.confidence : 60,

    fallback: raw.fallback ?? false,

    systemNotice: cleanText(raw.systemNotice),

    routingReason: raw.routingReason ?? "knowledge_engine",

    latencyMs: raw.latencyMs ?? 0,

    steps: cleanArray(raw.steps),

    avoid: cleanArray(raw.avoid),

    when_to_seek_help: cleanArray(raw.when_to_seek_help),

    actions: cleanArray(raw.actions),

    timestamp: raw.timestamp ?? Date.now(),
  };
}
