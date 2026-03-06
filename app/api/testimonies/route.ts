import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const VALID_TYPES = ["honor", "tell"] as const;
const VALID_CATEGORIES = [
  "work",
  "family",
  "health",
  "love",
  "money",
  "education",
  "courage",
] as const;

type ValidType = (typeof VALID_TYPES)[number];
type ValidCategory = (typeof VALID_CATEGORIES)[number];

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const type = params.get("type");
    const category = params.get("category");
    const locale = params.get("locale");
    const cursor = params.get("cursor");
    const numItemsParam = params.get("numItems");

    const parsedNumItems = Number(numItemsParam ?? "20");
    const numItems =
      Number.isFinite(parsedNumItems) && parsedNumItems > 0 && parsedNumItems <= 50
        ? Math.floor(parsedNumItems)
        : 20;

    if (!locale) {
      return NextResponse.json({ error: "Missing locale" }, { status: 400 });
    }

    if (type && !VALID_TYPES.includes(type as ValidType)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (category && !VALID_CATEGORIES.includes(category as ValidCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const page = await fetchQuery(api.testimonies.listFeed, {
      type: (type as ValidType | null) ?? undefined,
      category: (category as ValidCategory | null) ?? undefined,
      locale,
      paginationOpts: {
        numItems,
        cursor: cursor === null || cursor === "" ? null : cursor,
      },
    });

    return NextResponse.json(page, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
