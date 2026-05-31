import type { AlbumDraftInput } from "../domain/album";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface AlbumSearchCacheEntry {
  version: 1;
  query: string;
  cachedAt: number;
  results: AlbumDraftInput[];
}

const cacheVersion = 1;
const cachePrefix = "album-poster-generator:album-search:v1";
export const albumSearchCacheTtlMs = 90 * 24 * 60 * 60 * 1000;

export function normalizeAlbumSearchCacheQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function createAlbumSearchCacheKey(query: string): string {
  return `${cachePrefix}:${encodeURIComponent(normalizeAlbumSearchCacheQuery(query))}`;
}

export function getAlbumSearchStorage(): StorageLike | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readCachedAlbumSearchResults(
  query: string,
  storage: StorageLike | undefined = getAlbumSearchStorage(),
  now = Date.now(),
): AlbumDraftInput[] | null {
  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(createAlbumSearchCacheKey(query));

    if (!rawValue) {
      return null;
    }

    const entry = JSON.parse(rawValue) as Partial<AlbumSearchCacheEntry>;

    if (!isAlbumSearchCacheEntry(entry)) {
      return null;
    }

    if (now - entry.cachedAt > albumSearchCacheTtlMs) {
      return null;
    }

    return entry.results;
  } catch {
    return null;
  }
}

export function writeCachedAlbumSearchResults(
  query: string,
  results: AlbumDraftInput[],
  storage: StorageLike | undefined = getAlbumSearchStorage(),
  now = Date.now(),
): void {
  if (!storage) {
    return;
  }

  const normalizedQuery = normalizeAlbumSearchCacheQuery(query);
  const entry: AlbumSearchCacheEntry = {
    version: cacheVersion,
    query: normalizedQuery,
    cachedAt: now,
    results,
  };

  try {
    storage.setItem(createAlbumSearchCacheKey(normalizedQuery), JSON.stringify(entry));
  } catch {
    // Cache writes are best-effort. Search must keep working when storage is unavailable.
  }
}

function isAlbumSearchCacheEntry(
  value: Partial<AlbumSearchCacheEntry>,
): value is AlbumSearchCacheEntry {
  return (
    value.version === cacheVersion &&
    typeof value.query === "string" &&
    typeof value.cachedAt === "number" &&
    Array.isArray(value.results) &&
    value.results.every(isAlbumDraftInput)
  );
}

function isAlbumDraftInput(value: unknown): value is AlbumDraftInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    isOptionalString(result.id) &&
    isOptionalString(result.title) &&
    isOptionalString(result.artist) &&
    isOptionalString(result.releaseDate) &&
    isOptionalString(result.metadataLine) &&
    isOptionalString(result.artworkUrl) &&
    isOptionalString(result.artworkSource) &&
    isOptionalString(result.source) &&
    isOptionalString(result.sourceId) &&
    (result.palette === undefined ||
      (Array.isArray(result.palette) && result.palette.every((color) => typeof color === "string")))
  );
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}
