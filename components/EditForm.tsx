"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Upload, X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateImageFile } from "@/lib/imageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

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

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];

const formVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

const shakeVariants: Variants = {
  shake: {
    x: [0, -4, 4, -4, 4, -2, 2, 0],
    transition: { duration: 0.4 },
  },
};

export function EditForm({
  testimonyId,
  locale,
  initialCategory,
  initialText,
  initialPhotoUrl,
  initialSubjectName,
  initialSubjectProfession,
  initialSubjectCountry,
  initialAuthorProfession,
  initialAuthorCountry,
  isHonor,
  isAnonymous = false,
}: {
  testimonyId: string;
  locale: string;
  initialCategory: Category;
  initialText: string;
  initialPhotoUrl?: string | null;
  initialSubjectName?: string | null;
  initialSubjectProfession?: string | null;
  initialSubjectCountry?: string | null;
  initialAuthorProfession?: string | null;
  initialAuthorCountry?: string | null;
  isHonor?: boolean;
  isAnonymous?: boolean;
}) {
  const t = useTranslations("submit");
  const tStory = useTranslations("story");
  const tCat = useTranslations("categories");
  const shouldReduceMotion = useShouldReduceMotion();
  const router = useRouter();

  const [category, setCategory] = useState<Category>(initialCategory);
  const [text, setText] = useState(initialText);
  const [subjectName, setSubjectName] = useState(initialSubjectName ?? "");
  const [subjectProfession, setSubjectProfession] = useState(
    initialSubjectProfession ?? ""
  );
  const [subjectCountry, setSubjectCountry] = useState(initialSubjectCountry ?? "");
  const [authorProfession, setAuthorProfession] = useState(
    initialAuthorProfession ?? ""
  );
  const [authorCountry, setAuthorCountry] = useState(initialAuthorCountry ?? "");
  const [photoAction, setPhotoAction] = useState<"keep" | "replace" | "remove">(
    initialPhotoUrl ? "keep" : "remove"
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(
    initialPhotoUrl ?? null
  );
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

  function clearSelectedPhoto() {
    if (photoPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setPhotoAction("remove");
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
    setPhotoAction("replace");
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("text", text);
      formData.append("photoAction", photoAction);
      if (isHonor && subjectName.trim()) {
        formData.append("subjectName", subjectName.trim());
      }
      if (isHonor && subjectProfession.trim()) {
        formData.append("subjectProfession", subjectProfession.trim());
      }
      if (isHonor && subjectCountry.trim()) {
        formData.append("subjectCountry", subjectCountry.trim());
      }
      if (!isHonor && !isAnonymous && authorProfession.trim()) {
        formData.append("authorProfession", authorProfession.trim());
      }
      if (!isHonor && !isAnonymous && authorCountry.trim()) {
        formData.append("authorCountry", authorCountry.trim());
      }
      if (photoAction === "replace" && photoFile) {
        formData.append("photo", photoFile);
      }

      const res = await fetch(`/api/submit/${testimonyId}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Update failed");
      setStatus("success");
      setTimeout(() => router.push(`/${locale}/story/${testimonyId}`), 1200);
    } catch {
      setStatus("error");
      setErrorMessage(t("errorGeneric"));
      setErrorKey((k) => k + 1);
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "success" ? (
        <motion.div
          key="success"
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-6 py-24 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: transitionDuration ?? 0.3 } }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, ease: EASE, delay: 0.1 }}
          >
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </motion.div>
          <p
            className="text-foreground"
            style={{ fontFamily: "var(--font-display), var(--font-serif), Georgia, serif", fontSize: "1.5rem", fontWeight: 300 }}
          >
            {tStory("editSuccess")}
          </p>
        </motion.div>
      ) : (
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
          {/* Category */}
          <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
            <Label
              htmlFor="category"
              className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground"
            >
              {t("categoryLabel")}
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
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
          </motion.div>

          {/* Subject name (honor type only) */}
          {isHonor && (
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

          {!isHonor && (
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

          {/* Story text */}
          <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
            <Label
              htmlFor="story-text"
              className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground flex justify-between items-end"
            >
              <span>{t("textLabel")}</span>
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

          {/* Photo */}
          <motion.div variants={shouldReduceMotion ? { hidden: {}, visible: {} } : fieldVariants} className="space-y-3">
            <Label className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
              {t("photoLabel")}
            </Label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                id="edit-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="sr-only"
              />
              <label
                htmlFor="edit-photo"
                className="flex items-center gap-3 w-full border border-border bg-transparent px-4 py-3 cursor-pointer hover:border-foreground transition-colors group"
              >
                <Upload className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" aria-hidden />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  {photoFile ? `${t("photoSelected")}: ${photoFile.name}` : t("photoReplace")}
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
                  <div className="flex gap-2">
                    {initialPhotoUrl && photoAction === "replace" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (photoPreviewUrl?.startsWith("blob:")) {
                            URL.revokeObjectURL(photoPreviewUrl);
                          }
                          setPhotoFile(null);
                          setPhotoPreviewUrl(initialPhotoUrl);
                          setPhotoAction("keep");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="rounded-none border-border text-[10px] tracking-[0.2em] uppercase"
                      >
                        {t("photoKeep")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearSelectedPhoto}
                      className="rounded-none border-border text-[10px] tracking-[0.2em] uppercase"
                    >
                      <X className="mr-1 h-3 w-3" aria-hidden />
                      {t("photoRemove")}
                    </Button>
                  </div>
                </div>
              )}

              {!photoPreviewUrl && (
                <p className="text-xs text-muted-foreground">
                  {t("photoNone")}
                </p>
              )}
            </div>
          </motion.div>

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
                      {tStory("edit")}
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
