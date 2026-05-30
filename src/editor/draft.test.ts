import { describe, expect, it } from "vitest";
import { createAlbumDraft } from "../domain/album";
import { applyDraftPatch, createPosterMetadataLine, mergeFetchedAlbum } from "./draft";

describe("draft editing helpers", () => {
  it("merges fetched album data into a new draft", () => {
    const draft = mergeFetchedAlbum(createAlbumDraft({ title: "Old" }), {
      title: "Kids See Ghosts",
      artist: "Kanye West & Kid Cudi",
      releaseDate: "2018-06-08",
      source: "musicbrainz",
      sourceId: "rg-1",
    });

    expect(draft.title).toBe("Kids See Ghosts");
    expect(draft.artist).toBe("Kanye West & Kid Cudi");
    expect(draft.releaseDate).toBe("2018-06-08");
    expect(draft.source).toBe("musicbrainz");
    expect(draft.sourceId).toBe("rg-1");
  });

  it("applies manual overrides without mutating the previous draft", () => {
    const original = createAlbumDraft({ title: "Fetched", artist: "Artist" });
    const edited = applyDraftPatch(original, { title: "My Version" });

    expect(original.title).toBe("Fetched");
    expect(edited.title).toBe("My Version");
    expect(edited.artist).toBe("Artist");
  });

  it("creates a readable metadata line", () => {
    expect(createPosterMetadataLine("2018-06-08", "Kanye West & Kid Cudi")).toBe(
      "Released: June 8, 2018 · Kanye West & Kid Cudi",
    );
  });
});
