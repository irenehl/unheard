export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored === "light" || stored === "dark") ? stored : "light";
  } catch {
    return "light";
  }
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
  } else {
    root.classList.remove("light");
  }
}

export function initTheme(): void {
  const theme = getStoredTheme();
  applyTheme(theme);
}
