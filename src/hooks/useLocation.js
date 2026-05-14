/**
 * useLocation.js
 *
 * ARIA Hybrid Location System
 *
 * FEATURES:
 * - Native Android GPS permissions
 * - Capacitor geolocation on mobile
 * - Browser geolocation fallback
 * - GPS caching
 * - Emergency-safe timeout handling
 * - Graceful permission recovery
 */

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

// ─────────────────────────────────────────────
// PLATFORM DETECTION
// ─────────────────────────────────────────────

const isNativeMobile = Capacitor.isNativePlatform();

// ─────────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────────

const CACHE_KEY = "aria_gps_cache";

const CACHE_TTL = 5 * 60 * 1000;

// ─────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────

export function useLocation() {
  const [location, setLocation] = useState(null);

  // idle | requesting | granted | denied | unavailable
  const [status, setStatus] = useState("idle");

  const [error, setError] = useState(null);

  // ─────────────────────────────────────────
  // MAIN REQUEST FUNCTION
  // ─────────────────────────────────────────

  async function requestLocation() {
    // Check cache first
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setLocation(cached);

        setStatus("granted");

        return cached;
      }
    } catch {}

    setStatus("requesting");

    setError(null);

    // MOBILE NATIVE PATH
    if (isNativeMobile) {
      return requestNativeLocation();
    }

    // BROWSER PATH
    return requestBrowserLocation();
  }

  // ─────────────────────────────────────────
  // NATIVE MOBILE LOCATION
  // ─────────────────────────────────────────

  async function requestNativeLocation() {
    try {
      // Request Android permissions
      const permission = await Geolocation.requestPermissions();

      const granted =
        permission.location === "granted" ||
        permission.coarseLocation === "granted";

      if (!granted) {
        setStatus("denied");

        setError("Location permission denied");

        return null;
      }

      // Native GPS request
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: CACHE_TTL,
      });

      const result = {
        lat: pos.coords.latitude,

        lng: pos.coords.longitude,

        accuracy: Math.round(pos.coords.accuracy || 0),

        timestamp: Date.now(),
      };

      cacheLocation(result);

      setLocation(result);

      setStatus("granted");

      return result;
    } catch (err) {
      console.error("[ARIA Location] Native location failed", err);

      setStatus("unavailable");

      if (err?.message?.includes("denied")) {
        setError("Location permission denied");
      } else if (err?.message?.includes("timeout")) {
        setError("GPS request timed out");
      } else {
        setError("Unable to access GPS");
      }

      return null;
    }
  }

  // ─────────────────────────────────────────
  // BROWSER LOCATION
  // ─────────────────────────────────────────

  async function requestBrowserLocation() {
    if (!navigator.geolocation) {
      setStatus("unavailable");

      setError("GPS unsupported");

      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result = {
            lat: pos.coords.latitude,

            lng: pos.coords.longitude,

            accuracy: Math.round(pos.coords.accuracy),

            timestamp: Date.now(),
          };

          cacheLocation(result);

          setLocation(result);

          setStatus("granted");

          resolve(result);
        },

        (err) => {
          if (err.code === 1) {
            setStatus("denied");

            setError("Location permission denied");
          } else if (err.code === 2) {
            setStatus("unavailable");

            setError("Location unavailable");
          } else {
            setStatus("unavailable");

            setError("Location request timed out");
          }

          resolve(null);
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: CACHE_TTL,
        },
      );
    });
  }

  // ─────────────────────────────────────────
  // CACHE LOCATION
  // ─────────────────────────────────────────

  function cacheLocation(result) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch {}
  }

  // ─────────────────────────────────────────
  // RETRY
  // ─────────────────────────────────────────

  async function retry() {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {}

    setLocation(null);

    setError(null);

    setStatus("idle");

    return requestLocation();
  }

  // ─────────────────────────────────────────
  // FORMATTED HELPERS
  // ─────────────────────────────────────────

  const locationString = location
    ? `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`
    : null;

  const mapsUrl = location
    ? `https://maps.google.com/?q=${location.lat},${location.lng}`
    : null;

  const accuracyText = location ? `±${location.accuracy}m` : null;

  // ─────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────

  return {
    // state
    location,
    status,
    error,

    // formatted
    locationString,
    mapsUrl,
    accuracyText,

    // actions
    retry,
    requestLocation,
  };
}
