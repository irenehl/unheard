import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { SubmitForm } from "@/components/SubmitForm";

export default async function SubmitPage() {
  const [t, tNav, locale] = await Promise.all([
    getTranslations("submit"),
    getTranslations("nav"),
    getLocale(),
  ]);

  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href={`/${locale}`}
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← {tNav("home")}
      </Link>

      <h1
        className="font-serif text-4xl font-semibold text-foreground mb-8"
        style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
      >
        {t("title")}
      </h1>

      <SubmitForm />
    </main>
  );
}
