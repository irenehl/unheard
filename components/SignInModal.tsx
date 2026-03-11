"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { SignInPrompt } from "./SignInPrompt";

export function SignInModal({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const returnUrl = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const modal = (
    <div
      className="fixed inset-0 z-100 flex min-h-dvh items-center justify-center px-4 py-6 sm:px-6"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_48%)]" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        className="relative w-full max-w-2xl border border-border/80 bg-background/95 p-7 shadow-2xl sm:p-10 pointer-events-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close sign in modal"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <SignInPrompt returnUrl={returnUrl} centered />
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold tracking-widest uppercase text-foreground hover:text-primary transition-colors"
      >
        {label}
      </button>

      {open && mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
