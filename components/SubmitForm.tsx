"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2, Heart, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORIES = [
  "work",
  "family",
  "health",
  "love",
  "money",
  "education",
  "courage",
] as const;

type Category = (typeof CATEGORIES)[number];
type Type = "honor" | "tell";

const TYPE_CONFIG = {
  honor: {
    Icon: Heart,
    colorClass:
      "border-primary/40 bg-primary/5 data-[selected=true]:border-primary data-[selected=true]:bg-primary/10",
  },
  tell: {
    Icon: Mic,
    colorClass:
      "border-accent/40 bg-accent/5 data-[selected=true]:border-accent data-[selected=true]:bg-accent/10",
  },
};

export function SubmitForm() {
  const t = useTranslations("submit");
  const tCat = useTranslations("categories");

  const [type, setType] = useState<Type>("honor");
  const [category, setCategory] = useState<Category>("work");
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setStatus("submitting");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, category, text, authorName, isAnonymous }),
      });

      if (!res.ok) throw new Error("Submit failed");

      setStatus("success");
      setText("");
      setAuthorName("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-6 py-16 text-center"
      >
        <CheckCircle2 className="h-16 w-16 text-primary" />
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
            {t("successTitle")}
          </h2>
          <p className="text-muted-foreground">{t("successMessage")}</p>
        </div>
        <Button variant="outline" onClick={() => setStatus("idle")}>
          {t("submitButton")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Type selector */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          {t("typeLabel")}
        </legend>
        <RadioGroup
          value={type}
          onValueChange={(v) => setType(v as Type)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {(["honor", "tell"] as Type[]).map((option) => {
            const { Icon, colorClass } = TYPE_CONFIG[option];
            const isSelected = type === option;
            const titleKey =
              `type${option.charAt(0).toUpperCase() + option.slice(1)}` as
                | "typeHonor"
                | "typeTell";
            const descKey =
              `type${option.charAt(0).toUpperCase() + option.slice(1)}Desc` as
                | "typeHonorDesc"
                | "typeTellDesc";

            return (
              <label
                key={option}
                data-selected={isSelected}
                className={`relative flex cursor-pointer flex-col gap-1 rounded-lg border-2 p-4 transition-colors ${colorClass}`}
              >
                <RadioGroupItem
                  value={option}
                  id={`type-${option}`}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-sm">{t(titleKey)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t(descKey)}</p>
              </label>
            );
          })}
        </RadioGroup>
      </fieldset>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">{t("categoryLabel")}</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as Category)}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {tCat(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Story text */}
      <div className="space-y-2">
        <Label htmlFor="story-text">{t("textLabel")}</Label>
        <Textarea
          id="story-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("textPlaceholder")}
          required
          aria-required="true"
          className="min-h-[200px] font-serif resize-y"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        />
        <p className="text-xs text-muted-foreground text-right">
          {text.length} caracteres
        </p>
      </div>

      {/* Author name */}
      <div className="space-y-2">
        <Label htmlFor="author-name">{t("authorNameLabel")}</Label>
        <Input
          id="author-name"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder={t("authorNamePlaceholder")}
          disabled={isAnonymous}
        />
      </div>

      {/* Anonymous toggle */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(v) => setIsAnonymous(Boolean(v))}
        />
        <Label htmlFor="anonymous" className="cursor-pointer text-sm">
          {t("anonymousLabel")}
        </Label>
      </div>

      {/* AI processing notice */}
      <Alert>
        <AlertDescription className="text-xs text-muted-foreground">
          {t("processingNotice")}
        </AlertDescription>
      </Alert>

      {/* Error */}
      {status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{t("errorGeneric")}</AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={status === "submitting" || !text.trim()}
        className="w-full"
        size="lg"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("submitting")}
          </>
        ) : (
          t("submitButton")
        )}
      </Button>
    </form>
  );
}
