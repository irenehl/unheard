"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { TestimonyCard } from "./TestimonyCard";
import { Skeleton } from "@/components/ui/skeleton";

type Category =
  | "work"
  | "family"
  | "health"
  | "love"
  | "money"
  | "education"
  | "courage";

/** Loading skeleton row — matches grid item */
function SkeletonEntry() {
  return (
    <div className="py-7 border-t border-border first:border-t-0">
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-2.5 w-16 bg-secondary" />
        <Skeleton className="h-2.5 w-10 bg-secondary" />
        <Skeleton className="h-2.5 w-24 bg-secondary" />
      </div>
      <Skeleton className="h-4 w-full mb-3 bg-secondary" />
      <Skeleton className="h-4 w-5/6 mb-3 bg-secondary" />
      <Skeleton className="h-4 w-3/5 bg-secondary" />
    </div>
  );
}

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];

/** Shared variants for staggered card grid */
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

export function FeedClient() {
  const t = useTranslations("feed");
  const searchParams = useSearchParams();

  const typeParam = searchParams.get("type") as "honor" | "tell" | null;
  const categoryParam = searchParams.get("category") as Category | null;
  const filterKey = `${typeParam ?? "all"}-${categoryParam ?? "all"}`;

  const { results, status, loadMore } = usePaginatedQuery(
    api.testimonies.list,
    {
      type: typeParam ?? undefined,
      category: categoryParam ?? undefined,
    },
    { initialNumItems: 20 }
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "LoadingFirstPage" ? (
        /* Skeleton grid */
        <motion.div
          key={`skeleton-${filterKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          aria-busy="true"
          aria-live="polite"
          className="border-t-[3px] border-b-[3px] border-foreground mt-8 mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            <div className="bg-background px-8 py-8 md:col-span-2 lg:col-span-2">
              <SkeletonEntry />
            </div>
            <div className="bg-background px-8 py-8">
              <SkeletonEntry />
            </div>
            <div className="bg-background px-8 py-8">
              <SkeletonEntry />
            </div>
          </div>
        </motion.div>
      ) : results.length === 0 ? (
        /* Empty state */
        <motion.section
          key={`empty-${filterKey}`}
          aria-label={t("title")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="border-t-[3px] border-b-[3px] border-foreground mt-8 mb-12"
        >
          <div className="py-20 text-center">
            <p className="text-muted-foreground">{t("empty")}</p>
          </div>
        </motion.section>
      ) : (
        /* Results grid with stagger */
        <motion.section
          key={`results-${filterKey}`}
          aria-label={t("title")}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="border-t-[3px] border-b-[3px] border-foreground mt-8 mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {results.map((testimony, index) => {
              const isFirst = index === 0;
              return (
                <motion.div
                  key={testimony._id}
                  variants={itemVariants}
                  className={`bg-background ${isFirst ? "md:col-span-2 lg:col-span-2" : ""}`}
                >
                  <TestimonyCard
                    testimony={testimony as Doc<"testimonies">}
                    isFeatured={isFirst}
                  />
                </motion.div>
              );
            })}
          </div>

          {status === "CanLoadMore" && (
            <div className="flex justify-center bg-background py-8 border-t border-border">
              <button
                onClick={() => loadMore(20)}
                className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-foreground hover:text-primary transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
                {t("loadMore")}
              </button>
            </div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
