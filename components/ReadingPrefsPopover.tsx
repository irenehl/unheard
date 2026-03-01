"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
import type { FontSize, ReadingPrefs } from "@/lib/readingPrefs";

interface ReadingPrefsPopoverProps {
  onFontSize: (size: FontSize) => void;
  onHighContrast: (on: boolean) => void;
  onReduceMotion: (on: boolean) => void;
  onReduceTexture: (on: boolean) => void;
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
  reduceTexture: boolean;
}

export function ReadingPrefsPopover({
  onFontSize,
  onHighContrast,
  onReduceMotion,
  onReduceTexture,
  fontSize,
  highContrast,
  reduceMotion,
  reduceTexture,
}: ReadingPrefsPopoverProps) {
  const t = useTranslations("readingPrefs");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a placeholder button during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        aria-label={t("label")}
        className="flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Settings className="h-4 w-4" aria-hidden />
        <span className="sr-only">{t("label")}</span>
      </button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={t("label")}
          className="flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Settings className="h-4 w-4" aria-hidden />
          <span className="sr-only">{t("label")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-4" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          {t("label")}
        </p>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">{t("fontSize")}</p>
          <div className="flex gap-1">
            {(["sm", "md", "lg"] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => onFontSize(size)}
                className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                  fontSize === size
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {size === "sm"
                  ? t("fontSmall")
                  : size === "md"
                  ? t("fontMedium")
                  : t("fontLarge")}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={(v) => onHighContrast(Boolean(v))}
            />
            <Label htmlFor="high-contrast" className="text-xs cursor-pointer">
              {t("highContrast")}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="reduce-motion"
              checked={reduceMotion}
              onCheckedChange={(v) => onReduceMotion(Boolean(v))}
            />
            <Label htmlFor="reduce-motion" className="text-xs cursor-pointer">
              {t("reduceMotion")}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="reduce-texture"
              checked={reduceTexture}
              onCheckedChange={(v) => onReduceTexture(Boolean(v))}
            />
            <Label htmlFor="reduce-texture" className="text-xs cursor-pointer">
              {t("reduceTexture")}
            </Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
