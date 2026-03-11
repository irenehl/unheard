import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unheard.dhuezo.dev/en";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/es/admin", "/en/admin", "/admin"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
