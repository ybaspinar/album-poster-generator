import { describe, expect, it } from "vitest";
import { createAlbumDraft } from "./album";
import { applyPosterModel, posterModels } from "./poster-models";

describe("poster models", () => {
  it("defines two selectable creator models with stable labels", () => {
    expect(posterModels.map((model) => [model.id, model.label])).toEqual([
      ["clean", "Clean"],
      ["atmosphere", "Atmosphere"],
    ]);
  });

  it("applies model settings without replacing album identity or metadata", () => {
    const draft = createAlbumDraft({
      id: "draft-1",
      title: "Starboy",
      artist: "The Weeknd",
      releaseDate: "2016-11-25",
      tracklist: ["Starboy"],
    });

    const modelled = applyPosterModel(draft, "atmosphere");

    expect(modelled.id).toBe("draft-1");
    expect(modelled.title).toBe("Starboy");
    expect(modelled.artist).toBe("The Weeknd");
    expect(modelled.backgroundMode).toBe("artwork");
    expect(modelled.layout).toBe("large");
  });

  it("falls back to the clean model for unknown ids", () => {
    const draft = createAlbumDraft({ id: "draft-2", layout: "large" });

    const modelled = applyPosterModel(draft, "missing");

    expect(modelled.id).toBe("draft-2");
    expect(modelled.layout).toBe("medium");
    expect(modelled.backgroundMode).toBe("default");
  });
});
