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
        className="flex flex-col items-center gap-8 py-24 text-center"
      >
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <div>
          <h2
            className="text-foreground mb-3 leading-tight"
            style={{
              fontFamily:
                "var(--font-display), var(--font-serif), Georgia, serif",
              fontSize: "1.75rem",
              fontWeight: 300,
              letterSpacing: "-0.015em",
            }}
          >
            {t("successTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("successMessage")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setStatus("idle")}
          className="font-mono text-[0.65rem] tracking-[0.2em] uppercase rounded-none border-border hover:bg-accent h-12 px-8 transition-colors"
        >
          {t("submitButton")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-12">
      <fieldset className="space-y-4">
        <legend className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground mb-4 block">
          {t("typeLabel")}
        </legend>
        <RadioGroup
          value={type}
          onValueChange={(v) => setType(v as Type)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {(["honor", "tell"] as Type[]).map((option) => {
            const isSelected = type === option;
            const Icon = option === "honor" ? Heart : Mic;
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
                className={`relative flex cursor-pointer flex-col gap-3 border p-6 transition-all duration-300 ${
                  isSelected
                    ? "border-foreground bg-foreground text-background shadow-lg scale-[1.02]"
                    : "border-border bg-transparent hover:border-foreground/50 hover:bg-accent/50"
                }`}
              >
                <RadioGroupItem
                  value={option}
                  id={`type-${option}`}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isSelected ? "text-background" : "text-muted-foreground"
                    }`}
                    aria-hidden
                  />
                  <span
                    className={`text-sm font-bold tracking-widest uppercase transition-colors ${
                      isSelected ? "text-background" : "text-foreground"
                    }`}
                  >
                    {t(titleKey)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed pl-7 transition-colors ${
                  isSelected ? "text-background/80" : "text-muted-foreground"
                }`}>
                  {t(descKey)}
                </p>
              </label>
            );
          })}
        </RadioGroup>
      </fieldset>

      <div className="space-y-3">
        <Label
          htmlFor="category"
          className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground"
        >
          {t("categoryLabel")}
        </Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as Category)}
        >
          <SelectTrigger 
            id="category" 
            className="h-14 border border-border bg-transparent rounded-none px-4 py-4 text-base shadow-none focus:ring-1 focus:ring-foreground focus:border-foreground transition-colors"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="rounded-none py-3 cursor-pointer focus:bg-accent">
                {tCat(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label
          htmlFor="story-text"
          className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground flex justify-between items-end"
        >
          <span>{t("textLabel")}</span>
          <span className="text-[0.6rem] tracking-wider tabular-nums opacity-60">
            {text.length} {t("charCount")}
          </span>
        </Label>
        <Textarea
          id="story-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("textPlaceholder")}
          required
          aria-required="true"
          className="min-h-[280px] resize-y leading-relaxed border border-border bg-transparent rounded-none p-5 text-lg shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground transition-colors"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        />
      </div>

      <div className="space-y-3">
        <Label
          htmlFor="author-name"
          className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground"
        >
          {t("authorNameLabel")}
        </Label>
        <Input
          id="author-name"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder={t("authorNamePlaceholder")}
          disabled={isAnonymous}
          className="h-14 border border-border bg-transparent rounded-none px-4 py-4 text-base shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-center gap-4 p-4 border border-border bg-accent/30">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(v) => setIsAnonymous(Boolean(v))}
          className="h-5 w-5 rounded-none border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
        />
        <Label htmlFor="anonymous" className="cursor-pointer text-sm font-medium tracking-wide">
          {t("anonymousLabel")}
        </Label>
      </div>

      <div className="border-l-2 border-foreground/20 pl-5 py-2">
        <p className="font-mono text-[0.65rem] tracking-widest uppercase text-muted-foreground/80 leading-relaxed">
          {t("processingNotice")}
        </p>
      </div>

      {status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{t("errorGeneric")}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={status === "submitting" || !text.trim()}
        className="w-full font-bold text-sm tracking-widest uppercase bg-foreground text-background hover:bg-foreground/90 rounded-none h-16 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100 disabled:opacity-50"
        size="lg"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            {t("submitting")}
          </>
        ) : (
          t("submitButton")
        )}
      </Button>
    </form>
  );
}
