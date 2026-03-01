import { useTranslations } from "next-intl";
import { CategoryFilter } from "@/components/CategoryFilter";
import { FeedClient } from "@/components/FeedClient";

export default function FeedPage() {
  const t = useTranslations("feed");

  return (
    <main id="main-content">
      {/* Hero */}
      <header
        role="banner"
        className="py-16 px-4 text-center border-b border-border"
      >
        <h1
          className="font-serif text-6xl font-semibold tracking-tight text-foreground sm:text-7xl"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
          {t("tagline")}
        </p>
      </header>

      {/* Sticky filters */}
      <nav aria-label="Filtros">
        <CategoryFilter />
      </nav>

      {/* Feed */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <FeedClient />
      </div>
    </main>
  );
}
