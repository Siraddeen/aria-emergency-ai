/**
 * emergencyContacts.js
 *
 * ARIA Emergency Contact Intelligence Layer
 *
 * Features:
 * - Detects user region automatically
 * - Returns localized emergency numbers
 * - Generates SOS messages
 * - Safe browser fallbacks
 * - Optimized for disaster/offline environments
 */

// ─────────────────────────────────────────────
// EMERGENCY DATABASE
// ─────────────────────────────────────────────

const EMERGENCY_DB = {
  IN: {
    country: "India",
    police: "100",
    ambulance: "108",
    fire: "101",
    unified: "112",
    sosNumber: "112",
  },

  US: {
    country: "United States",
    police: "911",
    ambulance: "911",
    fire: "911",
    unified: "911",
    sosNumber: "911",
  },

  GB: {
    country: "United Kingdom",
    police: "999",
    ambulance: "999",
    fire: "999",
    unified: "999",
    sosNumber: "999",
  },

  AU: {
    country: "Australia",
    police: "000",
    ambulance: "000",
    fire: "000",
    unified: "000",
    sosNumber: "000",
  },

  CA: {
    country: "Canada",
    police: "911",
    ambulance: "911",
    fire: "911",
    unified: "911",
    sosNumber: "911",
  },

  DE: {
    country: "Germany",
    police: "110",
    ambulance: "112",
    fire: "112",
    unified: "112",
    sosNumber: "112",
  },

  FR: {
    country: "France",
    police: "17",
    ambulance: "15",
    fire: "18",
    unified: "112",
    sosNumber: "112",
  },

  PK: {
    country: "Pakistan",
    police: "15",
    ambulance: "115",
    fire: "16",
    unified: "1122",
    sosNumber: "1122",
  },

  BD: {
    country: "Bangladesh",
    police: "999",
    ambulance: "199",
    fire: "199",
    unified: "999",
    sosNumber: "999",
  },

  NG: {
    country: "Nigeria",
    police: "112",
    ambulance: "112",
    fire: "112",
    unified: "112",
    sosNumber: "112",
  },

  BR: {
    country: "Brazil",
    police: "190",
    ambulance: "192",
    fire: "193",
    unified: "192",
    sosNumber: "190",
  },

  ZA: {
    country: "South Africa",
    police: "10111",
    ambulance: "10177",
    fire: "10177",
    unified: "112",
    sosNumber: "112",
  },

  UA: {
    country: "Ukraine",
    police: "102",
    ambulance: "103",
    fire: "101",
    unified: "112",
    sosNumber: "112",
  },

  IL: {
    country: "Israel",
    police: "100",
    ambulance: "101",
    fire: "102",
    unified: "101",
    sosNumber: "100",
  },

  DEFAULT: {
    country: "International",
    police: "112",
    ambulance: "112",
    fire: "112",
    unified: "112",
    sosNumber: "112",
  },
};

// ─────────────────────────────────────────────
// TIMEZONE MAP
// ─────────────────────────────────────────────

const TIMEZONE_TO_COUNTRY = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",

  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",

  "Europe/London": "GB",

  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",

  "America/Toronto": "CA",

  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",

  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",

  "Africa/Lagos": "NG",

  "America/Sao_Paulo": "BR",

  "Africa/Johannesburg": "ZA",

  "Europe/Kyiv": "UA",

  "Asia/Jerusalem": "IL",
};

// ─────────────────────────────────────────────
// LANGUAGE FALLBACK MAP
// ─────────────────────────────────────────────

const LANGUAGE_TO_COUNTRY = {
  "en-IN": "IN",
  "hi-IN": "IN",
  "te-IN": "IN",
  "ta-IN": "IN",

  "en-US": "US",
  "en-GB": "GB",
  "en-AU": "AU",
  "en-CA": "CA",

  "de-DE": "DE",
  "fr-FR": "FR",

  "ur-PK": "PK",
  "bn-BD": "BD",

  "pt-BR": "BR",

  "af-ZA": "ZA",

  "uk-UA": "UA",

  "he-IL": "IL",
};

// ─────────────────────────────────────────────
// DETECT USER REGION
// ─────────────────────────────────────────────

export function detectRegion() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz];
    }
  } catch (err) {
    console.warn("[ARIA] Timezone detection failed");
  }

  try {
    const lang = navigator.language || navigator.languages?.[0];

    if (lang && LANGUAGE_TO_COUNTRY[lang]) {
      return LANGUAGE_TO_COUNTRY[lang];
    }

    const region = lang?.split("-")[1];

    if (region && EMERGENCY_DB[region]) {
      return region;
    }
  } catch (err) {
    console.warn("[ARIA] Language detection failed");
  }

  return "DEFAULT";
}

// ─────────────────────────────────────────────
// GET CONTACTS
// ─────────────────────────────────────────────

export function getEmergencyContacts(regionCode = null) {
  const code = regionCode || detectRegion();

  return EMERGENCY_DB[code] || EMERGENCY_DB.DEFAULT;
}

// ─────────────────────────────────────────────
// GET DISPLAY LABEL
// Example:
// India • 112
// United States • 911
// ─────────────────────────────────────────────

export function getEmergencyDisplay(regionCode = null) {
  const contacts = getEmergencyContacts(regionCode);

  return `${contacts.country} • ${contacts.unified}`;
}

// ─────────────────────────────────────────────
// CALL EMERGENCY
// ─────────────────────────────────────────────

export function triggerEmergencyCall(regionCode = null) {
  const contacts = getEmergencyContacts(regionCode);

  try {
    window.location.href = `tel:${contacts.unified}`;
  } catch (err) {
    console.error("[ARIA] Emergency call failed:", err);

    alert(`${contacts.country} Emergency Number:\n\n${contacts.unified}`);
  }
}

// ─────────────────────────────────────────────
// BUILD SOS MESSAGE
// ─────────────────────────────────────────────

export function buildSOSMessage(location = null) {
  const contacts = getEmergencyContacts();

  const lines = [];

  lines.push("🆘 EMERGENCY — I NEED HELP");

  lines.push(
    `📞 Emergency Services: ${contacts.country} • ${contacts.unified}`,
  );

  if (location) {
    lines.push(`📍 https://maps.google.com/?q=${location.lat},${location.lng}`);

    lines.push(
      `Coordinates: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
    );

    if (location.accuracy) {
      lines.push(`Accuracy: ±${Math.round(location.accuracy)}m`);
    }
  } else {
    lines.push("📍 Location unavailable");
  }

  lines.push("Sent via ARIA Emergency Assistant");

  return lines.join("\n");
}

// ─────────────────────────────────────────────
// DEBUG LOG
// ─────────────────────────────────────────────

console.log("[ARIA] Emergency region:", detectRegion(), getEmergencyContacts());
