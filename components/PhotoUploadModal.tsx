"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X, Upload } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useShouldReduceMotion } from "@/lib/motionPrefs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateImageFile } from "@/lib/imageUpload";

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE, delay: i * 0.08 },
  }),
};

const shakeVariants = {
  shake: {
    x: [0, -4, 4, -4, 4, -2, 2, 0],
    transition: { duration: 0.4 },
  },
};

export function PhotoUploadModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("gallery");
  const shouldReduceMotion = useShouldReduceMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [country, setCountry] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  const transitionDuration = shouldReduceMotion ? 0 : undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const fileError = validateImageFile(f);
    if (fileError === "size") {
      setErrorMsg(t("errorSize"));
      setErrorKey((k) => k + 1);
      return;
    }
    if (fileError === "type") {
      setErrorMsg(t("errorFormat"));
      setErrorKey((k) => k + 1);
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setErrorMsg("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file || !name.trim() || !profession.trim() || !country.trim()) {
      setErrorMsg(t("errorMissing"));
      setErrorKey((k) => k + 1);
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name.trim());
      formData.append("profession", profession.trim());
      formData.append("country", country.trim());

      const res = await fetch("/api/profiles", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error && err.message !== "Upload failed" ? err.message : t("errorGeneric"));
      setErrorKey((k) => k + 1);
      setStatus("error");
    }
  }

  if (!mounted) return null;

  // Backdrop + dialog — close on backdrop click
  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-80 bg-foreground/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.2 } }}
        exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0 : 0.15 } }}
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        key="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="fixed inset-0 z-90"
        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: shouldReduceMotion ? 0 : 0.25, ease: EASE } }}
        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 12, transition: { duration: shouldReduceMotion ? 0 : 0.18 } }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-dvh w-full overflow-y-auto bg-background">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border">
            <div>
              <h2
                id="upload-modal-title"
                className="text-foreground leading-tight"
                style={{ fontFamily: "var(--font-display), var(--font-serif), Georgia, serif", fontSize: "1.5rem", fontWeight: 300 }}
              >
                {t("uploadTitle")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground tracking-wide">{t("uploadIntro")}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="ml-4 shrink-0 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {status === "success" ? (
              /* Success */
              <motion.div
                className="py-12 text-center space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: transitionDuration ?? 0.3 } }}
              >
                <p
                  className="text-foreground"
                  style={{ fontFamily: "var(--font-display), var(--font-serif), Georgia, serif", fontSize: "1.25rem", fontWeight: 300 }}
                >
                  {t("successTitle")}
                </p>
                <p className="text-sm text-muted-foreground">{t("successMessage")}</p>
                <Button onClick={onClose} variant="outline" className="mt-4 rounded-none border-foreground text-xs font-bold tracking-widest uppercase h-10 px-8">
                  ←
                </Button>
              </motion.div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* File input */}
                <motion.div
                  custom={0}
                  variants={shouldReduceMotion ? {} : fieldVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  <Label className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
                    {t("fieldFile")}
                  </Label>
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="sr-only"
                      id="photo-file"
                      aria-describedby="file-hint"
                    />
                    <label
                      htmlFor="photo-file"
                      className="flex items-center gap-3 w-full border border-border bg-transparent px-4 py-3 cursor-pointer hover:border-foreground transition-colors group focus-within:ring-1 focus-within:ring-foreground"
                    >
                      <Upload className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" aria-hidden />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                        {file ? `${t("fieldFileSelected")}: ${file.name}` : t("fieldFileCta")}
                      </span>
                    </label>
                    <p id="file-hint" className="mt-1 text-[0.625rem] tracking-widest uppercase text-muted-foreground">
                      {t("fieldFileHint")}
                    </p>
                  </div>

                  {/* Photo preview */}
                  <AnimatePresence>
                    {previewUrl && (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1, transition: { duration: transitionDuration ?? 0.25, ease: "easeOut" } }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        className="relative aspect-square w-full max-w-[200px] overflow-hidden border border-border"
                      >
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-cover grayscale"
                          sizes="200px"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Name */}
                <motion.div custom={1} variants={shouldReduceMotion ? {} : fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                  <Label htmlFor="photo-name" className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
                    {t("fieldName")}
                  </Label>
                  <Input
                    id="photo-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("fieldNamePlaceholder")}
                    required
                    className="h-12 border border-border bg-transparent rounded-none px-4 shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground"
                  />
                </motion.div>

                {/* Profession */}
                <motion.div custom={2} variants={shouldReduceMotion ? {} : fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                  <Label htmlFor="photo-profession" className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
                    {t("fieldProfession")}
                  </Label>
                  <Input
                    id="photo-profession"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder={t("fieldProfessionPlaceholder")}
                    required
                    className="h-12 border border-border bg-transparent rounded-none px-4 shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground"
                  />
                </motion.div>

                {/* Country */}
                <motion.div custom={3} variants={shouldReduceMotion ? {} : fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                  <Label htmlFor="photo-country" className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
                    {t("fieldCountry")}
                  </Label>
                  <Input
                    id="photo-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={t("fieldCountryPlaceholder")}
                    required
                    className="h-12 border border-border bg-transparent rounded-none px-4 shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground"
                  />
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {(status === "error" || errorMsg) && errorMsg && (
                    <motion.p
                      key={errorKey}
                      variants={shouldReduceMotion ? {} : shakeVariants}
                      animate={shouldReduceMotion ? undefined : "shake"}
                      className="text-destructive text-sm"
                      role="alert"
                    >
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.div
                  custom={4}
                  variants={shouldReduceMotion ? {} : fieldVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.97, transition: { duration: 0.1 } }}>
                    <Button
                      type="submit"
                      disabled={status === "submitting"}
                      className="w-full font-bold text-xs tracking-widest uppercase bg-foreground text-background hover:bg-foreground/90 rounded-none h-14 transition-colors disabled:opacity-50"
                    >
                      {status === "submitting" ? t("submitting") : t("submit")}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
