import { describe, expect, it } from "vitest";
import { createExportFilename, exportPresets, getExportPreset } from "./presets";

describe("export presets", () => {
  it("defines initial print presets at 300 DPI", () => {
    expect(exportPresets.map((preset) => preset.id)).toEqual([
      "a4-portrait",
      "a3-portrait",
      "poster-12x18",
      "square",
    ]);
    expect(getExportPreset("a4-portrait")).toMatchObject({
      widthPx: 2480,
      heightPx: 3508,
      dpi: 300,
    });
    expect(getExportPreset("a3-portrait")).toMatchObject({
      widthPx: 3508,
      heightPx: 4961,
      dpi: 300,
    });
    expect(getExportPreset("poster-12x18")).toMatchObject({
      widthPx: 3600,
      heightPx: 5400,
      dpi: 300,
    });
    expect(getExportPreset("square")).toMatchObject({
      widthPx: 3600,
      heightPx: 3600,
      dpi: 300,
    });
  });

  it("creates safe lowercase filenames", () => {
    expect(
      createExportFilename(
        "Kanye West & Kid Cudi",
        "Kids See Ghosts",
        getExportPreset("a4-portrait"),
      ),
    ).toBe("kanye-west-kid-cudi-kids-see-ghosts-a4.png");
  });
});
