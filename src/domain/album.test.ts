import { describe, expect, it } from "vitest";
import { createAlbumDraft, createEmptyAlbumDraft, normalizeAlbumText } from "./album";

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
      source: "manual",
      sourceId: "",
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
});
