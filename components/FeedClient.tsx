"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
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

export function FeedClient() {
  const t = useTranslations("feed");
  const searchParams = useSearchParams();

  const typeParam = searchParams.get("type") as "honor" | "tell" | null;
  const categoryParam = searchParams.get("category") as Category | null;

  const { results, status, loadMore } = usePaginatedQuery(
    api.testimonies.list,
    {
      type: typeParam ?? undefined,
      category: categoryParam ?? undefined,
    },
    { initialNumItems: 20 }
  );

  if (status === "LoadingFirstPage") {
    return (
      <div aria-busy="true" aria-live="polite" className="border-t-[3px] border-b-[3px] border-foreground mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          <div className="bg-background md:col-span-2 lg:col-span-2">
            <SkeletonEntry />
          </div>
          <div className="bg-background">
            <SkeletonEntry />
          </div>
          <div className="bg-background">
            <SkeletonEntry />
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <section aria-label={t("title")} className="border-t-[3px] border-b-[3px] border-foreground mt-8 mb-12">
        <div className="py-20 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={t("title")} className="border-t-[3px] border-b-[3px] border-foreground mt-8 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {results.map((testimony, index) => {
          const isFirst = index === 0;
          return (
            <div 
              key={testimony._id} 
              className={`bg-background ${isFirst ? 'md:col-span-2 lg:col-span-2' : ''}`}
            >
              <TestimonyCard testimony={testimony} isFeatured={isFirst} />
            </div>
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
    </section>
  );
}
