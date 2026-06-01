import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAlbumStore } from "./album";

const backgroundPreferenceKey = "album-poster-generator:background";
const layoutPreferenceKey = "album-poster-generator:layout";
const exportPresetPreferenceKey = "album-poster-generator:export-preset";
const swatchesPreferenceKey = "album-poster-generator:swatches";

describe("album store background preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("restores saved background mode and blur amount for the next session", () => {
    localStorage.setItem(
      backgroundPreferenceKey,
      JSON.stringify({
        mode: "artwork",
        solidColor: "#111111",
        gradientFrom: "#222222",
        gradientTo: "#333333",
        gradientDirection: "radial",
        blur: true,
        blurAmount: 6,
      }),
    );

    const store = useAlbumStore();

    expect(store.draft.backgroundMode).toBe("artwork");
    expect(store.draft.backgroundBlur).toBe(true);
    expect(store.draft.backgroundBlurAmount).toBe(6);
  });

  it("persists background mode and blur amount changes", () => {
    const store = useAlbumStore();

    store.patchDraft({ backgroundMode: "artwork", backgroundBlurAmount: 4 });

    expect(JSON.parse(localStorage.getItem(backgroundPreferenceKey) ?? "{}")).toMatchObject({
      mode: "artwork",
      blurAmount: 4,
    });
  });
});

describe("album store poster preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("restores saved layout export preset and swatch visibility for the next session", () => {
    localStorage.setItem(layoutPreferenceKey, "large");
    localStorage.setItem(exportPresetPreferenceKey, "square");
    localStorage.setItem(swatchesPreferenceKey, JSON.stringify({ show: false, shape: "circle" }));

    const store = useAlbumStore();

    expect(store.draft.layout).toBe("large");
    expect(store.selectedPresetId).toBe("square");
    expect(store.draft.showSwatches).toBe(false);
    expect(store.draft.swatchShape).toBe("circle");
  });

  it("persists export preset and swatch changes", () => {
    const store = useAlbumStore();

    store.setPreset("poster-12x18");
    store.patchDraft({ showSwatches: false, swatchShape: "circle" });

    expect(localStorage.getItem(exportPresetPreferenceKey)).toBe("poster-12x18");
    expect(JSON.parse(localStorage.getItem(swatchesPreferenceKey) ?? "{}")).toEqual({
      show: false,
      shape: "circle",
    });
  });
});
