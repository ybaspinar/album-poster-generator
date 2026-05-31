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
    const preset = getExportPreset("a4-portrait");

    await exportElementAsPng(element, preset, "poster.png");

    const { toPng } = await import("html-to-image");
    expect(toPng).toHaveBeenCalledWith(element, {
      cacheBust: false,
      pixelRatio: 1,
      width: 2480,
      height: 3508,
      style: {
        width: "2480px",
        height: "3508px",
      },
    });
    expect(anchorClicks).toEqual(["clicked"]);
    createElement.mockRestore();
  });
});
