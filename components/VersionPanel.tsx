"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ReadingPrefsPopover } from "./ReadingPrefsPopover";
import {
  getStoredReadingPrefs,
  setStoredReadingPrefs,
  applyReadingPrefs,
  DEFAULT_PREFS,
  type FontSize,
  type ReadingPrefs,
} from "@/lib/readingPrefs";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

interface VersionPanelProps {
  testimonyId: string;
  originalText: string;
  originalLanguage: string;
  editedText: string;
  translatedText: Record<string, string>;
  isFeatured?: boolean;
  isFullPage?: boolean;
}

type Tab = "original" | "edited" | "translated";

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

const TRUNCATE_LENGTH = 350;

export function VersionPanel({
  testimonyId,
  originalText,
  originalLanguage,
  editedText,
  translatedText,
  isFeatured = false,
  isFullPage = false,
}: VersionPanelProps) {
  const t = useTranslations("versionPanel");
  const locale = useLocale();

  const hasEdited = Boolean(editedText && editedText !== originalText);
  const hasTranslation =
    originalLanguage !== locale && Boolean(translatedText[locale]);

  const availableTabs: Tab[] = ["original"];
  if (hasEdited) availableTabs.push("edited");
  if (hasTranslation) availableTabs.push("translated");

  const [activeTab, setActiveTab] = useState<Tab>("original");
  const shouldReduceMotion = useShouldReduceMotion();
  
  // Use global reading preferences store
  const prefs = useSyncExternalStore(
    subscribeReadingPrefs,
    getReadingPrefsSnapshot,
    getServerSnapshot
  );
  
  const updatePrefs = (updates: Partial<typeof prefs>) => {
    const newPrefs = { ...prefs, ...updates };
    setStoredReadingPrefs(newPrefs);
    applyReadingPrefs(newPrefs);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  function renderText(text: string) {
    if (isFullPage || text.length <= TRUNCATE_LENGTH) return text;
    return text.slice(0, TRUNCATE_LENGTH).trim() + "…";
  }

  function ExpandLink({ textLength }: { textLength: number }) {
    if (isFullPage || textLength <= TRUNCATE_LENGTH) return null;
    if (String(testimonyId).startsWith("placeholder")) return null;
    return (
      <Link
        href={`/${locale}/story/${testimonyId}`}
        className="mt-4 text-[10px] font-bold tracking-widest uppercase text-foreground hover:text-primary transition-colors inline-block border-b border-foreground pb-0.5"
      >
        [ Read full story ]
      </Link>
    );
  }

  // For featured stories, use larger text; otherwise rely on global font-size via CSS
  const textClass = `story-text leading-relaxed ${
    isFeatured ? "text-xl md:text-2xl" : ""
  } first-letter:float-left first-letter:text-5xl first-letter:pr-2 first-letter:font-bold first-letter:font-display first-letter:leading-[0.8] first-line:tracking-wide`;

  const contentMap: Record<Tab, React.ReactNode> = {
    original: (
      <>
        <p lang={originalLanguage} className={textClass}>
          {renderText(originalText)}
        </p>
        <ExpandLink textLength={originalText.length} />
      </>
    ),
    edited: (
      <>
        <p lang={originalLanguage} className={textClass}>
          {renderText(editedText)}
        </p>
        <ExpandLink textLength={editedText.length} />
        <Badge
          variant="outline"
          className="mt-4 gap-1 text-[10px] uppercase tracking-widest text-muted-foreground rounded-none border-border"
        >
          <Sparkles className="h-3 w-3" />
          {t("editedBadge")}
        </Badge>
      </>
    ),
    translated: (
      <>
        <p lang={locale} className={textClass}>
          {renderText(translatedText[locale] ?? "")}
        </p>
        <ExpandLink textLength={(translatedText[locale] ?? "").length} />
        <Badge
          variant="outline"
          className="mt-4 gap-1 text-[10px] uppercase tracking-widest text-muted-foreground rounded-none border-border"
        >
          <Sparkles className="h-3 w-3" />
          {t("translatedBadge")}
        </Badge>
      </>
    ),
  };

  return (
    <div>
      {/* Tab bar */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Tab)}
      >
        <div className="flex items-center gap-2 mb-4">
          <TabsList className="relative h-auto bg-transparent p-0 gap-4">
            {availableTabs.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="relative rounded-none border-b-2 border-transparent px-0 pb-1 text-[10px] font-bold tracking-widest uppercase text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-transparent data-[state=active]:shadow-none bg-transparent transition-colors duration-200"
              >
                {t(tab)}
                {/* Sliding underline indicator */}
                {activeTab === tab && (
                  <motion.span
                    layoutId={shouldReduceMotion ? undefined : `tab-underline-${testimonyId}`}
                    className="absolute bottom-0 inset-x-0 h-[2px] bg-primary"
                    transition={shouldReduceMotion ? { duration: 0 } : {
                      type: "spring",
                      bounce: 0.15,
                      duration: 0.35,
                    }}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableTabs.length > 1 && (
            <div className="ml-auto">
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
            </div>
          )}
        </div>
      </Tabs>

      {/* Content — AnimatePresence cross-fade between tabs */}
      <div
        role="tabpanel"
        aria-label={t(activeTab)}
        tabIndex={0}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.2, delay: 0.05 } }}
            exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0 : 0.15 } }}
          >
            {contentMap[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
