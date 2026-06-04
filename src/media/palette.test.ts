import { describe, expect, it, vi } from "vitest";
import { defaultPalette } from "../domain/album";
import { extractPaletteFromImage } from "./palette";

vi.mock("extract-colors", () => ({
  extractColors: vi
    .fn()
    .mockResolvedValue([{ hex: "#ff0000" }, { hex: "#00ff00" }, { hex: "#0000ff" }]),
}));

describe("palette helpers", () => {
  it("extracts palette colors from image using extract-colors library", async () => {
    const palette = await extractPaletteFromImage("https://example.com/cover-a.jpg");
    expect(palette).toContain("#ff0000");
    expect(palette).toContain("#00ff00");
    expect(palette).toContain("#0000ff");
    expect(new Set(palette).size).toBe(palette.length);
  });

  it("returns a cloned default palette on extract-colors failure", async () => {
    const { extractColors } = await import("extract-colors");
    vi.mocked(extractColors).mockRejectedValueOnce(new Error("Network error"));

    const palette = await extractPaletteFromImage("https://example.com/cover-b.jpg");
    expect(palette).toEqual(defaultPalette);
    expect(palette).not.toBe(defaultPalette);
  });

  it("caches extracted palettes and skips re-processing the same URL", async () => {
    const { extractColors } = await import("extract-colors");
    vi.mocked(extractColors).mockClear();

    const first = await extractPaletteFromImage("https://example.com/cover-c.jpg");
    expect(extractColors).toHaveBeenCalledTimes(1);

    const second = await extractPaletteFromImage("https://example.com/cover-c.jpg");
    expect(second).toEqual(first);
    expect(extractColors).toHaveBeenCalledTimes(1);
  });
});
