import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processTestimony } from "@/lib/openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, category, text, authorName, isAnonymous } = body;

    if (
      !type ||
      !VALID_TYPES.includes(type as ValidType) ||
      !category ||
      !VALID_CATEGORIES.includes(category as ValidCategory) ||
      typeof text !== "string" ||
      text.trim().length === 0
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Run all three OpenAI steps — only proceed once all complete
    const { originalLanguage, editedText, translatedText } =
      await processTestimony(text.trim());

    // Single atomic Convex mutation — never partial
    const id = await convex.mutation(api.testimonies.create, {
      type: type as ValidType,
      category: category as ValidCategory,
      authorId: userId,
      authorName: authorName ?? undefined,
      isAnonymous: Boolean(isAnonymous),
      originalText: text.trim(),
      originalLanguage,
      editedText,
      translatedText,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
