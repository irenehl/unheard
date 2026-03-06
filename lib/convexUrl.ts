export function getNormalizedConvexUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!rawUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
  }

  // Convex clients append API paths; strip trailing slashes to avoid `//api/...`.
  return rawUrl.replace(/\/+$/, "");
}
