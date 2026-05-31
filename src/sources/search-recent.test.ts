import { describe, expect, it } from "vitest";
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  type RecentSearchStorage,
} from "./search-recent";

class MemoryStorage implements RecentSearchStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("search-recent", () => {
  it("reads empty recents when storage is empty", () => {
    const storage = new MemoryStorage();
    expect(readRecentSearches(storage)).toEqual([]);
  });

  it("adds a recent search", () => {
    const storage = new MemoryStorage();
    addRecentSearch("kids see ghosts", storage);
    expect(readRecentSearches(storage)).toEqual(["kids see ghosts"]);
  });

  it("deduplicates and moves to front", () => {
    const storage = new MemoryStorage();
    addRecentSearch("vespertine", storage);
    addRecentSearch("kids see ghosts", storage);
    addRecentSearch("vespertine", storage);
    expect(readRecentSearches(storage)).toEqual(["vespertine", "kids see ghosts"]);
  });

  it("caps at five items", () => {
    const storage = new MemoryStorage();
    addRecentSearch("aa", storage);
    addRecentSearch("bb", storage);
    addRecentSearch("cc", storage);
    addRecentSearch("dd", storage);
    addRecentSearch("ee", storage);
    addRecentSearch("ff", storage);
    expect(readRecentSearches(storage)).toEqual(["ff", "ee", "dd", "cc", "bb"]);
  });

  it("ignores very short queries", () => {
    const storage = new MemoryStorage();
    addRecentSearch("a", storage);
    expect(readRecentSearches(storage)).toEqual([]);
  });

  it("clears all recents", () => {
    const storage = new MemoryStorage();
    addRecentSearch("test", storage);
    clearRecentSearches(storage as unknown as RecentSearchStorage);
    expect(readRecentSearches(storage)).toEqual([]);
  });
});
