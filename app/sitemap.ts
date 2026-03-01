import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL || "https://example.com";

  const entries: MetadataRoute.Sitemap = [];

  // Add main pages for each locale
  for (const locale of routing.locales) {
    // Home/feed page
    entries.push({
      url: `${siteUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    });

    // Submit page
    entries.push({
      url: `${siteUrl}/${locale}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  // Add recent story pages (most recent 100 published testimonies)
  try {
    const recentStories = await fetchQuery(api.testimonies.list, {
      paginationOpts: {
        numItems: 100,
        cursor: null,
      },
    });

    for (const testimony of recentStories.page) {
      if (testimony.status === "published") {
        // Add story page for each locale
        for (const locale of routing.locales) {
          entries.push({
            url: `${siteUrl}/${locale}/story/${testimony._id}`,
            lastModified: new Date(testimony.createdAt),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
  } catch (error) {
    // If Convex query fails, continue without story pages
    console.error("Failed to fetch stories for sitemap:", error);
  }

  return entries;
}
