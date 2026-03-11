import { ImageResponse } from "next/og";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function normalizeSnippet(text: string, maxLength: number) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 3).trimEnd()}...`;
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default as Record<string, unknown>;
  const common = (messages.common ?? {}) as Record<string, string>;
  const categories = (messages.categories ?? {}) as Record<string, string>;

  const storyOf = common.storyOf ?? "A story of";
  const fallbackCategory = "Courage";
  const fallbackExcerpt = "Stories of women the world never documented. Here, they have a name, a date, and witnesses.";

  const testimony = id.startsWith("placeholder")
    ? null
    : await fetchQuery(api.testimonies.getById, { id: id as Id<"testimonies"> });

  const categoryLabel =
    (testimony?.category && categories[testimony.category]) || fallbackCategory;
  const sourceText =
    testimony?.translatedText?.[locale] || testimony?.editedText || testimony?.originalText || "";
  const excerpt = normalizeSnippet(sourceText, 180) || fallbackExcerpt;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "radial-gradient(1000px 520px at 90% 20%, #2a2a2a 0%, #111111 55%, #060606 100%)",
          color: "#f5f4f0",
          padding: "56px 68px",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0",
            background:
              "linear-gradient(140deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 36%, rgba(220,180,120,0.09) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div
              style={{
                fontSize: 28,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontFamily: "Arial, sans-serif",
                opacity: 0.85,
              }}
            >
              Ellas
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.5)",
                padding: "10px 16px",
                fontSize: 20,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "Arial, sans-serif",
              }}
            >
              {categoryLabel}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 56, lineHeight: 1.07, maxWidth: 980, fontWeight: 500 }}>
              {`${storyOf} ${categoryLabel}`}
            </div>
            <div
              style={{
                fontSize: 32,
                lineHeight: 1.3,
                maxWidth: 1020,
                opacity: 0.95,
              }}
            >
              {excerpt}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "Arial, sans-serif",
              fontSize: 18,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: 0.78,
            }}
          >
            <span>Visual Testimony Archive</span>
            <span>ellas</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
