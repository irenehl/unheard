import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string | null)?.trim();
    const profession = (formData.get("profession") as string | null)?.trim();
    const country = (formData.get("country") as string | null)?.trim();

    if (!file || !name || !profession || !country) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Get a one-time upload URL from Convex storage
    const uploadUrl = await convex.mutation(api.profiles.generateUploadUrl, {});

    // Stream file to Convex storage
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: await file.arrayBuffer(),
    });
    if (!uploadRes.ok) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { storageId } = (await uploadRes.json()) as { storageId: string };

    const id = await convex.mutation(api.profiles.create, {
      storageId: storageId as Id<"_storage">,
      name,
      profession,
      country,
      submittedBy: userId,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
