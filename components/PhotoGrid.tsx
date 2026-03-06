"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { PhotoCard, type PhotoProfile } from "./PhotoCard";
import { api } from "@/convex/_generated/api";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];
const VISIBLE_DESKTOP = 4;
const AUTOPLAY_MS = 4000;
const SLIDE_MS = 600;

// ─── Desktop conveyor belt ────────────────────────────────────────────────────

/**
 * Infinite conveyor belt: always renders VISIBLE+1 items.
 * On each advance: animate container left by 1 card width, then rotate array
 * and snap back to position 0 with no transition — imperceptible to the eye.
 */
function DesktopGrid({
  photos,
  onUploadClick,
}: {
  photos: PhotoProfile[];
  onUploadClick: () => void;
}) {
  const t = useTranslations("gallery");
  const shouldReduceMotion = useShouldReduceMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<PhotoProfile[]>(() => ensureMinLength(photos, VISIBLE_DESKTOP + 1));
  const [sliding, setSliding] = useState(false);
  const [cardWidth, setCardWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const slidingRef = useRef(false);

  // Keep items in sync when query refreshes
  useEffect(() => {
    if (!sliding) {
      setItems(ensureMinLength(photos, VISIBLE_DESKTOP + 1));
    }
  }, [photos, sliding]);

  // Measure card width via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCardWidth(el.offsetWidth / VISIBLE_DESKTOP);
    });
    ro.observe(el);
    setCardWidth(el.offsetWidth / VISIBLE_DESKTOP);
    return () => ro.disconnect();
  }, []);

  // Intersection observer — pause when off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const advance = useCallback(() => {
    if (slidingRef.current || shouldReduceMotion) return;
    slidingRef.current = true;
    setSliding(true);

    setTimeout(() => {
      // Rotate: move first item to end, snap to position 0
      setItems((prev) => {
        const next = [...prev.slice(1), prev[0]];
        return next;
      });
      setSliding(false);
      slidingRef.current = false;
    }, SLIDE_MS + 50);
  }, [shouldReduceMotion]);

  const retreat = useCallback(() => {
    if (slidingRef.current || shouldReduceMotion) return;
    // For retreat, move last item to front, then animate from -1 to 0
    // We pre-rotate, set transform to -cardWidth instantly, then animate to 0
    slidingRef.current = true;

    setItems((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);

    // Force layout before adding transition
    requestAnimationFrame(() => {
      if (!trackRef.current) { slidingRef.current = false; return; }
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform = `translateX(-${cardWidth}px)`;

      requestAnimationFrame(() => {
        if (!trackRef.current) { slidingRef.current = false; return; }
        trackRef.current.style.transition = `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        trackRef.current.style.transform = "translateX(0)";

        setTimeout(() => { slidingRef.current = false; }, SLIDE_MS + 50);
      });
    });
  }, [cardWidth, shouldReduceMotion]);

  // Autoplay
  useEffect(() => {
    if (!isInView || isHovered || isFocused || shouldReduceMotion) return;
    const id = setInterval(advance, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [advance, isInView, isHovered, isFocused, shouldReduceMotion]);

  const visible = items.slice(0, VISIBLE_DESKTOP + 1);

  return (
    <div className="relative">
      {/* Grid + overflow clip */}
      <div
        ref={containerRef}
        className="overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setIsFocused(true)}
        onBlurCapture={() => setIsFocused(false)}
        style={{ minHeight: cardWidth || undefined }}
      >
        <div
          ref={trackRef}
          className="flex"
          style={{
            transform: sliding ? `translateX(-${cardWidth}px)` : "translateX(0)",
            transition: sliding ? `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none",
            width: cardWidth ? `${cardWidth * visible.length}px` : `${(100 / VISIBLE_DESKTOP) * visible.length}%`,
          }}
        >
          {visible.map((photo, i) => (
            <div
              key={`${photo._id}-${i}`}
              style={{ width: cardWidth || `${100 / visible.length}%`, flexShrink: 0 }}
            >
              <PhotoCard photo={photo} index={i} priority={i < VISIBLE_DESKTOP} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={retreat}
            aria-label={t("navPrev")}
            className="flex items-center justify-center h-8 w-8 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            onClick={advance}
            aria-label={t("navNext")}
            className="flex items-center justify-center h-8 w-8 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <UploadButton onClick={onUploadClick} label={t("uploadCta")} />
      </div>
    </div>
  );
}

// ─── Tablet static grid ───────────────────────────────────────────────────────

function TabletGrid({
  photos,
  onUploadClick,
}: {
  photos: PhotoProfile[];
  onUploadClick: () => void;
}) {
  const t = useTranslations("gallery");
  const shouldReduceMotion = useShouldReduceMotion();

  return (
    <div>
      <div className="grid grid-cols-2 gap-px bg-border">
        {photos.slice(0, 8).map((photo, i) => (
          <motion.div
            key={photo._id}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, ease: EASE, delay: shouldReduceMotion ? 0 : i * 0.06 }}
          >
            <PhotoCard photo={photo} index={i} priority={i < 2} />
          </motion.div>
        ))}
      </div>
      <div className="flex justify-end mt-3">
        <UploadButton onClick={onUploadClick} label={t("uploadCta")} />
      </div>
    </div>
  );
}

// ─── Mobile carousel ──────────────────────────────────────────────────────────

function MobileCarousel({
  photos,
  onUploadClick,
}: {
  photos: PhotoProfile[];
  onUploadClick: () => void;
}) {
  const t = useTranslations("gallery");
  const shouldReduceMotion = useShouldReduceMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;

    autoplayRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const cardW = el.clientWidth * 0.9;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + cardW;
      el.scrollTo({ left: next > maxScroll ? 0 : next, behavior: "smooth" });
    }, AUTOPLAY_MS);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isInView, shouldReduceMotion]);

  return (
    <div>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide gap-px bg-border"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        aria-label={t("sectionLabel")}
      >
        {photos.map((photo, i) => (
          <div
            key={photo._id}
            className="shrink-0 bg-background"
            style={{ width: "90%", scrollSnapAlign: "start" }}
          >
            <PhotoCard photo={photo} index={i} priority={i === 0} />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-3">
        <UploadButton onClick={onUploadClick} label={t("uploadCta")} />
      </div>
    </div>
  );
}

// ─── Upload CTA button ────────────────────────────────────────────────────────

function UploadButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground border border-border hover:border-foreground px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
    >
      <Camera className="h-3 w-3" aria-hidden />
      {label}
    </motion.button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureMinLength(photos: PhotoProfile[], min: number): PhotoProfile[] {
  if (photos.length === 0) return [];
  let result = [...photos];
  while (result.length < min) {
    result = [...result, ...photos];
  }
  return result;
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function PhotoGrid() {
  const t = useTranslations("gallery");
  const shouldReduceMotion = useShouldReduceMotion();
  const rawProfiles = useQuery(api.profiles.list);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Lazy-load modal to avoid SSR issues
  const [ModalComponent, setModalComponent] = useState<React.ComponentType<{ onClose: () => void }> | null>(null);

  useEffect(() => {
    if (uploadOpen && !ModalComponent) {
      import("./PhotoUploadModal").then((m) => setModalComponent(() => m.PhotoUploadModal));
    }
  }, [uploadOpen, ModalComponent]);

  const photos: PhotoProfile[] = (rawProfiles ?? []).filter((p) => p.photoUrl !== null) as PhotoProfile[];

  const staggerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  };

  // Loading / empty state
  if (rawProfiles === undefined) {
    return (
      <section aria-label={t("sectionLabel")} className="py-10">
        <div className="h-64 bg-secondary animate-pulse" />
      </section>
    );
  }

  if (photos.length === 0) {
    return (
      <section aria-label={t("sectionLabel")} className="py-10">
        <div className="border border-border border-dashed flex flex-col items-center justify-center py-16 gap-4">
          <Camera className="h-8 w-8 text-muted-foreground" aria-hidden />
          <motion.button
            onClick={() => setUploadOpen(true)}
            className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
          >
            {t("uploadCta")}
          </motion.button>
        </div>
        {uploadOpen && ModalComponent && <ModalComponent onClose={() => setUploadOpen(false)} />}
      </section>
    );
  }

  return (
    <section aria-label={t("sectionLabel")} className="py-10">
      {/* Mobile carousel */}
      <div className="block md:hidden">
        <MobileCarousel photos={photos} onUploadClick={() => setUploadOpen(true)} />
      </div>

      {/* Tablet 2-column grid */}
      <div className="hidden md:block lg:hidden">
        <TabletGrid photos={photos} onUploadClick={() => setUploadOpen(true)} />
      </div>

      {/* Desktop conveyor belt */}
      <div className="hidden lg:block">
        <DesktopGrid photos={photos} onUploadClick={() => setUploadOpen(true)} />
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {uploadOpen && ModalComponent && <ModalComponent onClose={() => setUploadOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}
