import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportElementAsPng } from "./png";
import { getExportPreset } from "./presets";

vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
}));

const appendChild = vi.spyOn(document.body, "appendChild");
const removeChild = vi.spyOn(document.body, "removeChild");

beforeEach(() => {
  appendChild.mockClear();
  removeChild.mockClear();
});

describe("exportElementAsPng", () => {
  it("exports an element with preset dimensions and downloads the result", async () => {
    const anchorClicks: string[] = [];
    const createElement = vi.spyOn(document, "createElement");
    createElement.mockImplementation((tagName: string) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tagName,
      ) as HTMLElement;
      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          value: () => anchorClicks.push("clicked"),
        });
      }
      return element as never;
    });

    const element = document.createElement("article");
    Object.defineProperties(element, {
      offsetWidth: { value: 720 },
      offsetHeight: { value: 1018 },
    });
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 180,
      bottom: 254.5,
      left: 0,
      width: 180,
      height: 254.5,
      toJSON: () => ({}),
    });
    const preset = getExportPreset("a4-portrait");

    await exportElementAsPng(element, preset, "poster.png");

    const { toPng } = await import("html-to-image");
    expect(toPng).toHaveBeenCalledWith(element, {
      cacheBust: false,
      pixelRatio: 1,
      width: 720,
      height: 1018,
      canvasWidth: 2480,
      canvasHeight: 3508,
    });
    expect(anchorClicks).toEqual(["clicked"]);
    createElement.mockRestore();
  });
});
