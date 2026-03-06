import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { DebugPing } from "@/components/DebugPing";
import { FeedClient } from "@/components/FeedClient";
import { PhotoGrid } from "@/components/PhotoGrid";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";

// #region agent log
fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
  body: JSON.stringify({
    sessionId: "e5cbed",
    runId: "pre-fix-4",
    hypothesisId: "H11",
    location: "app/[locale]/page.tsx:module-init",
    message: "FeedPage module loaded",
    data: { module: "page" },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-1",
      hypothesisId: "H1",
      location: "app/[locale]/page.tsx:generateMetadata:start",
      message: "FeedPage metadata generation started",
      data: { locale },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  let t: Awaited<ReturnType<typeof getTranslations>>;
  try {
    t = await getTranslations({ locale });
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
      body: JSON.stringify({
        sessionId: "e5cbed",
        runId: "pre-fix-1",
        hypothesisId: "H1",
        location: "app/[locale]/page.tsx:generateMetadata:error",
        message: "FeedPage metadata getTranslations failed",
        data: {
          locale,
          errorMessage: error instanceof Error ? error.message : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-2",
      hypothesisId: "H1",
      location: "app/[locale]/page.tsx:generateMetadata:success",
      message: "FeedPage metadata translations loaded",
      data: { locale },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    title: t("feed.title"),
    description: t("landing.tagline"),
    alternates: {
      canonical: `/${locale}`,
    },
    openGraph: {
      title: t("feed.title"),
      description: t("landing.tagline"),
      url: `/${locale}`,
      locale: locale,
    },
    twitter: {
      title: t("feed.title"),
      description: t("landing.tagline"),
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

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    category?: string;
    debugSegments?: string;
    debugPlainCards?: string;
  }>;
}) {
  let t: Awaited<ReturnType<typeof getTranslations>>;
  let locale: Awaited<ReturnType<typeof getLocale>>;
  let params: Awaited<typeof searchParams>;
  try {
    [t, locale, params] = await Promise.all([
      getTranslations(),
      getLocale(),
      searchParams,
    ]);
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
      body: JSON.stringify({
        sessionId: "e5cbed",
        runId: "pre-fix-1",
        hypothesisId: "H2",
        location: "app/[locale]/page.tsx:FeedPage:setup-error",
        message: "FeedPage setup failed before data fetch",
        data: {
          errorMessage: error instanceof Error ? error.message : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-1",
      hypothesisId: "H2",
      location: "app/[locale]/page.tsx:FeedPage:setup-success",
      message: "FeedPage setup completed",
      data: {
        locale,
        type: params.type ?? null,
        category: params.category ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
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
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-1",
      hypothesisId: "H4",
      location: "app/[locale]/page.tsx:FeedPage:before-fetchQuery",
      message: "FeedPage calling testimonies.listFeed",
      data: {
        locale,
        type: type ?? null,
        category: category ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  let initialPage;
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
    // #region agent log
    fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
      body: JSON.stringify({
        sessionId: "e5cbed",
        runId: "pre-fix-1",
        hypothesisId: "H4",
        location: "app/[locale]/page.tsx:FeedPage:fetchQuery-error",
        message: "FeedPage fetchQuery failed",
        data: {
          locale,
          type: type ?? null,
          category: category ?? null,
          errorMessage: error instanceof Error ? error.message : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-1",
      hypothesisId: "H4",
      location: "app/[locale]/page.tsx:FeedPage:fetchQuery-success",
      message: "FeedPage fetchQuery completed",
      data: {
        itemCount: initialPage.page.length,
        isDone: initialPage.isDone,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <>
      <DebugPing
        marker="feed-page-rendered"
        data={{
          locale,
          itemCount: initialPage.page.length,
          isolateMode,
          showPhotoGrid,
          showFilter,
          showFeed,
          plainCards,
        }}
      />
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
