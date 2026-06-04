import { describe, expect, it } from "vitest";
import {
  createAlbumDraft,
  createEmptyAlbumDraft,
  defaultTypography,
  normalizeAlbumText,
} from "./album";

describe("album draft model", () => {
  it("creates an empty editable draft", () => {
    expect(createEmptyAlbumDraft()).toEqual({
      id: expect.stringMatching(/^draft-/),
      title: "",
      artist: "",
      releaseDate: "",
      metadataLine: "",
      artworkUrl: "",
      artworkSource: "manual",
      palette: ["#f28c28", "#c02465", "#f4a35d", "#a98cbd", "#21889b", "#17245c"],
      tracklist: [],
      showTracklist: true,
      tracklistColumns: "3",
      tracklistSize: "medium",
      showSwatches: true,
      swatchShape: "square",
      source: "manual",
      sourceId: "",
      font: "gotham",
      layout: "medium",
      backgroundMode: "default",
      backgroundSolidColor: "#1a1a2e",
      backgroundGradientFrom: "#1a1a2e",
      backgroundGradientTo: "#16213e",
      backgroundGradientDirection: "vertical",
      backgroundBlur: false,
      backgroundBlurAmount: 10,
      typography: defaultTypography,
    });
  });

  it("normalizes noisy text fields", () => {
    expect(normalizeAlbumText("  Kids   See\nGhosts  ")).toBe("Kids See Ghosts");
  });

  it("applies provided values while preserving defaults", () => {
    const draft = createAlbumDraft({ title: "Graduation", artist: "Kanye West" });

    expect(draft.title).toBe("Graduation");
    expect(draft.artist).toBe("Kanye West");
    expect(draft.palette).toHaveLength(6);
    expect(draft.source).toBe("manual");
  });

  it("defaults to an empty medium three-column tracklist", () => {
    const draft = createAlbumDraft();

    expect(draft.tracklist).toEqual([]);
    expect(draft.showTracklist).toBe(true);
    expect(draft.tracklistColumns).toBe("3");
    expect(draft.tracklistSize).toBe("medium");
  });

  it("supports tracklist layout customization", () => {
    const draft = createAlbumDraft({ tracklistColumns: "2", tracklistSize: "small" });

    expect(draft.tracklistColumns).toBe("2");
    expect(draft.tracklistSize).toBe("small");
  });

  it("shows square swatches by default and supports hiding circular swatches", () => {
    const defaultDraft = createAlbumDraft();
    const customizedDraft = createAlbumDraft({ showSwatches: false, swatchShape: "circle" });

    expect(defaultDraft.showSwatches).toBe(true);
    expect(defaultDraft.swatchShape).toBe("square");
    expect(customizedDraft.showSwatches).toBe(false);
    expect(customizedDraft.swatchShape).toBe("circle");
  });

  it("normalizes tracklist entries", () => {
    const draft = createAlbumDraft({
      tracklist: ["  Foo  ", "", "  Xox", "\t", "Last Song  "],
    });

    expect(draft.tracklist).toEqual(["Foo", "Xox", "Last Song"]);
  });

  it("creates default per-section typography settings", () => {
    expect(createAlbumDraft().typography).toEqual({
      title: {
        color: "#111111",
        size: 48,
        weight: 700,
        italic: false,
        uppercase: true,
      },
      artist: {
        color: "#111111",
        size: 16,
        weight: 400,
        italic: false,
        uppercase: true,
      },
      metadata: {
        color: "#111111",
        size: 13,
        weight: 400,
        italic: false,
        uppercase: true,
      },
      tracklist: {
        color: "#6f6a60",
        size: 11,
        weight: 400,
        italic: false,
        uppercase: true,
      },
    });
  });

  it("normalizes typography overrides", () => {
    const draft = createAlbumDraft({
      typography: {
        title: {
          color: "#abcdef",
          size: 96,
          weight: 900,
          italic: true,
          uppercase: false,
        },
        artist: {
          color: "bad",
          size: 200,
          weight: 123 as never,
          italic: true,
          uppercase: false,
        },
      },
    });

    expect(draft.typography.title).toEqual({
      color: "#abcdef",
      size: 96,
      weight: 900,
      italic: true,
      uppercase: false,
    });
    expect(draft.typography.artist).toEqual({
      color: "#111111",
      size: 96,
      weight: 400,
      italic: true,
      uppercase: false,
    });
  });
});
