import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { FeedClient } from "@/components/FeedClient";
import { PhotoGrid } from "@/components/PhotoGrid";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buildLocaleAlternates, buildPath, getSiteUrl } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  let t: Awaited<ReturnType<typeof getTranslations>>;
  try {
    t = await getTranslations({ locale });
  } catch (error) {
    throw error;
  }
  const siteUrl = getSiteUrl();
  const pagePath = buildPath(locale);
  const defaultOgImage = `${siteUrl}/opengraph-image`;
  const defaultTwitterImage = `${siteUrl}/twitter-image`;

  return {
    title: t("feed.title"),
    description: t("landing.tagline"),
    alternates: {
      canonical: `${siteUrl}${pagePath}`,
      languages: buildLocaleAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: "Ellas",
      title: t("feed.title"),
      description: t("landing.tagline"),
      url: `${siteUrl}${pagePath}`,
      locale: locale,
      images: [{ url: defaultOgImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("feed.title"),
      description: t("landing.tagline"),
      images: [defaultTwitterImage],
    },
  };
}

type Category =
  | "work"
  | "family"
  | "health"
  | "love"
  | "money"
  | "education"
  | "courage";

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

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    category?: string;
    debugSegments?: string;
    debugPlainCards?: string;
    debugMinimal?: string;
  }>;
}) {
  const params = await searchParams;
  const debugMinimal =
    params.debugMinimal === "1" || params.debugMinimal === "true";

  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  let locale: Awaited<ReturnType<typeof getLocale>> = "en";
  let setupErrorMessage: string | null = null;
  try {
    [t, locale] = await Promise.all([
      getTranslations(),
      getLocale(),
    ]);
  } catch (error) {
    setupErrorMessage = error instanceof Error ? error.message : "unknown";
  }

  if (setupErrorMessage) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-xl font-semibold text-foreground">Feed setup failed</h1>
      </section>
    );
  }
  if (!t) {
    return null;
  }
  const type =
    params.type === "honor" || params.type === "tell" ? params.type : undefined;
  const categoryValues: Category[] = [
    "work",
    "family",
    "health",
    "love",
    "money",
    "education",
    "courage",
  ];
  const category = categoryValues.includes(params.category as Category)
    ? (params.category as Category)
    : undefined;
  const debugSegments = (params.debugSegments ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const segmentSet = new Set(debugSegments);
  const isolateMode = segmentSet.size > 0;
  const showPhotoGrid = !isolateMode || segmentSet.has("photo");
  const showFilter = !isolateMode || segmentSet.has("filter");
  const showFeed = !isolateMode || segmentSet.has("feed");
  const plainCards =
    params.debugPlainCards === "1" || params.debugPlainCards === "true";
  if (debugMinimal) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-xl font-semibold text-foreground">Debug minimal page</h1>
      </section>
    );
  }
  let initialPage: FeedPage;
  let fetchErrorMessage: string | null = null;
  try {
    initialPage = await fetchQuery(api.testimonies.listFeed, {
      type,
      category,
      locale,
      paginationOpts: {
        numItems: 20,
        cursor: null,
      },
    });
  } catch (error) {
    fetchErrorMessage = error instanceof Error ? error.message : "unknown";
    initialPage = {
      page: [],
      isDone: true,
      continueCursor: null,
    };
  }
  if (fetchErrorMessage) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-xl font-semibold text-foreground">Feed data fallback</h1>
      </section>
    );
  }

  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative flex min-h-[68vh] flex-col justify-between border-b border-border px-6 py-8 sm:px-10 lg:px-16 overflow-hidden"
      >
        <div className="anim-0 flex items-center justify-between">
          <span className="font-mono text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
            {t("landing.eyebrow")}
          </span>
          <span className="font-mono text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
            {t("landing.docRef")}
          </span>
        </div>

        <div>
          <h1
            id="hero-title"
            className="hero-title anim-1 text-foreground"
          >
            {t("feed.title")}
          </h1>

          <div className="anim-2 mt-5 border-t border-border pt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm text-muted-foreground leading-[1.85] max-w-[38ch]">
              {t("landing.tagline")}
            </p>
            <div className="flex items-center gap-5 shrink-0">
              <Link
                href={`/${locale}/submit`}
                className="inline-flex items-center h-9 bg-primary px-5 text-xs font-medium tracking-wide text-primary-foreground hover:bg-primary/90 transition-colors uppercase"
              >
                {t("landing.ctaPrimary")}
              </Link>
              <a
                href="#stories"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.ctaSecondary")} ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {showPhotoGrid && (
        <div className="w-screen border-b border-border">
          <PhotoGrid />
        </div>
      )}

      {showFilter && (
        <Suspense fallback={null}>
          <nav aria-label={t("feed.filterAll")}>
            <CategoryFilter />
          </nav>
        </Suspense>
      )}

      {showFeed && (
        <section
          id="stories"
          aria-label={t("feed.title")}
          className="mx-auto max-w-7xl px-4 sm:px-6 py-10"
        >
          <Suspense fallback={null}>
            <FeedClient
              locale={locale}
              initialPage={initialPage}
              initialFilters={{
                type: type ?? null,
                category: category ?? null,
              }}
              plainCards={plainCards}
            />
          </Suspense>
        </section>
      )}
    </>
  );
}
