"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="sticky top-[57px] z-40 border-b border-border bg-background/80 backdrop-blur-sm py-3 px-4">
      <div className="mx-auto max-w-2xl space-y-3">
        {/* Type filter */}
        <div
          role="group"
          aria-label={t("feed.filterAll")}
          className="flex gap-2"
        >
          {(["all", "honor", "tell"] as TypeFilter[]).map((type) => (
            <Button
              key={type}
              size="sm"
              variant={activeType === type ? "secondary" : "ghost"}
              aria-pressed={activeType === type}
              onClick={() => updateParam("type", type === "all" ? null : type)}
              className="text-xs"
            >
              {t(
                `feed.filter${type.charAt(0).toUpperCase() + type.slice(1)}` as any
              )}
            </Button>
          ))}
        </div>

        {/* Category chips */}
        <div
          role="group"
          aria-label="Categorías"
          className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide"
        >
          <Button
            size="sm"
            variant={activeCategory === null ? "secondary" : "outline"}
            aria-pressed={activeCategory === null}
            onClick={() => updateParam("category", null)}
            className="shrink-0 text-xs"
          >
            {t("feed.filterAll")}
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "secondary" : "outline"}
              aria-pressed={activeCategory === cat}
              onClick={() =>
                updateParam("category", activeCategory === cat ? null : cat)
              }
              className="shrink-0 text-xs"
            >
              {t(`categories.${cat}`)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
