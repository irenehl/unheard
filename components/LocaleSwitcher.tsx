"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: "es" | "en") {
    // Replace the leading locale segment in the pathname
    const withoutLocale = pathname.replace(/^\/(es|en)/, "") || "/";
    router.push(`/${next}${withoutLocale}`);
  }

  return (
    <div className="flex items-center gap-1 text-sm" aria-label="Idioma">
      {(["es", "en"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => switchTo(lang)}
          aria-pressed={locale === lang}
          className={`px-2 py-1 rounded uppercase tracking-wide font-medium transition-colors ${
            locale === lang
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
