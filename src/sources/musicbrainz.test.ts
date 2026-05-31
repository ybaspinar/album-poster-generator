import { describe, expect, it, vi } from "vitest";
import type { AlbumDraftInput } from "../domain/album";
import { createAlbumSearchCacheKey, type StorageLike } from "./album-search-cache";
import {
  fetchMusicBrainzTracklist,
  normalizeSearchParams,
  paramsDisplayLabel,
  searchMusicBrainzAlbums,
  type MusicBrainzSearchParams,
} from "./musicbrainz";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function createReleaseListResponse(): Response {
  return new Response(
    JSON.stringify({
      releases: [
        {
          id: "release-1",
          title: "Kids See Ghosts",
        },
      ],
    }),
    { status: 200 },
  );
}

function createReleaseDetailResponse(): Response {
  return new Response(
    JSON.stringify({
      id: "release-1",
      media: [
        {
          tracks: [{ title: "Feel the Love" }, { title: "Fire" }, { title: "4th Dimension" }],
        },
      ],
    }),
    { status: 200 },
  );
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
  it("normalizes and enriches release group search results (string query)", async () => {
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

  it("normalizes and enriches release group search results (structured params)", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createMusicBrainzResponse())
      .mockResolvedValueOnce(createCoverArtResponse());
    const storage = new MemoryStorage();

    const params: MusicBrainzSearchParams = {
      artist: "Kanye West",
      title: "Kids See Ghosts",
      year: "2018",
      type: "album",
    };

    await expect(
      searchMusicBrainzAlbums(params, { fetcher, storage, now: () => 1_000 }),
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
      "https://musicbrainz.org/ws/2/release-group?query=artist%3A%22Kanye%20West%22%20AND%20releasegroup%3A%22Kids%20See%20Ghosts%22%20AND%20date%3A2018%20AND%20primarytype%3AAlbum&fmt=json&limit=12",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
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

  it("returns an empty list for blank string queries without fetching", async () => {
    const fetcher = vi.fn();

    await expect(searchMusicBrainzAlbums("  ", { fetcher })).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns an empty list for empty structured params without fetching", async () => {
    const fetcher = vi.fn();

    await expect(searchMusicBrainzAlbums({}, { fetcher })).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("throws a readable error when MusicBrainz fails", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("rate limited", { status: 503 }));

    await expect(searchMusicBrainzAlbums("test", { fetcher })).rejects.toThrow(
      "MusicBrainz search failed with status 503",
    );
  });

  it("uses fielded query when string input looks like artist - album", async () => {
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

describe("fetchMusicBrainzTracklist", () => {
  it("fetches track titles through the first release in a release group", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createReleaseListResponse())
      .mockResolvedValueOnce(createReleaseDetailResponse());

    await expect(fetchMusicBrainzTracklist("rg-1", fetcher)).resolves.toEqual([
      "Feel the Love",
      "Fire",
      "4th Dimension",
    ]);

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://musicbrainz.org/ws/2/release?release-group=rg-1&fmt=json&limit=5",
      { headers: { Accept: "application/json" } },
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "https://musicbrainz.org/ws/2/release/release-1?inc=recordings&fmt=json",
      { headers: { Accept: "application/json" } },
    );
  });

  it("returns an empty list when the release group has no releases", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          releases: [],
        }),
        { status: 200 },
      ),
    );

    await expect(fetchMusicBrainzTracklist("rg-1", fetcher)).resolves.toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns an empty list when tracklist lookup fails", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("rate limited", { status: 503 }));

    await expect(fetchMusicBrainzTracklist("rg-1", fetcher)).resolves.toEqual([]);
  });
});

describe("normalizeSearchParams", () => {
  it("produces a deterministic normalized string", () => {
    expect(
      normalizeSearchParams({ artist: "Kanye West", title: "Donda", year: "2021", type: "album" }),
    ).toBe("a:kanye west|t:donda|y:2021|ty:album");
  });

  it("ignores empty fields", () => {
    expect(normalizeSearchParams({ artist: "Björk" })).toBe("a:björk");
  });

  it("normalizes case and trims", () => {
    expect(normalizeSearchParams({ title: "  Vespertine  ", artist: "  BJÖRK  " })).toBe(
      "a:björk|t:vespertine",
    );
  });

  it("returns empty string when all fields are empty", () => {
    expect(normalizeSearchParams({})).toBe("");
  });
});

describe("paramsDisplayLabel", () => {
  it("shows artist - title when both present", () => {
    expect(paramsDisplayLabel({ artist: "Daft Punk", title: "RAM" })).toBe("Daft Punk - RAM");
  });

  it("shows title only when no artist", () => {
    expect(paramsDisplayLabel({ title: "Vespertine" })).toBe("Vespertine");
  });

  it("shows artist only when no title", () => {
    expect(paramsDisplayLabel({ artist: "Björk" })).toBe("Björk");
  });

  it("returns empty string when no identifying fields", () => {
    expect(paramsDisplayLabel({ year: "2020" })).toBe("");
  });
});
