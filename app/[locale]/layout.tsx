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
  const t = await getTranslations({ locale });

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
    notFound();
  }

  const messages = await getMessages();

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
