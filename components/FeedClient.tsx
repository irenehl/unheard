"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronDown, BookOpen } from "lucide-react";
import { TestimonyCard } from "./TestimonyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Category =
  | "work"
  | "family"
  | "health"
  | "love"
  | "money"
  | "education"
  | "courage";

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-40 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
    </Card>
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
      <div aria-busy="true" aria-live="polite" className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground">
        <BookOpen className="h-12 w-12 opacity-30" />
        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <section aria-label={t("title")}>
      <ol className="space-y-4">
        {results.map((testimony) => (
          <li key={testimony._id}>
            <TestimonyCard testimony={testimony as any} />
          </li>
        ))}
      </ol>

      {status === "CanLoadMore" && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => loadMore(20)}>
            <ChevronDown className="mr-2 h-4 w-4" />
            {t("loadMore")}
          </Button>
        </div>
      )}
    </section>
  );
}
