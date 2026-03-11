"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Share2, Twitter, Linkedin, Link as LinkIcon, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];

export function SharePopover({
  storyUrl,
  originalText,
}: {
  testimonyId: string;
  originalText: string;
  locale: string;
  storyUrl: string;
}) {
  const t = useTranslations("share");
  const shouldReduceMotion = useShouldReduceMotion();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const excerpt = originalText.slice(0, 100);
  const tweetText = t("tweetTemplate", { excerpt, url: storyUrl });

  function handleX() {
    window.open(
      "https://x.com/intent/tweet?text=" + encodeURIComponent(tweetText),
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  }

  function handleLinkedIn() {
    window.open(
      "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(storyUrl),
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(storyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const popoverVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        initial: { opacity: 0, scale: 0.95, y: 4 },
        animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: EASE } },
        exit: { opacity: 0, scale: 0.95, y: 4, transition: { duration: 0.15 } },
      };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("button")}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[0.625rem] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
      >
        <Share2 className="h-3 w-3" aria-hidden />
        {t("button")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="popover"
            {...popoverVariants}
            className="absolute bottom-full left-0 mb-2 z-20 bg-background border border-border shadow-lg min-w-[180px]"
            role="dialog"
            aria-label={t("button")}
          >
            <div className="flex flex-col py-1">
              <button
                onClick={handleX}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[0.625rem] font-bold tracking-widest uppercase text-foreground hover:bg-secondary transition-colors text-left"
              >
                <Twitter className="h-3 w-3 shrink-0" aria-hidden />
                {t("x")}
              </button>
              <button
                onClick={handleLinkedIn}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[0.625rem] font-bold tracking-widest uppercase text-foreground hover:bg-secondary transition-colors text-left"
              >
                <Linkedin className="h-3 w-3 shrink-0" aria-hidden />
                {t("linkedin")}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[0.625rem] font-bold tracking-widest uppercase text-foreground hover:bg-secondary transition-colors text-left"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="copied"
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Check className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                      {t("copied")}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <LinkIcon className="h-3 w-3 shrink-0" aria-hidden />
                      {t("copyLink")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
