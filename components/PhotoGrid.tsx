"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { PhotoCard, type PhotoProfile } from "./PhotoCard";
import { PhotoUploadModal } from "./PhotoUploadModal";
import { api } from "@/convex/_generated/api";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

// #region agent log
fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
  body: JSON.stringify({
    sessionId: "e5cbed",
    runId: "pre-fix-4",
    hypothesisId: "H14",
    location: "components/PhotoGrid.tsx:module-init",
    message: "PhotoGrid module loaded",
    data: { module: "PhotoGrid" },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];
const VISIBLE_DESKTOP = 4;
const AUTOPLAY_MS = 4000;
const SLIDE_MS = 600;

const COLOR_FADE_IN_MS = 800;
const COLOR_HOLD_MS = 4000;
const COLOR_FADE_OUT_MS = 600;
const COLOR_GAP_MS = 200;

// ─── Color cycle hook ─────────────────────────────────────────────────────────

/**
 * Cycles through photos sequentially, returning the _id of the currently
 * "active" photo (in color). Returns null during the gap between cards.
 *
 * Timing per card: fade-in (800ms) → hold (4s) → fade-out (600ms) → gap (200ms)
 */
function useColorCycle(photos: PhotoProfile[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const startFrom = useCallback(
    (idx: number) => {
      clearTimeouts();
      const ps = photosRef.current;
      if (ps.length === 0) {
        setActiveId(null);
        return;
      }

      const i = ((idx % ps.length) + ps.length) % ps.length;
      setActiveId(ps[i]._id);

      const t1 = setTimeout(() => {
        setActiveId(null);

        const t2 = setTimeout(() => {
          startFrom(i + 1);
        }, COLOR_FADE_OUT_MS + COLOR_GAP_MS);
        timeoutsRef.current.push(t2);
      }, COLOR_FADE_IN_MS + COLOR_HOLD_MS);
      timeoutsRef.current.push(t1);
    },
    [clearTimeouts],
  );

  useEffect(() => {
    if (photos.length > 0) {
      startFrom(0);
    } else {
      setActiveId(null);
    }
    return clearTimeouts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  return { activeId, startFrom };
}

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

  const { activeId: activeColorId } = useColorCycle(photos);

  // Keep items in sync when query refreshes — only reset when the actual
  // data changes (new/removed photos), not on every sliding state change.
  const photosKeyRef = useRef("");
  useEffect(() => {
    const key = photos.map((p) => p._id).join(",");
    if (key !== photosKeyRef.current) {
      photosKeyRef.current = key;
      setItems(ensureMinLength(photos, VISIBLE_DESKTOP + 1));
    }
  }, [photos]);

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
    <div className="relative h-full">
      <div
        ref={containerRef}
        className="overflow-hidden h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setIsFocused(true)}
        onBlurCapture={() => setIsFocused(false)}
      >
        <div
          ref={trackRef}
          className="flex h-full"
          style={{
            transform: sliding ? `translateX(-${cardWidth}px)` : "translateX(0)",
            transition: sliding ? `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none",
            width: cardWidth ? `${cardWidth * visible.length}px` : `${(100 / VISIBLE_DESKTOP) * visible.length}%`,
          }}
        >
          {visible.map((photo, i) => (
            <div
              key={`${photo._id}-${i}`}
              className="border-r border-white/15 last:border-r-0"
              style={{ width: cardWidth || `${100 / visible.length}%`, flexShrink: 0, height: "100%" }}
            >
              <PhotoCard
                photo={photo}
                index={i}
                priority={i < VISIBLE_DESKTOP}
                isColorActive={photo._id === activeColorId}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Overlaid nav arrows */}
      <button
        onClick={retreat}
        aria-label={t("navPrev")}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-10 w-10 bg-black/40 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:border-white/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        onClick={advance}
        aria-label={t("navNext")}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-10 w-10 bg-black/40 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:border-white/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>

      <div
        className="absolute bottom-0 inset-x-0 z-10 flex justify-end px-4 pointer-events-none"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto">
          <UploadButton onClick={onUploadClick} label={t("uploadCta")} />
        </div>
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

  const visiblePhotos = photos.slice(0, 8);
  const { activeId } = useColorCycle(visiblePhotos);

  return (
    <div className="relative h-full">
      <div className="grid grid-cols-2 gap-px bg-border h-full">
        {visiblePhotos.map((photo, i) => (
          <motion.div
            key={photo._id}
            className="h-full"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, ease: EASE, delay: shouldReduceMotion ? 0 : i * 0.06 }}
          >
            <PhotoCard
              photo={photo}
              index={i}
              priority={i < 2}
              isColorActive={photo._id === activeId}
            />
          </motion.div>
        ))}
      </div>

      <div
        className="absolute bottom-0 inset-x-0 z-10 flex justify-end px-4 pointer-events-none"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto">
          <UploadButton onClick={onUploadClick} label={t("uploadCta")} />
        </div>
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
  const isAutoScrollingRef = useRef(false);

  const { activeId, startFrom } = useColorCycle(photos);

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
      isAutoScrollingRef.current = true;
      const cardW = el.clientWidth;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + cardW;
      el.scrollTo({ left: next > maxScroll ? 0 : next, behavior: "smooth" });
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, SLIDE_MS + 100);
    }, AUTOPLAY_MS);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isInView, shouldReduceMotion]);

  // Reset color cycle when user manually swipes to a new card
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      if (isAutoScrollingRef.current) return;
      const visibleIdx = Math.round(el.scrollLeft / el.clientWidth);
      startFrom(visibleIdx);
    };

    el.addEventListener("scrollend", onScrollEnd);
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [startFrom]);

  return (
    <div className="relative h-full">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide h-full"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        aria-label={t("sectionLabel")}
      >
        {photos.map((photo, i) => (
          <div
            key={photo._id}
            className="shrink-0 h-full"
            style={{ width: "100%", scrollSnapAlign: "start" }}
          >
            <PhotoCard
              photo={photo}
              index={i}
              priority={i === 0}
              isColorActive={photo._id === activeId}
            />
          </div>
        ))}
      </div>

      <div
        className="absolute bottom-0 inset-x-0 z-10 flex justify-end px-4 pointer-events-none"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto">
          <UploadButton onClick={onUploadClick} label={t("uploadCta")} />
        </div>
      </div>
    </div>
  );
}

// ─── Upload CTA button ────────────────────────────────────────────────────────

function UploadButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase bg-black/40 backdrop-blur-sm text-white/80 hover:text-white border border-white/20 hover:border-white/50 px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
  const rawProfiles = useQuery(api.profiles.list);
  const rawStoryPhotos = useQuery(api.testimonies.listCarouselPhotos);
  const [uploadOpen, setUploadOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const profilePhotos: PhotoProfile[] = (rawProfiles ?? [])
    .filter((p) => p.photoUrl !== null)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      profession: p.profession,
      country: p.country,
      photoUrl: p.photoUrl,
      createdAt: p.createdAt,
    })) as PhotoProfile[];

  const storyPhotos: PhotoProfile[] = (rawStoryPhotos ?? [])
    .filter((s) => s.photoUrl !== null)
    .map((s) => ({
      _id: s._id,
      name:
        s.type === "honor"
          ? (s.subjectName ?? "")
          : s.isAnonymous
            ? ""
            : (s.authorName ?? ""),
      profession:
        s.type === "honor"
          ? (s.subjectProfession ?? "")
          : s.isAnonymous
            ? ""
            : (s.authorProfession ?? ""),
      country:
        s.type === "honor"
          ? (s.subjectCountry ?? "")
          : s.isAnonymous
            ? ""
            : (s.authorCountry ?? ""),
      photoUrl: s.photoUrl,
      createdAt: s.createdAt,
    })) as PhotoProfile[];

  const photos: PhotoProfile[] = [...profilePhotos, ...storyPhotos]
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  

  // Loading / empty state
  if (rawProfiles === undefined || rawStoryPhotos === undefined) {
    return (
      <section ref={rootRef} aria-label={t("sectionLabel")} className="w-screen h-screen" style={{ height: "100dvh" }}>
        <div className="h-full bg-secondary animate-pulse" />
      </section>
    );
  }

  if (photos.length === 0) {
    return (
      <section ref={rootRef} aria-label={t("sectionLabel")} className="w-screen h-screen" style={{ height: "100dvh" }}>
        <div className="border border-border border-dashed flex h-full flex-col items-center justify-center gap-4">
          <Camera className="h-8 w-8 text-muted-foreground" aria-hidden />
          <motion.button
            onClick={() => setUploadOpen(true)}
            className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
          >
            {t("uploadCta")}
          </motion.button>
        </div>
        {uploadOpen && <PhotoUploadModal onClose={() => setUploadOpen(false)} />}
      </section>
    );
  }

  return (
    <section ref={rootRef} aria-label={t("sectionLabel")} className="w-screen h-screen" style={{ height: "100dvh" }}>
      {/* Mobile carousel */}
      <div className="block md:hidden h-full">
        <MobileCarousel photos={photos} onUploadClick={() => setUploadOpen(true)} />
      </div>

      {/* Tablet 2-column grid */}
      <div className="hidden md:block lg:hidden h-full">
        <TabletGrid photos={photos} onUploadClick={() => setUploadOpen(true)} />
      </div>

      {/* Desktop conveyor belt */}
      <div className="hidden lg:block h-full">
        <DesktopGrid photos={photos} onUploadClick={() => setUploadOpen(true)} />
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {uploadOpen && <PhotoUploadModal onClose={() => setUploadOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}
