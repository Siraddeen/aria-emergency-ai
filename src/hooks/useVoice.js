/**
 * useVoice.js
 *
 * ARIA Voice System
 *
 * FEATURES:
 * - Native Android microphone permissions
 * - Capacitor speech recognition on mobile
 * - Browser SpeechRecognition fallback on desktop
 * - Offline-capable TTS
 * - Live transcript preview
 * - Graceful cleanup
 * - Emergency-safe behavior
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

// ─────────────────────────────────────────────
// PLATFORM DETECTION
// ─────────────────────────────────────────────

const isNativeMobile = Capacitor.isNativePlatform();

const BrowserSpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const synth = window.speechSynthesis || null;

// ─────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────

export function useVoice() {
  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────

  const [voiceMode, setVoiceMode] = useState(false);

  const [isListening, setIsListening] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [transcript, setTranscript] = useState("");

  const [error, setError] = useState(null);

  const [permissionGranted, setPermissionGranted] = useState(false);

  // Browser support flags
  const canRecognize = isNativeMobile
    ? true
    : Boolean(BrowserSpeechRecognition);

  const canSpeak = Boolean(synth);

  // refs
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);

  // ─────────────────────────────────────────
  // MOBILE PERMISSION CHECK
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!isNativeMobile) return;

    checkMobilePermissions();
  }, []);

  async function checkMobilePermissions() {
    try {
      const status = await SpeechRecognition.checkPermissions();

      const granted =
        status.speechRecognition === "granted" ||
        status.microphone === "granted";

      setPermissionGranted(granted);
    } catch (err) {
      console.error("[ARIA Voice] Permission check failed", err);
    }
  }

  // ─────────────────────────────────────────
  // BROWSER RECOGNITION SETUP
  // Desktop/Web fallback
  // ─────────────────────────────────────────

  useEffect(() => {
    if (isNativeMobile) return;

    if (!BrowserSpeechRecognition) return;

    const recognition = new BrowserSpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setTranscript(final || interim);
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        setError("Microphone permission denied");
      } else if (event.error === "no-speech") {
        setError("No speech detected");
      } else {
        setError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  // ─────────────────────────────────────────
  // START MOBILE LISTENING
  // Native Android recognition
  // ─────────────────────────────────────────

  const startMobileListening = async () => {
    try {
      setError(null);

      // Request permissions
      const permission = await SpeechRecognition.requestPermissions();

      const granted =
        permission.speechRecognition === "granted" ||
        permission.microphone === "granted";

      if (!granted) {
        setError("Microphone permission denied");
        return;
      }

      setPermissionGranted(true);

      // Stop TTS before listening
      if (synth?.speaking) {
        synth.cancel();
        setIsSpeaking(false);
      }

      setTranscript("");
      setIsListening(true);

      // Start native recognition
      await SpeechRecognition.start({
        language: "en-US",
        maxResults: 1,
        partialResults: true,
        popup: false,
      });
    } catch (err) {
      console.error("[ARIA Voice] Mobile start failed", err);

      setIsListening(false);

      setError("Could not start microphone");
    }
  };

  // ─────────────────────────────────────────
  // MOBILE LISTENERS
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!isNativeMobile) return;

    let partialListener;
    let finalListener;

    const setup = async () => {
      partialListener = await SpeechRecognition.addListener(
        "partialResults",
        (data) => {
          if (data.matches?.length > 0) {
            setTranscript(data.matches[0]);
          }
        },
      );

      finalListener = await SpeechRecognition.addListener(
        "listeningState",
        ({ status }) => {
          if (status === "stopped") {
            setIsListening(false);
          }
        },
      );
    };

    setup();

    return () => {
      partialListener?.remove();
      finalListener?.remove();
    };
  }, []);

  // ─────────────────────────────────────────
  // TOGGLE LISTENING
  // ─────────────────────────────────────────

  const toggleListening = useCallback(async () => {
    if (!canRecognize) {
      setError("Voice input unsupported");
      return;
    }

    // MOBILE PATH
    if (isNativeMobile) {
      if (isListening) {
        try {
          await SpeechRecognition.stop();
        } catch {}

        setIsListening(false);

        return;
      }

      await startMobileListening();

      return;
    }

    // DESKTOP / WEB PATH
    const recognition = recognitionRef.current;

    if (!recognition) {
      setError("Recognition unavailable");
      return;
    }

    if (isListening) {
      recognition.stop();
      return;
    }

    if (synth?.speaking) {
      synth.cancel();
      setIsSpeaking(false);
    }

    setTranscript("");
    setError(null);

    try {
      recognition.start();
    } catch (e) {
      recognition.stop();

      setTimeout(() => {
        try {
          recognition.start();
        } catch {}
      }, 200);
    }
  }, [isListening, canRecognize]);

  // ─────────────────────────────────────────
  // CLEAR TRANSCRIPT
  // ─────────────────────────────────────────

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  // ─────────────────────────────────────────
  // TTS SPEAK
  // ─────────────────────────────────────────

  const speak = useCallback(
    (response) => {
      if (!voiceMode) return;

      if (!canSpeak) return;

      if (!response) return;

      synth.cancel();

      const textToSpeak = buildSpeechText(response);

      if (!textToSpeak) return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = "en-US";

      const voices = synth.getVoices();

      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Alex")),
      );

      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => setIsSpeaking(true);

      utterance.onend = () => setIsSpeaking(false);

      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;

      synth.speak(utterance);
    },
    [voiceMode, canSpeak],
  );

  // ─────────────────────────────────────────
  // STOP SPEAKING
  // ─────────────────────────────────────────

  const stopSpeaking = useCallback(() => {
    if (!synth) return;

    synth.cancel();

    setIsSpeaking(false);
  }, []);

  // ─────────────────────────────────────────
  // TOGGLE VOICE MODE
  // ─────────────────────────────────────────

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((prev) => {
      const next = !prev;

      // Turning OFF
      if (!next) {
        // stop listening
        if (isNativeMobile) {
          SpeechRecognition.stop().catch(() => {});
        } else if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
        }

        // stop TTS
        if (synth?.speaking) {
          synth.cancel();
        }

        setIsListening(false);

        setIsSpeaking(false);
      }

      return next;
    });
  }, [isListening]);

  // ─────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (recognitionRef.current && !isNativeMobile) {
        recognitionRef.current.abort();
      }

      if (synth?.speaking) {
        synth.cancel();
      }

      if (isNativeMobile) {
        SpeechRecognition.stop().catch(() => {});
      }
    };
  }, []);

  // ─────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────

  return {
    // state
    voiceMode,
    isListening,
    isSpeaking,
    transcript,
    error,
    permissionGranted,

    // support
    canRecognize,
    canSpeak,

    // actions
    toggleVoiceMode,
    toggleListening,
    clearTranscript,
    speak,
    stopSpeaking,
  };
}

// ─────────────────────────────────────────────
// BUILD SPEECH TEXT
// ─────────────────────────────────────────────

function buildSpeechText(response) {
  if (!response) return "";

  const parts = [];

  if (response.severity === "critical") {
    parts.push("Critical emergency.");
  }

  if (response.title) {
    parts.push(response.title + ".");
  }

  if (response.summary) {
    parts.push(response.summary);
  }

  if (Array.isArray(response.steps) && response.steps.length > 0) {
    parts.push("Immediate steps.");

    response.steps.slice(0, 3).forEach((step, i) => {
      parts.push(`Step ${i + 1}: ${step}`);
    });

    if (response.steps.length > 3) {
      parts.push(
        `And ${response.steps.length - 3} more steps shown on screen.`,
      );
    }
  }

  return parts.join(" ");
}
