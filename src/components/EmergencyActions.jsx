/**
 * EmergencyActions.jsx
 *
 * The bottom action bar inside CriticalAlert.
 * - CALL HELP: dials region-correct emergency number
 * - SOS MODE: opens SMS/share with GPS location
 * - Shows GPS status and detected region
 */
import { useState } from "react";
import { useLocation } from "../hooks/useLocation";
import {
  getEmergencyContacts,
  buildSOSMessage,
} from "../engine/emergencyContacts";

export default function EmergencyActions() {
  const { location, status, locationString, mapsUrl, retry, requestLocation } =
    useLocation();
  const [sosTriggered, setSosTriggered] = useState(false);

  const contacts = getEmergencyContacts(); // auto-detects region

  // ─────────────────────────────────────────
  // CALL HELP
  // ─────────────────────────────────────────

  function handleCallHelp() {
    window.location.href = `tel:${contacts.unified}`;
  }

  // ─────────────────────────────────────────
  // SOS MODE — SMS with location
  // ─────────────────────────────────────────


async function handleSOS() {
  // Request GPS ONLY when user presses SOS
  const freshLocation = await requestLocation();

  setSosTriggered(true);

  // Use freshly returned GPS immediately
  const message = buildSOSMessage(
    freshLocation || location
  );

  // Try native share sheet first
  if (navigator.share) {
    navigator
      .share({
        title: "🆘 EMERGENCY — I NEED HELP",
        text: message,
      })
      .catch(() => {
        // fallback to SMS
        fallbackToSMS(message);
      });
  } else {
    fallbackToSMS(message);
  }
}
  function fallbackToSMS(message) {
    // sms: URI — opens SMS app with pre-filled message
    const encoded = encodeURIComponent(message);
    window.location.href = `sms:${contacts.sosNumber}?body=${encoded}`;
  }

  // ─────────────────────────────────────────
  // GPS STATUS DISPLAY
  // ─────────────────────────────────────────

  function GPSStatusBadge() {
    if (status === "requesting") {
      return (
        <div className="flex items-center gap-1.5 text-yellow-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          Getting location...
        </div>
      );
    }

    if (status === "granted" && location) {
      return (
        <div className="flex items-center gap-1.5 text-[#00d4aa] font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
          📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          <span className="text-[#4a5568]">±{location.accuracy}m</span>
        </div>
      );
    }

    if (status === "denied" || status === "unavailable") {
      return (
        <button
          onClick={retry}
          className="flex items-center gap-1.5 text-[#ff6b35] font-mono text-[10px] underline"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b35]" />
          Location unavailable — tap to retry
        </button>
      );
    }

    return null;
  }

  return (
    <div className="border-t border-red-500/30 bg-[#0a0a0a] px-4 pt-3 pb-4">
      {/* GPS + REGION STATUS BAR */}
      <div className="flex items-center justify-between mb-3">
        <GPSStatusBadge />
        <span className="font-mono text-[10px] text-[#4a5568]">
          Emergency: {contacts.unified} ({contacts.country})
        </span>
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-3">
        {/* CALL HELP */}
        <button
          onClick={handleCallHelp}
          className="flex flex-col items-center justify-center gap-1 bg-red-600 active:bg-red-700 text-white py-4 rounded-2xl font-black tracking-wide transition-all active:scale-95"
        >
          <span className="text-2xl">📞</span>
          <span className="text-sm font-black">CALL HELP</span>
          <span className="font-mono text-[11px] text-red-200 font-normal">
            {contacts.unified}
          </span>
        </button>

        {/* SOS MODE */}
        <button
          onClick={handleSOS}
          className={`flex flex-col items-center justify-center gap-1 py-4 rounded-2xl font-black tracking-wide transition-all active:scale-95
            ${
              sosTriggered
                ? "bg-yellow-400 active:bg-yellow-500 text-black"
                : "bg-yellow-500 active:bg-yellow-600 text-black"
            }`}
        >
          <span className="text-2xl">⚡</span>
          <span className="text-sm font-black">SOS MODE</span>
          <span className="font-mono text-[11px] text-yellow-900 font-normal">
            {status === "granted" ? "SMS + Location" : "SMS Alert"}
          </span>
        </button>
      </div>

      {/* MAPS LINK — shows if GPS available */}
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mt-3 py-2 rounded-xl border border-[#2a3340] text-[#8a9bb0] font-mono text-[11px] active:bg-[#1a1f26] transition-all"
        >
          🗺 Open My Location in Maps
        </a>
      )}
    </div>
  );
}
