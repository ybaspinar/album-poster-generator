import { describe, expect, it } from "vitest";
import { validateArtworkFile } from "./image-upload";

describe("validateArtworkFile", () => {
  it("accepts common image files under the size limit", () => {
    const file = new File(["image"], "cover.png", { type: "image/png" });

    expect(validateArtworkFile(file)).toEqual({ ok: true, message: "" });
  });

  it("rejects non-image files", () => {
    const file = new File(["text"], "notes.txt", { type: "text/plain" });

    expect(validateArtworkFile(file)).toEqual({
      ok: false,
      message: "Choose a PNG, JPEG, or WebP image.",
    });
  });

  it("rejects files above 15 MB", () => {
    const file = new File([new Uint8Array(16 * 1024 * 1024)], "huge.jpg", { type: "image/jpeg" });

    expect(validateArtworkFile(file)).toEqual({
      ok: false,
      message: "Choose an image smaller than 15 MB.",
    });
  });
});
