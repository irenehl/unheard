"use client";

import { useSyncExternalStore } from "react";
import { Settings } from "lucide-react";
import {
  getStoredReadingPrefs,
  setStoredReadingPrefs,
  applyReadingPrefs,
  DEFAULT_PREFS,
  type ReadingPrefs,
  type FontSize,
} from "@/lib/readingPrefs";
import { ReadingPrefsPopover } from "./ReadingPrefsPopover";

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

export function ReadingPrefsGlobal() {
  const prefs = useSyncExternalStore(
    subscribeReadingPrefs,
    getReadingPrefsSnapshot,
    getServerSnapshot
  );

  const updatePrefs = (updates: Partial<ReadingPrefs>) => {
    const newPrefs: ReadingPrefs = { ...prefs, ...updates };
    setStoredReadingPrefs(newPrefs);
    applyReadingPrefs(newPrefs);
    // Dispatch storage event to sync across tabs
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  return (
    <ReadingPrefsPopover
      fontSize={prefs.fontSize}
      highContrast={prefs.highContrast}
      reduceMotion={prefs.reduceMotion}
      reduceTexture={prefs.reduceTexture}
      onFontSize={(size: FontSize) => updatePrefs({ fontSize: size })}
      onHighContrast={(on: boolean) => updatePrefs({ highContrast: on })}
      onReduceMotion={(on: boolean) => updatePrefs({ reduceMotion: on })}
      onReduceTexture={(on: boolean) => updatePrefs({ reduceTexture: on })}
    />
  );
}
