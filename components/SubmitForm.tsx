"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2, Heart, Mic, Upload, X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useShouldReduceMotion } from "@/lib/motionPrefs";
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
import { validateImageFile } from "@/lib/imageUpload";

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

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];

/** Stagger container: children animate in sequentially on mount */
const formVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

/** Horizontal shake for error feedback */
const shakeVariants: Variants = {
  shake: {
    x: [0, -4, 4, -4, 4, -2, 2, 0],
    transition: { duration: 0.4 },
  },
};

export function SubmitForm() {
  const t = useTranslations("submit");
  const tCat = useTranslations("categories");
  const shouldReduceMotion = useShouldReduceMotion();

  const [type, setType] = useState<Type>("honor");
  const [category, setCategory] = useState<Category>("work");
  const [text, setText] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectProfession, setSubjectProfession] = useState("");
  const [subjectCountry, setSubjectCountry] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorProfession, setAuthorProfession] = useState("");
  const [authorCountry, setAuthorCountry] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const transitionDuration = shouldReduceMotion ? 0 : undefined;

  useEffect(() => {
    return () => {
      if (photoPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  function clearPhoto() {
    if (photoPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const fileError = validateImageFile(selected);
    if (fileError === "size") {
      setErrorMessage(t("errorPhotoSize"));
      setStatus("error");
      setErrorKey((k) => k + 1);
      return;
    }
    if (fileError === "type") {
      setErrorMessage(t("errorPhotoFormat"));
      setStatus("error");
      setErrorKey((k) => k + 1);
      return;
    }

    if (photoPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setPhotoFile(selected);
    setPhotoPreviewUrl(URL.createObjectURL(selected));
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("category", category);
      formData.append("text", text);
      formData.append("authorName", authorName);
      formData.append("isAnonymous", String(isAnonymous));
      if (type === "honor" && subjectName.trim()) {
        formData.append("subjectName", subjectName.trim());
      }
      if (type === "honor" && subjectProfession.trim()) {
        formData.append("subjectProfession", subjectProfession.trim());
      }
      if (type === "honor" && subjectCountry.trim()) {
        formData.append("subjectCountry", subjectCountry.trim());
      }
      if (type === "tell" && !isAnonymous && authorProfession.trim()) {
        formData.append("authorProfession", authorProfession.trim());
      }
      if (type === "tell" && !isAnonymous && authorCountry.trim()) {
        formData.append("authorCountry", authorCountry.trim());
      }
      if (photoFile) formData.append("photo", photoFile);

      const res = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Submit failed");
      setStatus("success");
      setText("");
      setSubjectName("");
      setSubjectProfession("");
      setSubjectCountry("");
      setAuthorName("");
      setAuthorProfession("");
      setAuthorCountry("");
      clearPhoto();
    } catch {
      setStatus("error");
      setErrorMessage(t("errorGeneric"));
      setErrorKey((k) => k + 1); // re-trigger shake animation
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "success" ? (
        /* ── Success state ── */
        <motion.div
          key="success"
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-8 py-24 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: transitionDuration ?? 0.3 } }}
          exit={{ opacity: 0, transition: { duration: transitionDuration ?? 0.2 } }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.25, 0, 0, 1], delay: 0.1 }}
          >
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </motion.div>

          <div>
            <h2
              className="text-foreground mb-3 leading-tight"
              style={{
                fontFamily: "var(--font-display), var(--font-serif), Georgia, serif",
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
        </motion.div>
      ) : (
        /* ── Form ── */
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          noValidate
          className="space-y-12"
          variants={shouldReduceMotion ? { hidden: {}, visible: {} } : formVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: transitionDuration ?? 0.15 } }}
        >
          {/* Type selector */}
          <motion.fieldset variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-4">
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
                    <p
                      className={`text-sm leading-relaxed pl-7 transition-colors ${
                        isSelected ? "text-background/80" : "text-muted-foreground"
                      }`}
                    >
                      {t(descKey)}
                    </p>
                  </label>
                );
              })}
            </RadioGroup>
          </motion.fieldset>

          {/* Category */}
          <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
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
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="rounded-none py-3 cursor-pointer focus:bg-accent"
                  >
                    {tCat(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Story text */}
          <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
            <Label
              htmlFor="story-text"
              className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground flex justify-between items-end"
            >
              <span>{t("textLabel")}</span>
              {/* Character counter — subtle opacity pulse on change */}
              <motion.span
                key={text.length}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="text-[0.6rem] tracking-wider tabular-nums opacity-60"
              >
                {text.length} {t("charCount")}
              </motion.span>
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
          </motion.div>

          {/* Author name */}
          <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
            <Label className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
              {t("photoLabel")}
            </Label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                id="submit-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="sr-only"
              />
              <label
                htmlFor="submit-photo"
                className="flex items-center gap-3 w-full border border-border bg-transparent px-4 py-3 cursor-pointer hover:border-foreground transition-colors group"
              >
                <Upload className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" aria-hidden />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  {photoFile ? `${t("photoSelected")}: ${photoFile.name}` : t("photoSelect")}
                </span>
              </label>
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                {t("photoHint")}
              </p>

              {photoPreviewUrl && (
                <div className="space-y-3">
                  <div className="relative aspect-square w-full max-w-[220px] overflow-hidden border border-border">
                    <Image
                      src={photoPreviewUrl}
                      alt={t("photoPreviewAlt")}
                      fill
                      className="object-cover grayscale"
                      sizes="220px"
                      unoptimized
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearPhoto}
                    className="rounded-none border-border text-[10px] tracking-[0.2em] uppercase"
                  >
                    <X className="mr-1 h-3 w-3" aria-hidden />
                    {t("photoRemove")}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Subject name (honor type only) */}
          {type === "honor" && (
            <>
              <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
                <Label
                  htmlFor="subject-name"
                  className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground"
                >
                  {t("subjectNameLabel")}
                </Label>
                <Input
                  id="subject-name"
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder={t("subjectNamePlaceholder")}
                  className="h-14 border border-border bg-transparent rounded-none px-4 py-4 text-base shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground transition-colors"
                />
              </motion.div>
              <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
                <Label
                  htmlFor="subject-profession"
                  className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground"
                >
                  {t("subjectProfessionLabel")}
                </Label>
                <Input
                  id="subject-profession"
                  type="text"
                  value={subjectProfession}
                  onChange={(e) => setSubjectProfession(e.target.value)}
                  placeholder={t("subjectProfessionPlaceholder")}
                  className="h-14 border border-border bg-transparent rounded-none px-4 py-4 text-base shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground transition-colors"
                />
              </motion.div>
              <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
                <Label
                  htmlFor="subject-country"
                  className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground"
                >
                  {t("subjectCountryLabel")}
                </Label>
                <Input
                  id="subject-country"
                  type="text"
                  value={subjectCountry}
                  onChange={(e) => setSubjectCountry(e.target.value)}
                  placeholder={t("subjectCountryPlaceholder")}
                  className="h-14 border border-border bg-transparent rounded-none px-4 py-4 text-base shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground transition-colors"
                />
              </motion.div>
            </>
          )}

          {/* Author name */}
          <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
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
          </motion.div>

          {type === "tell" && (
            <>
              <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
                <Label
                  htmlFor="author-profession"
                  className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground"
                >
                  {t("authorProfessionLabel")}
                </Label>
                <Input
                  id="author-profession"
                  type="text"
                  value={authorProfession}
                  onChange={(e) => setAuthorProfession(e.target.value)}
                  placeholder={t("authorProfessionPlaceholder")}
                  disabled={isAnonymous}
                  className="h-14 border border-border bg-transparent rounded-none px-4 py-4 text-base shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </motion.div>
              <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
                <Label
                  htmlFor="author-country"
                  className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground"
                >
                  {t("authorCountryLabel")}
                </Label>
                <Input
                  id="author-country"
                  type="text"
                  value={authorCountry}
                  onChange={(e) => setAuthorCountry(e.target.value)}
                  placeholder={t("authorCountryPlaceholder")}
                  disabled={isAnonymous}
                  className="h-14 border border-border bg-transparent rounded-none px-4 py-4 text-base shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </motion.div>
            </>
          )}

          {/* Anonymous toggle */}
          <motion.div
            variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants}
            className="flex items-center gap-4 p-4 border border-border bg-accent/30"
          >
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(v) => {
                const nextValue = Boolean(v);
                setIsAnonymous(nextValue);
                if (nextValue) {
                  setAuthorProfession("");
                  setAuthorCountry("");
                }
              }}
              className="h-5 w-5 rounded-none border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
            />
            <Label
              htmlFor="anonymous"
              className="cursor-pointer text-sm font-medium tracking-wide"
            >
              {t("anonymousLabel")}
            </Label>
          </motion.div>

          {/* AI notice */}
          <motion.div
            variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants}
            className="border-l-2 border-foreground/20 pl-5 py-2"
          >
            <p className="font-mono text-[0.65rem] tracking-widest uppercase text-muted-foreground/80 leading-relaxed">
              {t("processingNotice")}
            </p>
          </motion.div>

          {/* Error alert — shakes each time an error fires */}
          <AnimatePresence>
            {status === "error" && (
              <motion.div
                key={errorKey}
                variants={shouldReduceMotion ? {} : shakeVariants}
                animate={shouldReduceMotion ? undefined : "shake"}
              >
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage ?? t("errorGeneric")}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.div variants={fieldVariants}>
            <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.97, transition: { duration: 0.1 } }}>
              <Button
                type="submit"
                disabled={status === "submitting" || !text.trim()}
                className="w-full font-bold text-sm tracking-widest uppercase bg-foreground text-background hover:bg-foreground/90 rounded-none h-16 transition-colors duration-200 disabled:opacity-50"
                size="lg"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {status === "submitting" ? (
                    <motion.span
                      key="loading"
                      className="flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: transitionDuration ?? 0.15 } }}
                      exit={{ opacity: 0, transition: { duration: transitionDuration ?? 0.1 } }}
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      {t("submitting")}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: transitionDuration ?? 0.15 } }}
                      exit={{ opacity: 0, transition: { duration: transitionDuration ?? 0.1 } }}
                    >
                      {t("submitButton")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
