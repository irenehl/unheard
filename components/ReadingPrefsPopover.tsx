"use client";

import { useState, useCallback } from "react";
import { Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";

type FontSize = "sm" | "md" | "lg";

interface ReadingPrefsPopoverProps {
  onFontSize: (size: FontSize) => void;
  onHighContrast: (on: boolean) => void;
  fontSize: FontSize;
  highContrast: boolean;
}

export function ReadingPrefsPopover({
  onFontSize,
  onHighContrast,
  fontSize,
  highContrast,
}: ReadingPrefsPopoverProps) {
  const t = useTranslations("readingPrefs");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={t("label")}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded p-1"
        >
          <Settings className="h-3.5 w-3.5" />
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
      </PopoverContent>
    </Popover>
  );
}
