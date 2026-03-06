import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processTestimony } from "@/lib/openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { validateImageFile } from "@/lib/imageUpload";
import { getNormalizedConvexUrl } from "@/lib/convexUrl";

const convex = new ConvexHttpClient(getNormalizedConvexUrl());

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

function parseOptionalField(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const type = formData.get("type");
    const category = formData.get("category");
    const text = formData.get("text");
    const authorNameRaw = formData.get("authorName");
    const isAnonymous = formData.get("isAnonymous") === "true";
    const authorName = parseOptionalField(authorNameRaw);
    const subjectName = parseOptionalField(formData.get("subjectName"));
    const subjectProfession = parseOptionalField(formData.get("subjectProfession"));
    const subjectCountry = parseOptionalField(formData.get("subjectCountry"));
    const authorProfession = parseOptionalField(formData.get("authorProfession"));
    const authorCountry = parseOptionalField(formData.get("authorCountry"));

    const photo = formData.get("photo");

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

    let photoStorageId: Id<"_storage"> | undefined;
    if (photo instanceof File) {
      const fileError = validateImageFile(photo);
      if (fileError === "size") {
        return NextResponse.json({ error: "File too large" }, { status: 400 });
      }
      if (fileError === "type") {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
      }

      const uploadUrl = await convex.mutation(api.testimonies.generateUploadUrl, {});
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photo.type },
        body: await photo.arrayBuffer(),
      });
      if (!uploadRes.ok) {
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
      }

      const uploaded = (await uploadRes.json()) as { storageId: string };
      photoStorageId = uploaded.storageId as Id<"_storage">;
    }

    // Run all three OpenAI steps — only proceed once all complete
    const { originalLanguage, editedText, translatedText } =
      await processTestimony(text.trim());

    // Single atomic Convex mutation — never partial
    const id = await convex.mutation(api.testimonies.create, {
      type: type as ValidType,
      category: category as ValidCategory,
      authorId: userId,
      authorName,
      isAnonymous,
      originalText: text.trim(),
      originalLanguage,
      editedText,
      translatedText,
      photoStorageId,
      subjectName,
      subjectProfession,
      subjectCountry,
      authorProfession,
      authorCountry,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
