import { routing } from "@/i18n/routing";

export const DEFAULT_SITE_URL = "https://unheard.dhuezo.dev/en";

export function getSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (explicitSiteUrl) return explicitSiteUrl.replace(/\/+$/, "");
  if (publicSiteUrl) return publicSiteUrl.replace(/\/+$/, "");
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, "")}`;

  return DEFAULT_SITE_URL;
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
