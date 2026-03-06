export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024; // 5 MB

export type ImageValidationError = "missing" | "size" | "type";

export function validateImageFile(
  file: File | null | undefined
): ImageValidationError | null {
  if (!file) return "missing";
  if (file.size > MAX_IMAGE_SIZE_BYTES) return "size";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "type";
  }
  return null;
}

