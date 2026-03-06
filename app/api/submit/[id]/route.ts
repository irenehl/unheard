import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processTestimony } from "@/lib/openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const VALID_CATEGORIES = [
  "work",
  "family",
  "health",
  "love",
  "money",
  "education",
  "courage",
] as const;

type ValidCategory = (typeof VALID_CATEGORIES)[number];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { category, text } = body;

    if (
      !category ||
      !VALID_CATEGORIES.includes(category as ValidCategory) ||
      typeof text !== "string" ||
      text.trim().length === 0
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { originalLanguage, editedText, translatedText } =
      await processTestimony(text.trim());

    await convex.mutation(api.testimonies.update, {
      id: id as Id<"testimonies">,
      authorId: userId,
      category: category as ValidCategory,
      originalText: text.trim(),
      originalLanguage,
      editedText,
      translatedText,
    });

    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (message === "Edit window expired") return NextResponse.json({ error: message }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await convex.mutation(api.testimonies.deleteOwn, {
      id: id as Id<"testimonies">,
      authorId: userId,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
