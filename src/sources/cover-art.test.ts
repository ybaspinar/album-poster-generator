import { describe, expect, it, vi } from "vitest";
import { findCoverArt } from "./cover-art";

describe("findCoverArt", () => {
  it("fetches release group artwork through the mb-proxy", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        artworkUrl: "https://example.com/front.jpg",
        thumbnails: { large: "https://example.com/front-large.jpg" },
      }),
    );

    await expect(findCoverArt("rg-1", fetcher)).resolves.toEqual({
      artworkUrl: "https://example.com/front-large.jpg",
      artworkSource: "cover-art-archive",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://mb-proxy.ybaspinar.dev/release-group/rg-1/cover",
      {
        headers: { Accept: "application/json" },
      },
    );
  });

  it("returns an empty result when the proxy has no art", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ artworkUrl: "", thumbnails: {} }));

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

  it("caches successful lookups and skips re-fetching the same ID", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        artworkUrl: "https://example.com/front.jpg",
        thumbnails: { large: "https://example.com/front-large.jpg" },
      }),
    );
    const first = await findCoverArt("rg-cache", fetcher);
    expect(first.artworkUrl).toBe("https://example.com/front-large.jpg");
    expect(fetcher).toHaveBeenCalledTimes(1);
    const second = await findCoverArt("rg-cache", fetcher);
    expect(second).toEqual(first);
    expect(fetcher).toHaveBeenCalledTimes(1); // not called again
  });
});
