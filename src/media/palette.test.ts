import { describe, expect, it } from "vitest";
import { quantizePixelsToPalette, rgbToHex } from "./palette";

describe("palette helpers", () => {
  it("converts RGB values to hex", () => {
    expect(rgbToHex(242, 140, 40)).toBe("#f28c28");
  });

  it("quantizes pixels into up to six stable colors", () => {
    const pixels = new Uint8ClampedArray([
      242, 140, 40, 255, 242, 140, 40, 255, 192, 36, 101, 255, 33, 136, 155, 255, 23, 36, 92, 255,
      255, 255, 255, 0,
    ]);

    expect(quantizePixelsToPalette(pixels)).toEqual(["#f08c28", "#c02468", "#20889c", "#18245c"]);
  });
});
