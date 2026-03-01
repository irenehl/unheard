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
