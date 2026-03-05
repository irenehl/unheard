"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");
  const shouldReduceMotion = useShouldReduceMotion();

  function switchTo(next: "es" | "en") {
    const withoutLocale = pathname.replace(/^\/(es|en)/, "") || "/";
    router.push(`/${next}${withoutLocale}`);
  }

  return (
    <div
      className="flex items-center gap-0.5 font-mono text-[0.6rem] tracking-[0.2em]"
      aria-label={t("language")}
    >
      {(["es", "en"] as const).map((lang, i) => (
        <span key={lang} className="flex items-center">
          {i > 0 && (
            <span className="mx-1 select-none text-border" aria-hidden>
              /
            </span>
          )}
          <motion.button
            onClick={() => switchTo(lang)}
            aria-pressed={locale === lang}
            className={`uppercase transition-colors ${
              locale === lang
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.85, opacity: 0.7 }}
            transition={{ duration: 0.1 }}
          >
            {lang}
          </motion.button>
        </span>
      ))}
    </div>
  );
}
