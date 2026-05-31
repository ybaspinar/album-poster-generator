import { describe, expect, it } from "vitest";
import { createExportFilename, exportPresets, getExportPreset } from "./presets";

describe("export presets", () => {
  it("defines initial print presets at 300 DPI", () => {
    expect(exportPresets.map((preset) => preset.id)).toEqual([
      "a4-portrait",
      "a3-portrait",
      "poster-12x18",
      "poster-50x70cm",
      "poster-40x60cm",
      "poster-30x40cm",
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
    expect(getExportPreset("poster-50x70cm")).toMatchObject({
      label: "50×70 cm Poster",
      widthPx: 5906,
      heightPx: 8268,
      dpi: 300,
      filenameSuffix: "50x70cm",
    });
    expect(getExportPreset("poster-40x60cm")).toMatchObject({
      label: "40×60 cm Poster",
      widthPx: 4724,
      heightPx: 7087,
      dpi: 300,
      filenameSuffix: "40x60cm",
    });
    expect(getExportPreset("poster-30x40cm")).toMatchObject({
      label: "30×40 cm Poster",
      widthPx: 3543,
      heightPx: 4724,
      dpi: 300,
      filenameSuffix: "30x40cm",
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
    expect(
      createExportFilename(
        "Kanye West & Kid Cudi",
        "Kids See Ghosts",
        getExportPreset("poster-50x70cm"),
      ),
    ).toBe("kanye-west-kid-cudi-kids-see-ghosts-50x70cm.png");
  });
});
