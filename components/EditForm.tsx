"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
}: {
  testimonyId: string;
  locale: string;
  initialCategory: Category;
  initialText: string;
}) {
  const t = useTranslations("submit");
  const tStory = useTranslations("story");
  const tCat = useTranslations("categories");
  const shouldReduceMotion = useShouldReduceMotion();
  const router = useRouter();

  const [category, setCategory] = useState<Category>(initialCategory);
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorKey, setErrorKey] = useState(0);

  const transitionDuration = shouldReduceMotion ? 0 : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("submitting");

    try {
      const res = await fetch(`/api/submit/${testimonyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, text }),
      });
      if (!res.ok) throw new Error("Update failed");
      setStatus("success");
      setTimeout(() => router.push(`/${locale}/story/${testimonyId}`), 1200);
    } catch {
      setStatus("error");
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

          <AnimatePresence>
            {status === "error" && (
              <motion.div
                key={errorKey}
                variants={shouldReduceMotion ? {} : shakeVariants}
                animate={shouldReduceMotion ? undefined : "shake"}
              >
                <Alert variant="destructive">
                  <AlertDescription>{t("errorGeneric")}</AlertDescription>
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
