"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

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
    <div className="sticky top-0 z-40 bg-background border-b-[3px] border-foreground px-4 py-3 mb-8">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div
          role="tablist"
          aria-label={t("feed.filterAll")}
          className="flex gap-6"
        >
          {(["all", "honor", "tell"] as TypeFilter[]).map((type) => (
            <button
              key={type}
              role="tab"
              aria-selected={activeType === type}
              onClick={() =>
                updateParam("type", type === "all" ? null : type)
              }
              className={`text-xs font-bold tracking-widest uppercase transition-colors ${
                activeType === type
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(
                `feed.filter${
                  type.charAt(0).toUpperCase() + type.slice(1)
                }`
              )}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label={t("feed.categoriesLabel")}
          className="flex flex-wrap justify-center gap-x-4 gap-y-2"
        >
          <button
            aria-pressed={activeCategory === null}
            onClick={() => updateParam("category", null)}
            className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${
              activeCategory === null
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            [ {t("feed.filterAll")} ]
          </button>
          {CATEGORIES.map((cat) => (
            <button
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
            >
              [ {t(`categories.${cat}`)} ]
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
