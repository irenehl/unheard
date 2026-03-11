import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { VersionPanel } from "@/components/VersionPanel";
import { SharePopover } from "@/components/SharePopover";
import { StoryDeleteButton } from "@/components/StoryActions";
import { auth } from "@clerk/nextjs/server";
import { Heart, Mic } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import { buildLocaleAlternates, buildPath, getSiteUrl } from "@/lib/seo";

// Cache the testimony fetch to avoid double-fetching in generateMetadata and page component
const getTestimony = cache(async (id: Id<"testimonies">) => {
  return await fetchQuery(api.testimonies.getById, { id });
});

function normalizeSnippet(text: string, maxLength: number) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 3).trimEnd()}...`;
}

function extractHeadline(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  const firstSentence = compact.split(/(?<=[.!?])\s+/)[0] ?? compact;
  return normalizeSnippet(firstSentence, 90);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;

  if (id.startsWith("placeholder")) {
    return {
      title: "Story not found",
    };
  }

  const testimony = await getTestimony(id as Id<"testimonies">);

  if (!testimony || testimony.status !== "published") {
    return {
      title: "Story not found",
    };
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const t = (key: string) => {
    const keys = key.split(".");
    let value: unknown = messages;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  const categoryLabel = t(`categories.${testimony.category}`);
  const textForDescription = testimony.translatedText[locale] || testimony.editedText || testimony.originalText;
  const headline = extractHeadline(textForDescription);
  const storyTitle = headline || `${t("common.storyOf")} ${categoryLabel}`;
  const description = normalizeSnippet(textForDescription, 160);

  const siteUrl = getSiteUrl();
  const pathSuffix = `/story/${id}`;
  const pagePath = buildPath(locale, pathSuffix);
  const url = `${siteUrl}${pagePath}`;
  const generatedOgImage = `${siteUrl}${buildPath(locale, `/story/${id}/opengraph-image`)}`;
  const fallbackOgImage = testimony.photoUrl || `${siteUrl}/unheard.png`;

  return {
    title: storyTitle,
    description: description,
    alternates: {
      canonical: url,
      languages: buildLocaleAlternates(pathSuffix),
    },
    openGraph: {
      siteName: "Ellas",
      title: storyTitle,
      description: description,
      url: url,
      locale: locale,
      type: "article",
      publishedTime: new Date(testimony.createdAt).toISOString(),
      images: [
        {
          url: generatedOgImage,
          width: 1200,
          height: 630,
          alt: storyTitle,
        },
        {
          url: fallbackOgImage,
          width: 1200,
          height: 630,
          alt: storyTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: storyTitle,
      description: description,
      images: [
        {
          url: generatedOgImage,
          alt: storyTitle,
        },
      ],
    },
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [t, { userId }] = await Promise.all([getTranslations(), auth()]);

  if (id.startsWith("placeholder")) {
    notFound();
  }

  const testimony = await getTestimony(id as Id<"testimonies">);

  if (!testimony || testimony.status !== "published") {
    notFound();
  }

  const displayName = testimony.isAnonymous
    ? t("feed.anonymous")
    : testimony.authorName ?? t("feed.anonymous");

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(testimony.createdAt));

  const typeKey =
    `feed.type${testimony.type.charAt(0).toUpperCase() + testimony.type.slice(1)}` as
      | "feed.typeHonor"
      | "feed.typeTell";

  const isHonor = testimony.type === "honor";

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${buildPath(locale, `/story/${id}`)}`;
  const isOwn = userId && testimony.authorId === userId;
  const ageMs = Date.now() - testimony.createdAt;
  const canEdit = isOwn && ageMs < 86_400_000;
  const categoryLabel = t(`categories.${testimony.category}`);
  const storyTitle = `${t("common.storyOf")} ${categoryLabel}`;
  const authorName = testimony.isAnonymous
    ? t("feed.anonymous")
    : testimony.authorName ?? t("feed.anonymous");
  const shareText =
    testimony.translatedText[locale] || testimony.editedText || testimony.originalText;

  // JSON-LD structured data for Article
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: storyTitle,
    datePublished: new Date(testimony.createdAt).toISOString(),
    author: {
      "@type": "Person",
      name: authorName,
    },
    inLanguage: locale,
    url: url,
    image: testimony.photoUrl ?? undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="border-t-[3px] border-foreground mt-8 mb-12 max-w-4xl mx-auto" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-6 sm:px-8">
        <div className="flex items-center justify-between mb-12">
          <Link
            href={`/${locale}`}
            className="inline-block text-[0.625rem] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-foreground pb-0.5"
          >
            {t("common.backToFront")}
          </Link>
          <SharePopover
            testimonyId={testimony._id}
            originalText={shareText}
            locale={locale}
            storyUrl={url}
            storyTitle={storyTitle}
          />
        </div>

        <header className="mb-12 border-b border-border pb-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-foreground">
              <span className="border border-foreground px-3 py-1">
                {t(`categories.${testimony.category}`)}
              </span>
              <span className="text-muted-foreground">—</span>
              <time dateTime={new Date(testimony.createdAt).toISOString()}>
                {formattedDate}
              </time>
            </div>

            <h1 
              className="text-4xl md:text-6xl text-foreground leading-[1.1] tracking-tight"
              style={{ fontFamily: "var(--font-display), var(--font-serif), Georgia, serif" }}
            >
              <span>{t("common.storyOf")}</span>
              <span style={{ marginLeft: '0.35em' }}>{t(`categories.${testimony.category}`)}</span>
            </h1>
            
            <div className="flex items-center gap-3 text-sm font-mono tracking-widest uppercase text-muted-foreground mt-4">
              <span className={`flex items-center gap-1.5 ${isHonor ? "text-primary" : ""}`}>
                {isHonor ? (
                  <Heart className="h-3.5 w-3.5 fill-current" aria-hidden />
                ) : (
                  <Mic className="h-3.5 w-3.5" aria-hidden />
                )}
                {t(typeKey)}
              </span>
              <span>·</span>
              <span>
                {t("feed.postedBy")} <span className="text-foreground font-bold">{displayName}</span>
              </span>
            </div>
          </div>
        </header>

        {isOwn && (
          <div className="flex items-center gap-6 mb-8">
            {canEdit && (
              <Link
                href={`/${locale}/story/${id}/edit`}
                className="flex items-center gap-1.5 text-[0.625rem] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("story.edit")}
              </Link>
            )}
            <StoryDeleteButton testimonyId={id} locale={locale} />
          </div>
        )}

        {testimony.photoUrl && (
          <figure className="mb-10 overflow-hidden border border-border">
            <Image
              src={testimony.photoUrl}
              alt={t("submit.photoPreviewAlt")}
              width={1200}
              height={900}
              sizes="(max-width: 768px) 100vw, 896px"
              className="w-full h-auto max-h-[75vh] object-contain grayscale"
              priority
            />
          </figure>
        )}

        <div className="prose-lg max-w-none">
          <VersionPanel
            testimonyId={testimony._id}
            originalText={testimony.originalText}
            originalMarkdown={testimony.originalMarkdown}
            originalLanguage={testimony.originalLanguage}
            editedText={testimony.editedText}
            editedMarkdown={testimony.editedMarkdown}
            translatedText={testimony.translatedText}
            translatedMarkdown={testimony.translatedMarkdown}
            isFullPage={true}
          />
        </div>
      </article>

      <div className="border-b-[3px] border-foreground mt-20 max-w-4xl mx-auto" />
    </div>
  );
}