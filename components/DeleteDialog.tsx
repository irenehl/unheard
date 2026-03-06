"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];

export function DeleteDialog({
  open,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("story");
  const shouldReduceMotion = useShouldReduceMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-40 bg-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5, transition: { duration: shouldReduceMotion ? 0 : 0.25 } }}
            exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0 : 0.18 } }}
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            key="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: shouldReduceMotion ? 0 : 0.25, ease: EASE } }}
            exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 8, transition: { duration: shouldReduceMotion ? 0 : 0.18 } }}
          >
            <div className="bg-background border border-border p-8 max-w-sm w-full shadow-2xl">
              <h2
                id="delete-dialog-title"
                className="text-foreground font-bold tracking-tight mb-3"
                style={{ fontFamily: "var(--font-display), var(--font-serif), Georgia, serif", fontSize: "1.25rem" }}
              >
                {t("deleteConfirmTitle")}
              </h2>
              <p id="delete-dialog-desc" className="text-muted-foreground text-sm mb-8">
                {t("deleteConfirmDesc")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={isPending}
                  className="flex-1 border border-foreground px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase text-foreground hover:bg-secondary transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                >
                  {t("deleteCancel")}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className="flex-1 bg-foreground text-background px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                >
                  {isPending ? "…" : t("deleteConfirmButton")}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
