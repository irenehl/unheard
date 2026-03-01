"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ReadingPrefsPopover } from "./ReadingPrefsPopover";

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
type FontSize = "sm" | "md" | "lg";

const fontSizeClass: Record<FontSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

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

  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [highContrast, setHighContrast] = useState(false);

  const TRUNCATE_LENGTH = 350;

  const renderText = (text: string) => {
    if (isFullPage || text.length <= TRUNCATE_LENGTH) {
      return text;
    }
    return text.slice(0, TRUNCATE_LENGTH).trim() + "...";
  };

  const ExpandButton = ({ textLength }: { textLength: number }) => {
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
  };

  return (
    <div
      data-font-size={fontSize}
      data-high-contrast={highContrast}
    >
      <Tabs defaultValue="original">
        <div className="flex items-center gap-2 mb-3">
          <TabsList className="h-auto bg-transparent p-0 gap-3">
            {availableTabs.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent px-0 pb-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
              >
                {t(tab)}
              </TabsTrigger>
            ))}
          </TabsList>
          <ReadingPrefsPopover
            fontSize={fontSize}
            highContrast={highContrast}
            onFontSize={setFontSize}
            onHighContrast={setHighContrast}
          />
        </div>

        <TabsContent value="original" className="mt-0">
          <p
            lang={originalLanguage}
            className={`story-text leading-relaxed ${isFeatured ? 'text-xl md:text-2xl' : fontSizeClass[fontSize]} first-letter:float-left first-letter:text-5xl first-letter:pr-2 first-letter:font-bold first-letter:font-display first-letter:leading-[0.8] first-line:tracking-wide`}
          >
            {renderText(originalText)}
          </p>
          <ExpandButton textLength={originalText.length} />
        </TabsContent>

        {hasEdited && (
          <TabsContent value="edited" className="mt-0">
            <p
              lang={originalLanguage}
              className={`story-text leading-relaxed ${isFeatured ? 'text-xl md:text-2xl' : fontSizeClass[fontSize]} first-letter:float-left first-letter:text-5xl first-letter:pr-2 first-letter:font-bold first-letter:font-display first-letter:leading-[0.8] first-line:tracking-wide`}
            >
              {renderText(editedText)}
            </p>
            <ExpandButton textLength={editedText.length} />
            <Badge
              variant="outline"
              className="mt-4 gap-1 text-[10px] uppercase tracking-widest text-muted-foreground rounded-none border-border"
            >
              <Sparkles className="h-3 w-3" />
              {t("editedBadge")}
            </Badge>
          </TabsContent>
        )}

        {hasTranslation && (
          <TabsContent value="translated" className="mt-0">
            <p
              lang={locale}
              className={`story-text leading-relaxed ${isFeatured ? 'text-xl md:text-2xl' : fontSizeClass[fontSize]} first-letter:float-left first-letter:text-5xl first-letter:pr-2 first-letter:font-bold first-letter:font-display first-letter:leading-[0.8] first-line:tracking-wide`}
            >
              {renderText(translatedText[locale])}
            </p>
            <ExpandButton textLength={translatedText[locale].length} />
            <Badge
              variant="outline"
              className="mt-4 gap-1 text-[10px] uppercase tracking-widest text-muted-foreground rounded-none border-border"
            >
              <Sparkles className="h-3 w-3" />
              {t("translatedBadge")}
            </Badge>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
