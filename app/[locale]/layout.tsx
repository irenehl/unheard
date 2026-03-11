import { getTranslations } from "next-intl/server";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { ClerkProvider } from "@clerk/nextjs";
import { routing } from "@/i18n/routing";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ClarityTracker } from "@/components/ClarityTracker";
import { NavBar } from "@/components/NavBar";
import { buildLocaleAlternates, buildPath, getSiteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
      alternateLocale: routing.locales.filter((l) => l !== locale),
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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  let messages: Awaited<ReturnType<typeof getMessages>>;
  try {
    messages = await getMessages();
  } catch (error) {
    throw error;
  }

  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClarityTracker />
          <NavBar locale={locale} />
          {children}
        </NextIntlClientProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
