import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processTestimony } from "@/lib/openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { validateImageFile } from "@/lib/imageUpload";
import { getNormalizedConvexUrl } from "@/lib/convexUrl";

const convex = new ConvexHttpClient(getNormalizedConvexUrl());

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
type PhotoAction = "keep" | "replace" | "remove";

function parseOptionalField(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const formData = await req.formData();
    const category = formData.get("category");
    const text = formData.get("text");
    const photoAction = (formData.get("photoAction") as PhotoAction | null) ?? "keep";
    const photo = formData.get("photo");
    const subjectName = parseOptionalField(formData.get("subjectName"));
    const subjectProfession = parseOptionalField(formData.get("subjectProfession"));
    const subjectCountry = parseOptionalField(formData.get("subjectCountry"));
    const authorProfession = parseOptionalField(formData.get("authorProfession"));
    const authorCountry = parseOptionalField(formData.get("authorCountry"));

    if (
      !category ||
      !VALID_CATEGORIES.includes(category as ValidCategory) ||
      typeof text !== "string" ||
      text.trim().length === 0 ||
      !["keep", "replace", "remove"].includes(photoAction)
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    let photoStorageId: Id<"_storage"> | undefined;
    if (photoAction === "replace") {
      if (!(photo instanceof File)) {
        return NextResponse.json({ error: "Missing photo" }, { status: 400 });
      }

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
      photoAction,
      photoStorageId,
      subjectName,
      subjectProfession,
      subjectCountry,
      authorProfession,
      authorCountry,
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
