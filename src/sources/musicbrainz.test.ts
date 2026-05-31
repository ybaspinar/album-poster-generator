import { describe, expect, it, vi } from "vitest";
import type { AlbumDraftInput } from "../domain/album";
import { createAlbumSearchCacheKey, type StorageLike } from "./album-search-cache";
import { searchMusicBrainzAlbums } from "./musicbrainz";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function createMusicBrainzResponse(): Response {
  return new Response(
    JSON.stringify({
      "release-groups": [
        {
          id: "rg-1",
          title: "Kids See Ghosts",
          "first-release-date": "2018-06-08",
          "primary-type": "Album",
          "artist-credit": [{ name: "Kanye West" }, { name: "Kid Cudi" }],
        },
      ],
    }),
    { status: 200 },
  );
}

function createCoverArtResponse(): Response {
  return new Response(
    JSON.stringify({
      images: [
        {
          front: true,
          image: "https://example.com/front-full.jpg",
          thumbnails: {
            large: "https://example.com/front-large.jpg",
            small: "https://example.com/front-small.jpg",
          },
        },
      ],
    }),
    { status: 200 },
  );
}

describe("searchMusicBrainzAlbums", () => {
  it("normalizes and enriches release group search results", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createMusicBrainzResponse())
      .mockResolvedValueOnce(createCoverArtResponse());
    const storage = new MemoryStorage();

    await expect(
      searchMusicBrainzAlbums("kids see ghosts", { fetcher, storage, now: () => 1_000 }),
    ).resolves.toEqual([
      {
        id: "rg-1",
        title: "Kids See Ghosts",
        artist: "Kanye West & Kid Cudi",
        releaseDate: "2018-06-08",
        source: "musicbrainz",
        sourceId: "rg-1",
        artworkUrl: "https://example.com/front-full.jpg",
        artworkSource: "cover-art-archive",
      },
    ]);

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://musicbrainz.org/ws/2/release-group?query=kids%20see%20ghosts&fmt=json&limit=12",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(fetcher).toHaveBeenNthCalledWith(2, "https://coverartarchive.org/release-group/rg-1", {
      headers: { Accept: "application/json" },
    });
  });

  it("returns cached results and skips network calls", async () => {
    const cachedResults: AlbumDraftInput[] = [
      {
        id: "rg-1",
        title: "Kids See Ghosts",
        artist: "Kanye West & Kid Cudi",
        releaseDate: "2018-06-08",
        source: "musicbrainz",
        sourceId: "rg-1",
        artworkUrl: "https://example.com/cached.jpg",
        artworkSource: "cover-art-archive",
      },
    ];
    const storage = new MemoryStorage();
    storage.setItem(
      createAlbumSearchCacheKey("kids see ghosts"),
      JSON.stringify({
        version: 1,
        query: "kids see ghosts",
        cachedAt: 1_000,
        results: cachedResults,
      }),
    );
    const fetcher = vi.fn();

    await expect(
      searchMusicBrainzAlbums("Kids See Ghosts", { fetcher, storage, now: () => 1_000 }),
    ).resolves.toEqual(cachedResults);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refreshes expired cached results", async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      createAlbumSearchCacheKey("kids see ghosts"),
      JSON.stringify({
        version: 1,
        query: "kids see ghosts",
        cachedAt: 1_000,
        results: [{ title: "Old cached result" }],
      }),
    );
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createMusicBrainzResponse())
      .mockResolvedValueOnce(new Response("", { status: 404 }));

    await expect(
      searchMusicBrainzAlbums("kids see ghosts", {
        fetcher,
        storage,
        now: () => 1_000 + 90 * 24 * 60 * 60 * 1000 + 1,
      }),
    ).resolves.toEqual([
      {
        id: "rg-1",
        title: "Kids See Ghosts",
        artist: "Kanye West & Kid Cudi",
        releaseDate: "2018-06-08",
        source: "musicbrainz",
        sourceId: "rg-1",
      },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("ignores malformed cached results and fetches fresh data", async () => {
    const storage = new MemoryStorage();
    storage.setItem(createAlbumSearchCacheKey("kids see ghosts"), "not-json");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createMusicBrainzResponse())
      .mockResolvedValueOnce(new Response("", { status: 404 }));

    await expect(
      searchMusicBrainzAlbums("kids see ghosts", { fetcher, storage, now: () => 1_000 }),
    ).resolves.toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("returns metadata-only results when cover art enrichment fails", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createMusicBrainzResponse())
      .mockRejectedValueOnce(new Error("network failed"));
    const storage = new MemoryStorage();

    await expect(
      searchMusicBrainzAlbums("kids see ghosts", { fetcher, storage, now: () => 1_000 }),
    ).resolves.toEqual([
      {
        id: "rg-1",
        title: "Kids See Ghosts",
        artist: "Kanye West & Kid Cudi",
        releaseDate: "2018-06-08",
        source: "musicbrainz",
        sourceId: "rg-1",
      },
    ]);
  });

  it("returns an empty list for blank queries without fetching", async () => {
    const fetcher = vi.fn();

    await expect(searchMusicBrainzAlbums("  ", { fetcher })).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("throws a readable error when MusicBrainz fails", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("rate limited", { status: 503 }));

    await expect(searchMusicBrainzAlbums("test", { fetcher })).rejects.toThrow(
      "MusicBrainz search failed with status 503",
    );
  });

  it("uses fielded query when input looks like artist - album", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            "release-groups": [
              {
                id: "rg-2",
                title: "Random Access Memories",
                "first-release-date": "2013-05-17",
                "artist-credit": [{ name: "Daft Punk" }],
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("", { status: 404 }));
    const storage = new MemoryStorage();

    await searchMusicBrainzAlbums("daft punk - random access memories", {
      fetcher,
      storage,
      now: () => 1_000,
    });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://musicbrainz.org/ws/2/release-group?query=artist%3A%22daft%20punk%22%20AND%20releasegroup%3A%22random%20access%20memories%22&fmt=json&limit=12",
      { headers: { Accept: "application/json" } },
    );
  });
});
