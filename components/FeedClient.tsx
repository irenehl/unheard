"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  type Variants,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import { TestimonyCard } from "./TestimonyCard";
import { useShouldReduceMotion } from "@/lib/motionPrefs";
import type { Id } from "@/convex/_generated/dataModel";
import * as React from "react";

type Category =
  | "work"
  | "family"
  | "health"
  | "love"
  | "money"
  | "education"
  | "courage";

type TypeFilter = "honor" | "tell" | null;
type CategoryFilter = Category | null;
type FeedItem = {
  _id: Id<"testimonies">;
  type: "honor" | "tell";
  category: Category;
  authorId?: string;
  authorName?: string;
  isAnonymous: boolean;
  createdAt: number;
  editedAt?: number;
  originalLanguage: string;
  originalText: string;
  editedText: string;
  translatedText: Record<string, string>;
  hasMoreContent?: boolean;
  hasMoreOriginal?: boolean;
  hasMoreEdited?: boolean;
  hasMoreTranslated?: boolean;
  photoUrl?: string | null;
};

type FeedPage = {
  page: FeedItem[];
  isDone: boolean;
  continueCursor: string | null;
};

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
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: EASE },
  },
};

export function FeedClient({
  locale,
  initialPage,
  initialFilters,
  plainCards = false,
}: {
  locale: string;
  initialPage: FeedPage;
  initialFilters: { type: TypeFilter; category: CategoryFilter };
  plainCards?: boolean;
}) {
  const t = useTranslations("feed");
  const searchParams = useSearchParams();
  const shouldReduceMotion = useShouldReduceMotion();
  const { user } = useUser();

  const typeParam = searchParams.get("type") as TypeFilter;
  const categoryParam = searchParams.get("category") as Category | null;
  const filterKey = `${typeParam ?? "all"}-${categoryParam ?? "all"}-${locale}`;
  const initialFilterKey = `${initialFilters.type ?? "all"}-${initialFilters.category ?? "all"}-${locale}`;

  const transitionDuration = shouldReduceMotion ? 0 : undefined;
  const [items, setItems] = React.useState<FeedItem[]>(initialPage.page);
  const [cursor, setCursor] = React.useState<string | null>(
    initialPage.isDone ? null : initialPage.continueCursor
  );
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [showSlowConnection, setShowSlowConnection] = React.useState(false);

  React.useEffect(() => {
    setItems(initialPage.page);
    setCursor(initialPage.isDone ? null : initialPage.continueCursor);
    setIsLoadingMore(false);
    setLoadError(false);
    setShowSlowConnection(false);
  }, [initialPage, initialFilterKey]);

  React.useEffect(() => {
    if (isLoadingMore) {
      const timer = setTimeout(() => {
        setShowSlowConnection(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
    setShowSlowConnection(false);
    return undefined;
  }, [isLoadingMore]);

  async function loadMoreStories() {
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setLoadError(false);

    try {
      const params = new URLSearchParams({
        locale,
        numItems: "20",
        cursor,
      });
      if (typeParam) params.set("type", typeParam);
      if (categoryParam) params.set("category", categoryParam);

      const response = await fetch(`/api/testimonies?${params.toString()}`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to load more");
      }

      const page = (await response.json()) as FeedPage;
      setItems((prev) => [...prev, ...page.page]);
      setCursor(page.isDone ? null : page.continueCursor);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait" initial={false}>
        {items.length === 0 ? (
          <m.section
            key={`empty-${filterKey}`}
            aria-label={t("title")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: transitionDuration ?? 0.25 } }}
            exit={{ opacity: 0, transition: { duration: transitionDuration ?? 0.15 } }}
            className="border-t-[3px] border-b-[3px] border-foreground mt-8 mb-12"
          >
            <div className="py-20 text-center">
              <p className="text-muted-foreground">{t("empty")}</p>
            </div>
          </m.section>
        ) : (
          <m.section
            key={`results-${filterKey}`}
            aria-label={t("title")}
            variants={shouldReduceMotion ? { hidden: {}, visible: {}, exit: {} } : containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="border-t-[3px] border-b-[3px] border-foreground mt-8 mb-12"
          >
            <div className="columns-1 gap-x-px md:columns-2 lg:columns-3 bg-border">
              {items.map((testimony) => {
                if (plainCards) {
                  return (
                    <m.article
                      key={testimony._id}
                      variants={shouldReduceMotion ? { hidden: {}, visible: {} } : itemVariants}
                      className="mb-px w-full break-inside-avoid bg-background p-6"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {testimony.type} · {testimony.category}
                      </p>
                      <p className="mt-3 text-sm text-foreground line-clamp-6">
                        {testimony.editedText || testimony.originalText}
                      </p>
                    </m.article>
                  );
                }
                return (
                  <m.div
                    key={testimony._id}
                    variants={shouldReduceMotion ? { hidden: {}, visible: {} } : itemVariants}
                    className="mb-px w-full break-inside-avoid bg-background"
                  >
                    <TestimonyCard
                      testimony={testimony}
                      isFeatured={false}
                      currentUserId={user?.id}
                      locale={locale}
                      showExpandLink={Boolean(testimony.hasMoreContent)}
                      showExpandOriginal={Boolean(testimony.hasMoreOriginal)}
                      showExpandEdited={Boolean(testimony.hasMoreEdited)}
                      showExpandTranslated={Boolean(testimony.hasMoreTranslated)}
                    />
                  </m.div>
                );
              })}
            </div>

            {showSlowConnection && (
              <div className="bg-secondary px-4 py-3 text-center text-xs text-muted-foreground border-t border-border">
                {t("slowConnection")}
              </div>
            )}

            {loadError && (
              <div className="bg-secondary px-4 py-4 text-center border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">{t("loadMoreError")}</p>
                <button
                  onClick={loadMoreStories}
                  className="text-xs font-bold tracking-widest uppercase text-foreground hover:text-primary transition-colors"
                >
                  {t("retry")}
                </button>
              </div>
            )}

            {cursor && (
              <div className="flex justify-center bg-background py-8 border-t border-border">
                <m.button
                  onClick={loadMoreStories}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-foreground hover:text-primary transition-colors disabled:opacity-50"
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <ChevronDown className="h-4 w-4" />
                  {isLoadingMore ? t("loadingMore") : t("loadMore")}
                </m.button>
              </div>
            )}
          </m.section>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
