import { useState, useEffect, useCallback, useRef } from "react";
import { getResponse, getQuickResponse } from "../engine/hybridEngine";

// ─────────────────────────────────────────────
// STORAGE KEYS
// ─────────────────────────────────────────────

const HISTORY_KEY = "aria_chat_history";
const MODE_KEY = "aria_network_mode";
const SESSIONS_KEY = "ARIA_SESSIONS";

const MAX_HISTORY = 50;
const REQUEST_COOLDOWN = 1800;

// ─────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────

export function useARIA({ onCriticalAlert } = {}) {
  // ─────────────────────────────────────────────
  // CORE CHAT STATE
  // ─────────────────────────────────────────────

  const [messages, setMessages] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [conversationHistory, setConversationHistory] = useState([]);

  const [lastRequestTime, setLastRequestTime] = useState(0);

  // FIX: ref instead of state — never stale inside useCallback closures
  const quotaModeRef = useRef(false);

  // ─────────────────────────────────────────────
  // NETWORK STATE
  // ─────────────────────────────────────────────

  const [physicallyOnline, setPhysicallyOnline] = useState(navigator.onLine);

  const [userMode, setUserModeState] = useState(
    () => localStorage.getItem(MODE_KEY) || "auto",
  );

  // ─────────────────────────────────────────────
  // SESSION STATE
  // ─────────────────────────────────────────────

  const [sessions, setSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState(null);

  // ─────────────────────────────────────────────
  // RESOLVED NETWORK MODE
  // ─────────────────────────────────────────────

  const resolvedMode = (() => {
    if (userMode === "offline") {
      return "offline";
    }

    if (userMode === "online") {
      return physicallyOnline ? "online" : "offline";
    }

    return physicallyOnline ? "online" : "offline";
  })();

  const isOnline = resolvedMode === "online";

  // ─────────────────────────────────────────────
  // LOAD HISTORY
  // ─────────────────────────────────────────────

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);

      if (saved) {
        setMessages(JSON.parse(saved).slice(-MAX_HISTORY));
      }
    } catch (e) {
      console.warn("[ARIA] Failed loading history:", e);
    }
  }, []);

  // ─────────────────────────────────────────────
  // SAVE HISTORY
  // ─────────────────────────────────────────────

  useEffect(() => {
    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(messages.slice(-MAX_HISTORY)),
      );
    } catch (e) {
      console.warn("[ARIA] Failed saving history:", e);
    }
  }, [messages]);

  // ─────────────────────────────────────────────
  // SAVE SESSIONS
  // ─────────────────────────────────────────────

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn("[ARIA] Failed saving sessions:", e);
    }
  }, [sessions]);

  // ─────────────────────────────────────────────
  // ONLINE / OFFLINE LISTENERS
  // ─────────────────────────────────────────────

  useEffect(() => {
    const goOnline = () => {
      setPhysicallyOnline(true);
    };

    const goOffline = () => {
      setPhysicallyOnline(false);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ─────────────────────────────────────────────
  // SET USER MODE
  // ─────────────────────────────────────────────

  const setUserMode = useCallback((mode) => {
    setUserModeState(mode);

    localStorage.setItem(MODE_KEY, mode);
  }, []);

  // ─────────────────────────────────────────────
  // CREATE SESSION
  // ─────────────────────────────────────────────

  function createNewSession(firstMessage, response) {
    return {
      id: crypto.randomUUID(),

      title:
        response?.title || firstMessage?.slice(0, 40) || "Emergency Session",

      createdAt: Date.now(),

      updatedAt: Date.now(),

      mode: response?.mode || "offline",

      messages: [],
    };
  }

  // ─────────────────────────────────────────────
  // OPEN SESSION
  // ─────────────────────────────────────────────

  const openSession = useCallback((session) => {
    if (!session) return;

    setMessages(session.messages || []);

    setActiveSessionId(session.id);

    const rebuiltHistory = (session.messages || [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",

        parts: [
          {
            text: m.response?.summary || m.text || "",
          },
        ],
      }));

    setConversationHistory(rebuiltHistory);
  }, []);

  // ─────────────────────────────────────────────
  // SEND MESSAGE
  // ─────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text) => {
      // prevent spam while loading
      if (isLoading) {
        console.warn("[ARIA] Request blocked: already loading");

        return;
      }

      // cooldown
      const now = Date.now();

      if (now - lastRequestTime < REQUEST_COOLDOWN) {
        console.warn("[ARIA] Cooldown active");

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 999,

            role: "system",

            response: {
              uiType: "compact",

              title: "Slow Down",

              summary:
                "Too many requests sent quickly. Please wait a moment before sending again.",

              severity: "low",

              intent: "system",
            },

            timestamp: new Date().toISOString(),
          },
        ]);

        return;
      }

      setLastRequestTime(now);

      const userMsg = {
        id: Date.now(),

        role: "user",

        text,

        timestamp: new Date().toISOString(),
      };

      // show user message instantly
      setMessages((prev) => [...prev, userMsg]);

      setIsLoading(true);

      try {
        const response = await getResponse(text, conversationHistory, userMode);

        // FIX: null check BEFORE using response
        if (!response) {
          throw new Error("Empty response");
        }

        // FIX: reset quota flag synchronously via ref
        if (!response.fallback) {
          quotaModeRef.current = false;
        }

        // detect Gemini quota exceeded
        if (response.fallback && physicallyOnline) {
          // FIX: ref read is always current — no stale closure
          if (quotaModeRef.current) {
            // already showing quota card, just continue to show the offline response below
          } else {
            quotaModeRef.current = true;

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 555,

                role: "system",

                response: {
                  uiType: "fallback",

                  title: "Cloud AI Temporarily Unavailable",

                  summary:
                    "ARIA continues operating using local offline emergency intelligence.",

                  severity: "medium",

                  intent: "system",

                  footer: "Cloud AI recovery handled automatically.",
                },

                timestamp: new Date().toISOString(),
              },
            ]);
          }
        }

        const assistantMsg = {
          id: Date.now() + 1,

          role: "assistant",

          text: response.summary || "Response generated",

          response,

          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (response.uiType === "critical") {
          onCriticalAlert?.(response);
        }

        // ─────────────────────────────────────────
        // SESSION MANAGEMENT
        // ─────────────────────────────────────────

        setSessions((prevSessions) => {
          let updatedSessions = [...prevSessions];

          // create session
          if (!activeSessionId) {
            const newSession = createNewSession(text, response);

            newSession.messages = [userMsg, assistantMsg];

            updatedSessions.unshift(newSession);

            setActiveSessionId(newSession.id);

            return updatedSessions;
          }

          // update existing session
          updatedSessions = updatedSessions.map((session) => {
            if (session.id !== activeSessionId) {
              return session;
            }

            return {
              ...session,

              updatedAt: Date.now(),

              messages: [...session.messages, userMsg, assistantMsg],
            };
          });

          return updatedSessions;
        });

        // ─────────────────────────────────────────
        // CONVERSATION MEMORY
        // ─────────────────────────────────────────

        setConversationHistory((prev) =>
          [
            ...prev,

            {
              role: "user",

              parts: [{ text }],
            },

            {
              role: "model",

              parts: [
                {
                  text: response.summary || "Emergency response generated",
                },
              ],
            },
          ].slice(-10),
        );
      } catch (err) {
        console.error("[ARIA ERROR FULL]:", err);

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,

            role: "error",

            text: "Failed to get response. Please try again.",

            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },

    [
      conversationHistory,
      userMode,
      activeSessionId,
      isLoading,
      lastRequestTime,
      physicallyOnline,
      onCriticalAlert,
    ],
  );

  // ─────────────────────────────────────────────
  // QUICK ACTIONS
  // FIX: added isLoading guard to prevent spam
  // ─────────────────────────────────────────────

  const sendQuickAction = useCallback(
    async (scenarioKey, label) => {
      // FIX: block if already loading
      if (isLoading) {
        console.warn("[ARIA] Quick action blocked: already loading");
        return;
      }

      const userMsg = {
        id: Date.now(),

        role: "user",

        text: label,

        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);

      setIsLoading(true);

      try {
        let response;

        try {
          response = await getResponse(label, [], userMode);
        } catch {
          response = getQuickResponse(scenarioKey);

          response.fallback = true;
        }

        const assistantMsg = {
          id: Date.now() + 1,

          role: "assistant",

          text: response.summary || label,

          response,

          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (response.uiType === "critical") {
          onCriticalAlert?.(response);
        }
      } finally {
        setIsLoading(false);
      }
    },

    [userMode, isLoading, onCriticalAlert],
  );

  // ─────────────────────────────────────────────
  // CLEAR HISTORY
  // ─────────────────────────────────────────────

  const clearHistory = useCallback(() => {
    setMessages([]);

    setConversationHistory([]);

    setActiveSessionId(null);

    setSessions([]);

    // FIX: also reset quota ref on clear
    quotaModeRef.current = false;

    localStorage.removeItem(HISTORY_KEY);

    localStorage.removeItem(SESSIONS_KEY);
  }, []);

  // ─────────────────────────────────────────────
  // RETURN API
  // ─────────────────────────────────────────────

  return {
    // chat
    messages,
    isLoading,

    // sessions
    sessions,
    activeSessionId,

    // network
    isOnline,

    networkMode: {
      userMode,
      resolvedMode,
      physicallyOnline,
      setMode: setUserMode,
    },

    // actions
    sendMessage,
    sendQuickAction,
    clearHistory,
    openSession,

    // advanced setters
    setMessages,
    setConversationHistory,
    setActiveSessionId,
  };
}
