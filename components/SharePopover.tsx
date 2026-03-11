"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];

export function SharePopover({
  storyUrl,
  originalText,
  storyTitle,
}: {
  testimonyId?: string;
  originalText: string;
  locale?: string;
  storyUrl: string;
  storyTitle?: string;
}) {
  const t = useTranslations("share");
  const shouldReduceMotion = useShouldReduceMotion();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [alignRight, setAlignRight] = useState(false);
  const resolvedStoryUrl = useMemo(() => {
    if (typeof window === "undefined") return storyUrl;
    try {
      const parsed = new URL(storyUrl);
      const isLocalHost =
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname.endsWith(".local");
      const isPlaceholderHost = parsed.hostname === "example.com";
      const shouldUseRuntimeOrigin =
        isLocalHost || isPlaceholderHost || parsed.protocol !== "https:";
      if (!shouldUseRuntimeOrigin) return parsed.toString();
      const runtimeUrl = new URL(
        `${parsed.pathname}${parsed.search}${parsed.hash}`,
        window.location.origin
      );
      return runtimeUrl.toString();
    } catch {
      try {
        return new URL(storyUrl, window.location.origin).toString();
      } catch {
        return storyUrl;
      }
    }
  }, [storyUrl]);

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

  useEffect(() => {
    if (!open) return;

    function syncPopoverAlignment() {
      const panel = panelRef.current;
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      const overflowRight = rect.right > window.innerWidth - 8;
      const overflowLeft = rect.left < 8;
      if (overflowRight && !overflowLeft) {
        setAlignRight(true);
        return;
      }
      if (overflowLeft && !overflowRight) {
        setAlignRight(false);
        return;
      }
      if (overflowLeft && overflowRight) {
        setAlignRight(window.innerWidth - rect.right < rect.left);
      }
    }

    syncPopoverAlignment();
    window.addEventListener("resize", syncPopoverAlignment);
    return () => window.removeEventListener("resize", syncPopoverAlignment);
  }, [open]);

  const excerpt = originalText
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
  const tweetText = t("tweetTemplate", { excerpt, url: resolvedStoryUrl });
  const previewTitle = storyTitle || excerpt;
  const domain = (() => {
    try {
      return new URL(resolvedStoryUrl).hostname.replace(/^www\./, "");
    } catch {
      return "ellas";
    }
  })();
  function handleX() {
    window.open(
      "https://x.com/intent/tweet?text=" + encodeURIComponent(tweetText),
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(resolvedStoryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
    }
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
            ref={panelRef}
            className={`absolute bottom-full mb-2 z-20 w-[min(300px,calc(100vw-1rem))] bg-background border border-border shadow-lg ${
              alignRight ? "right-0" : "left-0"
            }`}
            role="dialog"
            aria-label={t("button")}
          >
            <div className="px-4 pt-3 pb-2 border-b border-border">
              <p className="text-[0.55rem] font-bold tracking-widest uppercase text-muted-foreground">
                {t("previewLabel")}
              </p>
              <p className="mt-1 text-sm leading-tight text-foreground line-clamp-2">
                {previewTitle}
              </p>
              <p className="mt-1 text-[0.625rem] tracking-wide text-muted-foreground line-clamp-2">
                {excerpt}
              </p>
              <p className="mt-2 text-[0.55rem] font-bold tracking-widest uppercase text-muted-foreground">
                {domain}
              </p>
            </div>

            <div className="flex flex-col py-1">
              <button
                onClick={handleX}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[0.625rem] font-bold tracking-widest uppercase text-foreground hover:bg-secondary transition-colors text-left"
              >
                <XIcon className="h-3 w-3 shrink-0" />
                {t("x")}
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
