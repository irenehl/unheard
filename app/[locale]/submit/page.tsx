import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { SubmitForm } from "@/components/SubmitForm";
import { buildLocaleAlternates, buildPath, getSiteUrl } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Load translations for the submit namespace
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const submitMessages = messages.submit as {
    title: string;
    intro: string;
  };

  const siteUrl = getSiteUrl();
  const pagePath = buildPath(locale, "/submit");
  const defaultOgImage = `${siteUrl}/opengraph-image`;
  const defaultTwitterImage = `${siteUrl}/twitter-image`;

  return {
    title: submitMessages.title,
    description: submitMessages.intro,
    alternates: {
      canonical: `${siteUrl}${pagePath}`,
      languages: buildLocaleAlternates("/submit"),
    },
    openGraph: {
      type: "website",
      siteName: "Ellas",
      title: submitMessages.title,
      description: submitMessages.intro,
      url: `${siteUrl}${pagePath}`,
      locale: locale,
      images: [{ url: defaultOgImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: submitMessages.title,
      description: submitMessages.intro,
      images: [defaultTwitterImage],
    },
  };
}

export default async function SubmitPage() {
  const [t, tNav, locale] = await Promise.all([
    getTranslations("submit"),
    getTranslations("nav"),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 md:py-24">
      <Link
        href={`/${locale}`}
        className="mb-12 inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-all hover:-translate-x-1"
      >
        ← {tNav("home")}
      </Link>

      <header className="mb-16 border-b border-border pb-10">
        <p className="mb-6 font-mono text-[0.65rem] tracking-[0.3em] uppercase text-muted-foreground">
          {t("intro").split(".")[0]}.
        </p>
        <h1
          className="text-foreground leading-tight"
          style={{
            fontFamily:
              "var(--font-display), var(--font-serif), Georgia, serif",
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
          }}
        >
          {t("title")}
        </h1>
      </header>

      <SubmitForm />
    </div>
  );
}
