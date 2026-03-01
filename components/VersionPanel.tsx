"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ReadingPrefsPopover } from "./ReadingPrefsPopover";

interface VersionPanelProps {
  originalText: string;
  originalLanguage: string;
  editedText: string;
  translatedText: Record<string, string>;
}

type Tab = "original" | "edited" | "translated";
type FontSize = "sm" | "md" | "lg";

const fontSizeClass: Record<FontSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function VersionPanel({
  originalText,
  originalLanguage,
  editedText,
  translatedText,
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
            className={`story-text leading-relaxed ${fontSizeClass[fontSize]}`}
          >
            {originalText}
          </p>
        </TabsContent>

        {hasEdited && (
          <TabsContent value="edited" className="mt-0">
            <p
              lang={originalLanguage}
              className={`story-text leading-relaxed ${fontSizeClass[fontSize]}`}
            >
              {editedText}
            </p>
            <Badge
              variant="outline"
              className="mt-3 gap-1 text-xs text-muted-foreground"
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
              className={`story-text leading-relaxed ${fontSizeClass[fontSize]}`}
            >
              {translatedText[locale]}
            </p>
            <Badge
              variant="outline"
              className="mt-3 gap-1 text-xs text-muted-foreground"
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
