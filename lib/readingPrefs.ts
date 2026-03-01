export type FontSize = "sm" | "md" | "lg";

export interface ReadingPrefs {
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
  reduceTexture: boolean;
}

const READING_PREFS_STORAGE_KEY = "readingPrefs";

export const DEFAULT_PREFS: ReadingPrefs = {
  fontSize: "md",
  highContrast: false,
  reduceMotion: false,
  reduceTexture: false,
};

export function getStoredReadingPrefs(): ReadingPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;

  try {
    const stored = localStorage.getItem(READING_PREFS_STORAGE_KEY);
    if (!stored) return DEFAULT_PREFS;

    const parsed = JSON.parse(stored);
    return {
      fontSize: parsed.fontSize === "sm" || parsed.fontSize === "lg" ? parsed.fontSize : "md",
      highContrast: Boolean(parsed.highContrast),
      reduceMotion: Boolean(parsed.reduceMotion),
      reduceTexture: Boolean(parsed.reduceTexture),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function setStoredReadingPrefs(prefs: ReadingPrefs): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(READING_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export function applyReadingPrefs(prefs: ReadingPrefs): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  
  // Apply font size
  root.dataset.fontSize = prefs.fontSize;
  
  // Apply high contrast
  if (prefs.highContrast) {
    root.dataset.highContrast = "true";
  } else {
    delete root.dataset.highContrast;
  }
  
  // Apply reduce motion
  if (prefs.reduceMotion) {
    root.dataset.reduceMotion = "true";
  } else {
    delete root.dataset.reduceMotion;
  }
  
  // Apply reduce texture
  if (prefs.reduceTexture) {
    root.dataset.reduceTexture = "true";
  } else {
    delete root.dataset.reduceTexture;
  }
}

export function initReadingPrefs(): void {
  const prefs = getStoredReadingPrefs();
  applyReadingPrefs(prefs);
}
