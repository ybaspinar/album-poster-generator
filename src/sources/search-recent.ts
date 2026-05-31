export interface RecentSearchStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const recentKey = "album-poster-generator:recent-searches:v1";
const maxRecents = 5;

function getStorage(): RecentSearchStorage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readRecentSearches(storage = getStorage()): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(recentKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string, storage = getStorage()): void {
  if (!storage) return;
  const normalized = query.trim().replace(/\s+/g, " ").toLowerCase();
  if (normalized.length < 2) return;

  const existing = readRecentSearches(storage);
  const next = [normalized, ...existing.filter((q) => q !== normalized)].slice(0, maxRecents);

  try {
    storage.setItem(recentKey, JSON.stringify(next));
  } catch {
    // Best-effort.
  }
}

export function clearRecentSearches(storage = getStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(recentKey, JSON.stringify([]));
  } catch {
    // Best-effort.
  }
}
