import { getTranslations } from "next-intl/server";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { ClerkProvider } from "@clerk/nextjs";
import { routing } from "@/i18n/routing";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { NavBar } from "@/components/NavBar";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "75acde" },
    body: JSON.stringify({
      sessionId: "75acde",
      runId: "pre-fix-2",
      hypothesisId: "H6",
      location: "app/[locale]/layout.tsx:generateMetadata:start",
      message: "generateMetadata started",
      data: { locale, isValidLocale: hasLocale(routing.locales, locale) },
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
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "75acde" },
      body: JSON.stringify({
        sessionId: "75acde",
        runId: "pre-fix-2",
        hypothesisId: "H7",
        location: "app/[locale]/layout.tsx:generateMetadata:error",
        message: "generateMetadata getTranslations failed",
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

  const siteUrl = process.env.SITE_URL || "https://example.com";

  // Generate hreflang alternates for all locales
  const alternates: Record<string, string> = {};
  for (const loc of routing.locales) {
    alternates[loc] = `${siteUrl}/${loc}`;
  }

  return {
    description: t("landing.tagline"),
    alternates: {
      canonical: `/${locale}`,
      languages: alternates,
    },
    openGraph: {
      title: t("feed.title"),
      description: t("landing.tagline"),
      url: `/${locale}`,
      locale: locale,
      alternateLocale: routing.locales.filter((l) => l !== locale),
    },
    twitter: {
      title: t("feed.title"),
      description: t("landing.tagline"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    // #region agent log
    fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "75acde" },
      body: JSON.stringify({
        sessionId: "75acde",
        runId: "pre-fix-2",
        hypothesisId: "H8",
        location: "app/[locale]/layout.tsx:layout-invalid-locale",
        message: "LocaleLayout rejected invalid locale",
        data: { locale },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    notFound();
  }

  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-1",
      hypothesisId: "H3",
      location: "app/[locale]/layout.tsx:LocaleLayout:before-getMessages",
      message: "LocaleLayout requesting messages",
      data: { locale },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  let messages: Awaited<ReturnType<typeof getMessages>>;
  try {
    messages = await getMessages();
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
      body: JSON.stringify({
        sessionId: "e5cbed",
        runId: "pre-fix-1",
        hypothesisId: "H3",
        location: "app/[locale]/layout.tsx:LocaleLayout:getMessages-error",
        message: "LocaleLayout getMessages failed",
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
      runId: "pre-fix-1",
      hypothesisId: "H3",
      location: "app/[locale]/layout.tsx:LocaleLayout:getMessages-success",
      message: "LocaleLayout loaded messages",
      data: {
        locale,
        messageNamespaceCount:
          messages && typeof messages === "object"
            ? Object.keys(messages).length
            : 0,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NavBar locale={locale} />
          {children}
        </NextIntlClientProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
