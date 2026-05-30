export interface ValidationResult {
  ok: boolean;
  message: string;
}

const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxArtworkBytes = 15 * 1024 * 1024;

export function validateArtworkFile(file: File): ValidationResult {
  if (!acceptedTypes.has(file.type)) {
    return { ok: false, message: "Choose a PNG, JPEG, or WebP image." };
  }

  if (file.size > maxArtworkBytes) {
    return { ok: false, message: "Choose an image smaller than 15 MB." };
  }

  return { ok: true, message: "" };
}

export function createArtworkObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}
