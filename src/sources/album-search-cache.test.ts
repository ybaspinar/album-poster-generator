import { describe, expect, it } from "vitest";
import type { AlbumDraftInput } from "../domain/album";
import {
  albumSearchCacheTtlMs,
  createAlbumSearchCacheKey,
  readCachedAlbumSearchResults,
  writeCachedAlbumSearchResults,
  type StorageLike,
} from "./album-search-cache";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const results: AlbumDraftInput[] = [
  {
    id: "rg-1",
    title: "Kids See Ghosts",
    artist: "Kanye West & Kid Cudi",
    releaseDate: "2018-06-08",
    source: "musicbrainz",
    sourceId: "rg-1",
    artworkUrl: "https://example.com/front.jpg",
    artworkSource: "cover-art-archive",
  },
];

describe("album search cache", () => {
  it("returns fresh cached results", () => {
    const storage = new MemoryStorage();
    writeCachedAlbumSearchResults("kids see ghosts", results, storage, 1_000);

    expect(readCachedAlbumSearchResults("kids see ghosts", storage, 1_000)).toEqual(results);
  });

  it("normalizes cache keys", () => {
    expect(createAlbumSearchCacheKey("  Kids   See Ghosts  ")).toBe(
      "album-poster-generator:album-search:v1:kids%20see%20ghosts",
    );
  });

  it("ignores expired cached results", () => {
    const storage = new MemoryStorage();
    writeCachedAlbumSearchResults("kids see ghosts", results, storage, 1_000);

    expect(
      readCachedAlbumSearchResults("kids see ghosts", storage, 1_000 + albumSearchCacheTtlMs + 1),
    ).toBeNull();
  });

  it("ignores malformed cached JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem(createAlbumSearchCacheKey("kids see ghosts"), "not-json");

    expect(readCachedAlbumSearchResults("kids see ghosts", storage, 1_000)).toBeNull();
  });

  it("ignores unsupported cache shapes", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      createAlbumSearchCacheKey("kids see ghosts"),
      JSON.stringify({ version: 999, cachedAt: 1_000, results }),
    );

    expect(readCachedAlbumSearchResults("kids see ghosts", storage, 1_000)).toBeNull();
  });

  it("treats storage failures as cache misses", () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error("storage blocked");
      },
      setItem: () => {
        throw new Error("storage blocked");
      },
    };

    expect(readCachedAlbumSearchResults("kids see ghosts", storage, 1_000)).toBeNull();
    expect(() =>
      writeCachedAlbumSearchResults("kids see ghosts", results, storage, 1_000),
    ).not.toThrow();
  });
});
