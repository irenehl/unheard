"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { motion } from "framer-motion";
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
type TypeFilter = "all" | "honor" | "tell";

export function CategoryFilter() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useShouldReduceMotion();

  const activeCategory = searchParams.get("category") as Category | null;
  const activeType = (searchParams.get("type") as TypeFilter) ?? "all";

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="sticky top-0 z-40 bg-background border-b-[3px] border-foreground px-4 py-3 mb-8">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">

        {/* Type filter — with sliding layoutId underline indicator */}
        <div role="tablist" aria-label={t("feed.filterAll")} className="flex gap-6">
          {(["all", "honor", "tell"] as TypeFilter[]).map((type) => {
            const isActive = activeType === type;
            return (
              <motion.button
                key={type}
                role="tab"
                aria-selected={isActive}
                onClick={() => updateParam("type", type === "all" ? null : type)}
                className={`relative pb-1 text-xs font-bold tracking-widest uppercase transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                {t(`feed.filter${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                {/* Sliding active underline */}
                {isActive && (
                  <motion.span
                    layoutId={shouldReduceMotion ? undefined : "type-filter-indicator"}
                    className="absolute bottom-0 inset-x-0 h-[2px] bg-primary"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Category chips */}
        <div
          role="group"
          aria-label={t("feed.categoriesLabel")}
          className="flex flex-wrap justify-center gap-x-4 gap-y-2"
        >
          <motion.button
            aria-pressed={activeCategory === null}
            onClick={() => updateParam("category", null)}
            className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${
              activeCategory === null
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            [ {t("feed.filterAll")} ]
          </motion.button>
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              aria-pressed={activeCategory === cat}
              onClick={() =>
                updateParam("category", activeCategory === cat ? null : cat)
              }
              className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${
                activeCategory === cat
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
              transition={{ duration: 0.1 }}
            >
              [ {t(`categories.${cat}`)} ]
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
