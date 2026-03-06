"use client";

import { useSyncExternalStore } from "react";
import { getStoredReadingPrefs, DEFAULT_PREFS, type ReadingPrefs } from "./readingPrefs";

function subscribeReadingPrefs(callback: () => void) {
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }
  return () => {};
}

// Cache the last snapshot to ensure stable references
let cachedSnapshot: ReadingPrefs = DEFAULT_PREFS;
let cachedSnapshotString: string = "";

function getReadingPrefsSnapshot(): ReadingPrefs {
  const current = getStoredReadingPrefs();
  const currentString = JSON.stringify(current);
  
  // Return cached reference if values haven't changed
  if (currentString === cachedSnapshotString) {
    return cachedSnapshot;
  }
  
  // Update cache with new values
  cachedSnapshot = current;
  cachedSnapshotString = currentString;
  return cachedSnapshot;
}

function getServerSnapshot(): ReadingPrefs {
  return DEFAULT_PREFS;
}

/**
 * Hook to check if motion should be reduced.
 * Combines system preference (prefers-reduced-motion) with user preference.
 */
export function useShouldReduceMotion(): boolean {
  const prefs = useSyncExternalStore(
    subscribeReadingPrefs,
    getReadingPrefsSnapshot,
    getServerSnapshot
  );

  if (typeof window !== "undefined") {
    const markerKey = "__agentDebug269760MotionLogged__";
    const markerStore = window as unknown as Record<string, unknown>;
    if (!markerStore[markerKey]) {
      markerStore[markerKey] = true;
      // #region agent log
      fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "269760" },
        body: JSON.stringify({
          sessionId: "269760",
          runId: "run2",
          hypothesisId: "H1",
          location: "lib/motionPrefs.ts:useShouldReduceMotion",
          message: "Client instrumentation heartbeat",
          data: { reduceMotionPref: prefs.reduceMotion },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }
  }

  // Check system preference
  if (typeof window !== "undefined") {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return true;
  }

  // Check user preference
  return prefs.reduceMotion;
}
