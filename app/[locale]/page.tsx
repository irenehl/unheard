import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { CategoryFilter } from "@/components/CategoryFilter";
import { FeedClient } from "@/components/FeedClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const siteUrl = process.env.SITE_URL || "https://example.com";

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

export default async function FeedPage() {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);

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

      <nav aria-label={t("feed.filterAll")}>
        <CategoryFilter />
      </nav>

      <section
        id="stories"
        aria-label={t("feed.title")}
        className="mx-auto max-w-7xl px-4 sm:px-6 py-10"
      >
        <FeedClient />
      </section>
    </>
  );
}
