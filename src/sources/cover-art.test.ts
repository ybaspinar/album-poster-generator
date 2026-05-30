import { describe, expect, it, vi } from "vitest";
import { findCoverArt } from "./cover-art";

describe("findCoverArt", () => {
  it("selects front artwork from Cover Art Archive images", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          images: [
            {
              front: false,
              image: "https://example.com/back.jpg",
              thumbnails: { large: "https://example.com/back-large.jpg" },
            },
            {
              front: true,
              image: "https://example.com/front.jpg",
              thumbnails: { large: "https://example.com/front-large.jpg" },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(findCoverArt("rg-1", fetcher)).resolves.toEqual({
      artworkUrl: "https://example.com/front-large.jpg",
      artworkSource: "cover-art-archive",
    });
  });

  it("returns an empty result when the archive has no art", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 404 }));

    await expect(findCoverArt("missing", fetcher)).resolves.toEqual({
      artworkUrl: "",
      artworkSource: "remote",
    });
  });

  it("throws a readable error for non-404 failures", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 500 }));

    await expect(findCoverArt("broken", fetcher)).rejects.toThrow(
      "Cover art lookup failed with status 500",
    );
  });
});
