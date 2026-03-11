import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { EditForm } from "@/components/EditForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/${locale}/submit`);
  }

  const testimony = await fetchQuery(api.testimonies.getById, {
    id: id as Id<"testimonies">,
  });

  if (!testimony || testimony.status !== "published") {
    notFound();
  }

  if (testimony.authorId !== userId) {
    notFound();
  }

  const ageMs = Date.now() - testimony.createdAt;
  if (ageMs >= 86_400_000) {
    redirect(`/${locale}/story/${id}`);
  }

  const t = await getTranslations("submit");
  const tNav = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 md:py-24">
      <Link
        href={`/${locale}/story/${id}`}
        className="mb-12 inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-all hover:-translate-x-1"
      >
        ← {tNav("home")}
      </Link>

      <header className="mb-16 border-b border-border pb-10">
        <h1
          className="text-foreground leading-tight"
          style={{
            fontFamily: "var(--font-display), var(--font-serif), Georgia, serif",
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
          }}
        >
          {t("title")}
        </h1>
      </header>

      <EditForm
        testimonyId={id}
        locale={locale}
        initialCategory={testimony.category}
        initialText={testimony.originalText}
        initialMarkdown={testimony.originalMarkdown}
        initialPhotoUrl={testimony.photoUrl}
        initialSubjectName={testimony.subjectName}
        initialSubjectProfession={testimony.subjectProfession}
        initialSubjectCountry={testimony.subjectCountry}
        initialAuthorProfession={testimony.authorProfession}
        initialAuthorCountry={testimony.authorCountry}
        isHonor={testimony.type === "honor"}
        isAnonymous={testimony.isAnonymous}
      />
    </div>
  );
}
