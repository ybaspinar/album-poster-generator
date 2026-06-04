import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportElementAsPng } from "./png";
import { getExportPreset } from "./presets";

vi.mock("html-to-image", () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(["abc"], { type: "image/png" })),
}));

const appendChild = vi.spyOn(document.body, "appendChild");
const removeChild = vi.spyOn(document.body, "removeChild");

beforeEach(() => {
  appendChild.mockClear();
  removeChild.mockClear();
});

function createMockElement(): HTMLElement {
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
  return element;
}

describe("exportElementAsPng", () => {
  it("exports an element with preset dimensions and downloads the result", async () => {
    const anchorClicks: string[] = [];
    const createdAnchors: HTMLAnchorElement[] = [];
    const createElement = vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tagName,
      ) as HTMLElement;
      if (tagName === "a") {
        const anchor = element as unknown as HTMLAnchorElement;
        Object.defineProperty(anchor, "click", {
          value: () => anchorClicks.push("clicked"),
        });
        createdAnchors.push(anchor);
      }
      return element as never;
    });

    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    );

    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const element = createMockElement();
    const preset = getExportPreset("a4-portrait");

    await exportElementAsPng(element, preset, "poster.png");

    const { toBlob } = await import("html-to-image");
    expect(toBlob).toHaveBeenCalledWith(element, {
      cacheBust: true,
      pixelRatio: 1,
      width: 720,
      height: 1018,
      canvasWidth: 2480,
      canvasHeight: 3508,
    });
    expect(anchorClicks).toEqual(["clicked"]);
    expect(createdAnchors[0].download).toBe("poster.png");
    expect(revokeSpy).toHaveBeenCalledOnce();

    createElement.mockRestore();
    revokeSpy.mockRestore();
  });

  it("opens the image in a new tab on iOS because the download attribute is not supported", async () => {
    const anchorClicks: string[] = [];
    const createdAnchors: HTMLAnchorElement[] = [];
    const createElement = vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tagName,
      ) as HTMLElement;
      if (tagName === "a") {
        const anchor = element as unknown as HTMLAnchorElement;
        Object.defineProperty(anchor, "click", {
          value: () => anchorClicks.push("clicked"),
        });
        createdAnchors.push(anchor);
      }
      return element as never;
    });

    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    );

    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const element = createMockElement();
    const preset = getExportPreset("a4-portrait");

    await exportElementAsPng(element, preset, "poster.png");

    expect(anchorClicks).toEqual(["clicked"]);
    expect(createdAnchors[0].target).toBe("_blank");
    expect(createdAnchors[0].download).toBe("");
    expect(revokeSpy).not.toHaveBeenCalled();

    createElement.mockRestore();
    revokeSpy.mockRestore();
  });

  it("throws when the canvas produces an empty image", async () => {
    const { toBlob } = await import("html-to-image");
    vi.mocked(toBlob).mockResolvedValueOnce(null);

    const element = createMockElement();
    const preset = getExportPreset("a4-portrait");

    await expect(exportElementAsPng(element, preset, "poster.png")).rejects.toThrow(
      "PNG export failed: canvas produced an empty image.",
    );
  });
});
