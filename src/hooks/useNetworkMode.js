import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "aria_network_mode"; // 'auto' | 'online' | 'offline'

export function useNetworkMode() {
  const [physicallyOnline, setPhysicallyOnline] = useState(navigator.onLine);
  const [userMode, setUserMode] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "online",
  );

  // Track real network status
  useEffect(() => {
    const up = () => setPhysicallyOnline(true);
    const down = () => setPhysicallyOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // Persist user preference
  const setMode = useCallback((mode) => {
    setUserMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  // The resolved mode: what the engine should actually use
  const resolvedMode = (() => {
    if (userMode === "offline") return "offline";
    if (userMode === "online") return physicallyOnline ? "online" : "offline"; // can't force online if no connection
    // auto
    return physicallyOnline ? "online" : "offline";
  })();

  return {
    userMode, // what the user selected: 'auto' | 'online' | 'offline'
    resolvedMode, // what will actually be used: 'online' | 'offline'
    physicallyOnline, // raw network status
    setMode, // call this to change user preference
  };
}
