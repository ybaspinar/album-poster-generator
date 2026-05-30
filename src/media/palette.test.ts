import { describe, expect, it, vi } from "vitest";
import { defaultPalette } from "../domain/album";
import { extractPaletteFromImage, quantizePixelsToPalette, rgbToHex } from "./palette";

describe("palette helpers", () => {
  it("converts RGB values to hex", () => {
    expect(rgbToHex(242, 140, 40)).toBe("#f28c28");
  });

  it("quantizes pixels into up to six stable colors", () => {
    const pixels = new Uint8ClampedArray([
      242, 140, 40, 255, 242, 140, 40, 255, 192, 36, 101, 255, 33, 136, 155, 255, 23, 36, 92, 255,
      255, 255, 255, 0,
    ]);

    expect(quantizePixelsToPalette(pixels)).toEqual(["#f48c28", "#c02464", "#20889c", "#18245c"]);
  });

  it("returns a cloned default palette when canvas context is unavailable", async () => {
    const originalImage = globalThis.Image;
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "canvas") {
        return { getContext: () => null } as unknown as HTMLCanvasElement;
      }

      return originalCreateElement(tagName);
    });

    globalThis.Image = class extends EventTarget {
      set crossOrigin(_value: string) {}

      set src(_value: string) {
        this.dispatchEvent(new Event("load"));
      }
    } as unknown as typeof Image;

    try {
      const palette = await extractPaletteFromImage("blob:test");

      expect(palette).toEqual(defaultPalette);
      expect(palette).not.toBe(defaultPalette);
    } finally {
      globalThis.Image = originalImage;
      createElement.mockRestore();
    }
  });
});
