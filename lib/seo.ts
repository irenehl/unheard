import { routing } from "@/i18n/routing";

export const DEFAULT_SITE_URL = "https://example.com";

export function getSiteUrl() {
  return (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function buildPath(locale: string, suffix = "") {
  const normalizedSuffix = suffix.startsWith("/") ? suffix : `/${suffix}`;
  const safeSuffix = normalizedSuffix === "/" ? "" : normalizedSuffix;
  return `/${locale}${safeSuffix}`;
}

export function buildLocaleAlternates(suffix = "") {
  const siteUrl = getSiteUrl();
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = `${siteUrl}${buildPath(locale, suffix)}`;
  }

  languages["x-default"] = `${siteUrl}${buildPath(routing.defaultLocale, suffix)}`;
  return languages;
}
