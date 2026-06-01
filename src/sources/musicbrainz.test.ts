import { describe, expect, it, vi } from "vitest";
import type { AlbumDraftInput } from "../domain/album";
import { createAlbumSearchCacheKey, type StorageLike } from "./album-search-cache";
import {
  fetchMusicBrainzEditions,
  fetchMusicBrainzTracklist,
  fetchMusicBrainzTracklistForRelease,
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

function createProxySearchResponse(): Response {
  return Response.json([
    {
      id: "rg-1",
      title: "Kids See Ghosts",
      artist: "Kanye West & Kid Cudi",
      releaseDate: "2018-06-08",
      primaryType: "Album",
    },
  ]);
}

function createProxyCoverResponse(url = "https://example.com/front-full.jpg"): Response {
  return Response.json({
    artworkUrl: url,
    thumbnails: { large: "https://example.com/front-large.jpg" },
  });
}

function createProxyEditionsResponse(): Response {
  return Response.json([
    {
      id: "release-standard",
      title: "Red",
      releaseDate: "2012-10-22",
      country: "US",
      formats: ["CD"],
      trackCount: 1,
    },
    {
      id: "release-deluxe",
      title: "Red (Deluxe Edition)",
      releaseDate: "2012-10-22",
      country: "US",
      formats: ["CD", "Digital Media"],
      trackCount: 2,
    },
  ]);
}

function createProxyTracklistResponse(): Response {
  return Response.json(["Feel the Love", "Fire", "4th Dimension"]);
}

describe("searchMusicBrainzAlbums", () => {
  it("fetches album search results through the mb-proxy and enriches with proxied cover art", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createProxySearchResponse())
      .mockResolvedValueOnce(createProxyCoverResponse());
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
      "https://mb-proxy.ybaspinar.dev/search?album=kids+see+ghosts",
      { headers: { Accept: "application/json" } },
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "https://mb-proxy.ybaspinar.dev/release-group/rg-1/cover",
      { headers: { Accept: "application/json" } },
    );
  });

  it("passes structured search params to the mb-proxy", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createProxySearchResponse())
      .mockResolvedValueOnce(createProxyCoverResponse());
    const storage = new MemoryStorage();

    const params: MusicBrainzSearchParams = {
      artist: "Kanye West",
      title: "Kids See Ghosts",
      year: "2018",
      type: "album",
    };

    await searchMusicBrainzAlbums(params, { fetcher, storage, now: () => 1_000 });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://mb-proxy.ybaspinar.dev/search?artist=Kanye+West&album=Kids+See+Ghosts&year=2018&type=album",
      { headers: { Accept: "application/json" } },
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
      .mockResolvedValueOnce(createProxySearchResponse())
      .mockResolvedValueOnce(Response.json({ artworkUrl: "", thumbnails: {} }));

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
      .mockResolvedValueOnce(createProxySearchResponse())
      .mockResolvedValueOnce(Response.json({ artworkUrl: "", thumbnails: {} }));

    await expect(
      searchMusicBrainzAlbums("kids see ghosts", { fetcher, storage, now: () => 1_000 }),
    ).resolves.toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("returns metadata-only results when cover art enrichment fails", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createProxySearchResponse())
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

  it("throws a readable error when the proxy fails", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("rate limited", { status: 503 }));

    await expect(searchMusicBrainzAlbums("test", { fetcher })).rejects.toThrow(
      "MusicBrainz search failed with status 503",
    );
  });

  it("uses fielded params when string input looks like artist - album", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createProxySearchResponse())
      .mockResolvedValueOnce(Response.json({ artworkUrl: "", thumbnails: {} }));
    const storage = new MemoryStorage();

    await searchMusicBrainzAlbums("daft punk - random access memories", {
      fetcher,
      storage,
      now: () => 1_000,
    });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://mb-proxy.ybaspinar.dev/search?artist=daft+punk&album=random+access+memories",
      { headers: { Accept: "application/json" } },
    );
  });
});

describe("fetchMusicBrainzEditions", () => {
  it("normalizes editions from the mb-proxy and enriches release artwork", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createProxyEditionsResponse())
      .mockResolvedValueOnce(createProxyCoverResponse("https://coverartarchive.org/standard.jpg"))
      .mockResolvedValueOnce(createProxyCoverResponse("https://coverartarchive.org/deluxe.jpg"));

    await expect(fetchMusicBrainzEditions("rg-red", fetcher)).resolves.toEqual([
      {
        id: "release-standard",
        title: "Red",
        releaseDate: "2012-10-22",
        country: "US",
        formats: ["CD"],
        trackCount: 1,
        artworkUrl: "https://coverartarchive.org/standard.jpg",
      },
      {
        id: "release-deluxe",
        title: "Red (Deluxe Edition)",
        releaseDate: "2012-10-22",
        country: "US",
        formats: ["CD", "Digital Media"],
        trackCount: 2,
        artworkUrl: "https://coverartarchive.org/deluxe.jpg",
      },
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      "https://mb-proxy.ybaspinar.dev/release-group/rg-red/editions",
      {
        headers: { Accept: "application/json" },
      },
    );
    expect(fetcher).toHaveBeenCalledWith(
      "https://mb-proxy.ybaspinar.dev/release/release-standard/cover",
      {
        headers: { Accept: "application/json" },
      },
    );
    expect(fetcher).toHaveBeenCalledWith(
      "https://mb-proxy.ybaspinar.dev/release/release-deluxe/cover",
      {
        headers: { Accept: "application/json" },
      },
    );
  });
});

describe("fetchMusicBrainzTracklist", () => {
  it("fetches track titles through the first proxied release in a release group", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(createProxyEditionsResponse())
      .mockResolvedValueOnce(createProxyTracklistResponse());

    await expect(fetchMusicBrainzTracklist("rg-1", fetcher)).resolves.toEqual([
      "Feel the Love",
      "Fire",
      "4th Dimension",
    ]);

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://mb-proxy.ybaspinar.dev/release-group/rg-1/editions",
      { headers: { Accept: "application/json" } },
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "https://mb-proxy.ybaspinar.dev/release/release-standard/tracklist",
      { headers: { Accept: "application/json" } },
    );
  });

  it("returns an empty list when the release group has no releases", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json([]));

    await expect(fetchMusicBrainzTracklist("rg-1", fetcher)).resolves.toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("fetches track titles for a specific release", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(createProxyTracklistResponse());

    await expect(fetchMusicBrainzTracklistForRelease("release-1", fetcher)).resolves.toEqual([
      "Feel the Love",
      "Fire",
      "4th Dimension",
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      "https://mb-proxy.ybaspinar.dev/release/release-1/tracklist",
      {
        headers: { Accept: "application/json" },
      },
    );
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
