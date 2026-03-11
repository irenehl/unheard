"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
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

function isSafeStoryMarkdown(markdown: string): boolean {
  const hasHtml = /<[^>]+>/.test(markdown);
  const hasCodeFence = /```/.test(markdown);
  return !hasHtml && !hasCodeFence;
}

interface VersionPanelProps {
  testimonyId: string;
  originalText: string;
  originalMarkdown?: string;
  originalLanguage: string;
  editedText: string;
  editedMarkdown?: string;
  translatedText: Record<string, string>;
  translatedMarkdown?: Record<string, string>;
  isFeatured?: boolean;
  isFullPage?: boolean;
  showExpandLink?: boolean;
  showExpandOriginal?: boolean;
  showExpandEdited?: boolean;
  showExpandTranslated?: boolean;
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

const TRUNCATE_LENGTH = 510;

export function VersionPanel({
  testimonyId,
  originalText,
  originalMarkdown,
  originalLanguage,
  editedText,
  editedMarkdown,
  translatedText,
  translatedMarkdown,
  isFeatured = false,
  isFullPage = false,
  showExpandLink = false,
  showExpandOriginal = false,
  showExpandEdited = false,
  showExpandTranslated = false,
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

  function renderText(text: string, hasMoreForTab: boolean) {
    if (isFullPage || hasMoreForTab) return text;
    if (text.length <= TRUNCATE_LENGTH) return text;
    return text.slice(0, TRUNCATE_LENGTH).trim() + "…";
  }

  function renderMarkdown(markdown: string, hasMoreForTab: boolean) {
    if (!isSafeStoryMarkdown(markdown)) return null;
    if (!isFullPage && hasMoreForTab) return null;
    return (
      <div className={`story-text story-rich ${isFeatured ? "text-xl md:text-2xl" : ""}`}>
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    );
  }

  function renderExpandLink(textLength: number, hasMoreForTab: boolean) {
    const shouldShow = hasMoreForTab || textLength > TRUNCATE_LENGTH;
    if (isFullPage) return null;
    if (String(testimonyId).startsWith("placeholder")) return null;
    if (!shouldShow) return null;
    return (
      <Link
        href={`/${locale}/story/${testimonyId}`}
        className="mt-4 text-[0.625rem] font-bold tracking-widest uppercase text-foreground hover:text-primary transition-colors inline-block border-b border-foreground pb-0.5"
      >
        [ {t("readFullStory")} ]
      </Link>
    );
  }

  // For featured stories, use larger text; otherwise rely on global font-size via CSS
  const textClass = `story-text leading-relaxed ${
    isFeatured ? "text-xl md:text-2xl" : ""
  } first-letter:float-left first-letter:text-5xl first-letter:pr-2 first-letter:font-bold first-letter:font-display first-letter:leading-[0.8] first-line:tracking-wide`;

  // Render content conditionally based on activeTab to avoid evaluating all tabs
  function renderTabContent() {
    const translated = translatedText[locale] ?? "";
    const hasMoreByTab: Record<Tab, boolean> = {
      original: showExpandOriginal,
      edited: showExpandEdited,
      translated: showExpandTranslated,
    };


    if (activeTab === "original") {
      const originalMarkdownView =
        originalMarkdown && originalMarkdown.trim().length > 0
          ? renderMarkdown(originalMarkdown, showExpandOriginal)
          : null;
      return (
        <>
          {originalMarkdownView ?? (
            <p lang={originalLanguage} className={textClass}>
              {renderText(originalText, showExpandOriginal)}
            </p>
          )}
          {renderExpandLink(originalText.length, showExpandOriginal)}
        </>
      );
    }
    
    if (activeTab === "edited") {
      const editedMarkdownView =
        editedMarkdown && editedMarkdown.trim().length > 0
          ? renderMarkdown(editedMarkdown, showExpandEdited)
          : null;
      return (
        <>
          {editedMarkdownView ?? (
            <p lang={originalLanguage} className={textClass}>
              {renderText(editedText, showExpandEdited)}
            </p>
          )}
          {renderExpandLink(editedText.length, showExpandEdited)}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, delay: 0.25 }}
          >
            <Badge
              variant="outline"
              className="mt-4 gap-1 text-[0.625rem] uppercase tracking-widest text-muted-foreground rounded-none border-border"
            >
              <Sparkles className="h-3 w-3" />
              {t("editedBadge")}
            </Badge>
          </motion.div>
        </>
      );
    }
    
    // activeTab === "translated"
    const translatedMarkdownForLocale = translatedMarkdown?.[locale];
    const translatedMarkdownView =
      translatedMarkdownForLocale && translatedMarkdownForLocale.trim().length > 0
        ? renderMarkdown(translatedMarkdownForLocale, showExpandTranslated)
        : null;
    return (
      <>
        {translatedMarkdownView ?? (
          <p lang={locale} className={textClass}>
            {renderText(translated, showExpandTranslated)}
          </p>
        )}
        {renderExpandLink(translated.length, showExpandTranslated)}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, delay: 0.25 }}
        >
          <Badge
            variant="outline"
            className="mt-4 gap-1 text-[0.625rem] uppercase tracking-widest text-muted-foreground rounded-none border-border"
          >
            <Sparkles className="h-3 w-3" />
            {t("translatedBadge")}
          </Badge>
        </motion.div>
      </>
    );
  }

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
                className="relative rounded-none border-b-2 border-transparent px-0 pb-1 text-[0.625rem] font-bold tracking-widest uppercase text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-transparent data-[state=active]:shadow-none bg-transparent transition-colors duration-200"
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
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
