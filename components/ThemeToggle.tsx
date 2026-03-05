"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { getStoredTheme, setStoredTheme, applyTheme, type Theme } from "@/lib/theme";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

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
  const shouldReduceMotion = useShouldReduceMotion();
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => "light");

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
    <motion.button
      type="button"
      onClick={toggleTheme}
      aria-label={t("toggleTheme")}
      aria-pressed={isLight}
      className="flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      whileTap={shouldReduceMotion ? undefined : { scale: 0.85 }}
      transition={{ duration: 0.1 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLight ? (
          <motion.span
            key="sun"
            initial={shouldReduceMotion ? {} : { opacity: 0, rotate: -20 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, rotate: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex"
            aria-hidden
          >
            <Sun className="h-4 w-4" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={shouldReduceMotion ? {} : { opacity: 0, rotate: 20 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, rotate: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex"
            aria-hidden
          >
            <Moon className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
