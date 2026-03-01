"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { getStoredTheme, setStoredTheme, applyTheme, type Theme } from "@/lib/theme";

function subscribeTheme(callback: () => void) {
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }
  return () => {};
}

function getThemeSnapshot(): Theme {
  return getStoredTheme();
}

export function ThemeToggle() {
  const t = useTranslations("common");
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => "dark");

  const toggleTheme = () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setStoredTheme(newTheme);
    applyTheme(newTheme);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("toggleTheme")}
      aria-pressed={isLight}
      className="flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {isLight ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
