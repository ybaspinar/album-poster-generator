# Album Search Thumbnails Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show album cover thumbnails in search results and cache enriched album search results in browser storage for 90 days.

**Architecture:** Keep `AlbumSearch.vue` as the UI entry point and keep source concerns in `src/sources`. Add a focused localStorage cache helper, then update `searchMusicBrainzAlbums()` to read/write cache and enrich fresh MusicBrainz results with best-effort Cover Art Archive artwork. Selection uses artwork already present on the selected result and only falls back to another cover-art lookup when search data has no artwork.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, VitePlus, Vitest, Vue Test Utils, browser `localStorage`, MusicBrainz API, Cover Art Archive API.

---

## File structure

- Create `src/sources/album-search-cache.ts`
  - Owns cache key creation, TTL, cache validation, safe storage reads/writes, and browser `localStorage` access.
  - Exposes a small `StorageLike` interface so tests can pass an in-memory storage object.
- Create `src/sources/album-search-cache.test.ts`
  - Unit tests for cache hit, expiry, malformed JSON, wrong schema, and storage failures.
- Modify `src/sources/musicbrainz.ts`
  - Keep the public `searchMusicBrainzAlbums()` export.
  - Change it to accept an optional options object: `{ fetcher, storage, now }`.
  - Use the cache helper before fetching.
  - Enrich fresh results with `findCoverArt()` using the same fetcher.
  - Treat cover-art lookup errors as metadata-only results.
- Modify `src/sources/musicbrainz.test.ts`
  - Update call sites for the new options object.
  - Add coverage for enrichment, cache hit, cache expiry, malformed cache, and cover-art failure.
- Modify `src/components/AlbumSearch.vue`
  - Render thumbnails or a quiet placeholder inside each result button.
- Modify `src/style.css`
  - Add compact result row, thumbnail, placeholder, and text layout styles.
- Modify `src/App.vue`
  - Skip the selected-album cover-art fallback when the selected search result already has `artworkUrl`.
- Modify `src/components/AppFlow.test.ts`
  - Ensure selecting an enriched result uses artwork from search data immediately and does not call `findCoverArt()`.

---

### Task 1: Add the album search cache helper

**Files:**

- Create: `src/sources/album-search-cache.ts`
- Create: `src/sources/album-search-cache.test.ts`

- [ ] **Step 1: Write the failing cache tests**

Create `src/sources/album-search-cache.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the cache tests to verify they fail**

Run:

```bash
vp test --run src/sources/album-search-cache.test.ts
```

Expected: FAIL because `src/sources/album-search-cache.ts` does not exist yet.

- [ ] **Step 3: Implement the cache helper**

Create `src/sources/album-search-cache.ts`:

```ts
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
```

- [ ] **Step 4: Run the cache tests to verify they pass**

Run:

```bash
vp test --run src/sources/album-search-cache.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/sources/album-search-cache.ts src/sources/album-search-cache.test.ts
git commit -m 'feat: add album search cache helper'
```

---

### Task 2: Cache and enrich MusicBrainz search results

**Files:**

- Modify: `src/sources/musicbrainz.ts`
- Modify: `src/sources/musicbrainz.test.ts`

- [ ] **Step 1: Replace the MusicBrainz tests with cache and enrichment coverage**

Replace `src/sources/musicbrainz.test.ts` with:

```ts
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
        artworkUrl: "https://example.com/front-large.jpg",
        artworkSource: "cover-art-archive",
      },
    ]);

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://musicbrainz.org/ws/2/release-group?query=kids%20see%20ghosts&type=album&fmt=json&limit=8",
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
});
```

- [ ] **Step 2: Run the MusicBrainz tests to verify they fail**

Run:

```bash
vp test --run src/sources/musicbrainz.test.ts
```

Expected: FAIL because `searchMusicBrainzAlbums()` still accepts a raw fetcher as the second argument and does not use cache/enrichment.

- [ ] **Step 3: Implement cached enriched search**

Replace `src/sources/musicbrainz.ts` with:

```ts
import type { AlbumDraftInput } from "../domain/album";
import {
  getAlbumSearchStorage,
  normalizeAlbumSearchCacheQuery,
  readCachedAlbumSearchResults,
  type StorageLike,
  writeCachedAlbumSearchResults,
} from "./album-search-cache";
import { findCoverArt } from "./cover-art";

type Fetcher = typeof fetch;

interface MusicBrainzArtistCredit {
  name?: string;
}

interface MusicBrainzReleaseGroup {
  id?: string;
  title?: string;
  "first-release-date"?: string;
  "artist-credit"?: MusicBrainzArtistCredit[];
}

interface MusicBrainzReleaseGroupResponse {
  "release-groups"?: MusicBrainzReleaseGroup[];
}

interface SearchMusicBrainzAlbumsOptions {
  fetcher?: Fetcher;
  storage?: StorageLike;
  now?: () => number;
}

const musicBrainzBaseUrl = "https://musicbrainz.org/ws/2/release-group";

export async function searchMusicBrainzAlbums(
  query: string,
  options: SearchMusicBrainzAlbumsOptions = {},
): Promise<AlbumDraftInput[]> {
  const normalizedQuery = normalizeAlbumSearchCacheQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  const fetcher = options.fetcher ?? fetch;
  const storage = options.storage ?? getAlbumSearchStorage();
  const now = options.now?.() ?? Date.now();
  const cachedResults = readCachedAlbumSearchResults(normalizedQuery, storage, now);

  if (cachedResults) {
    return cachedResults;
  }

  const results = await fetchMusicBrainzAlbums(normalizedQuery, fetcher);
  const enrichedResults = await enrichAlbumsWithCoverArt(results, fetcher);
  writeCachedAlbumSearchResults(normalizedQuery, enrichedResults, storage, now);

  return enrichedResults;
}

async function fetchMusicBrainzAlbums(
  normalizedQuery: string,
  fetcher: Fetcher,
): Promise<AlbumDraftInput[]> {
  const url = `${musicBrainzBaseUrl}?query=${encodeURIComponent(normalizedQuery)}&type=album&fmt=json&limit=8`;

  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz search failed with status ${response.status}`);
  }

  const data = (await response.json()) as MusicBrainzReleaseGroupResponse;
  return (data["release-groups"] ?? []).flatMap(normalizeReleaseGroup);
}

async function enrichAlbumsWithCoverArt(
  albums: AlbumDraftInput[],
  fetcher: Fetcher,
): Promise<AlbumDraftInput[]> {
  return Promise.all(
    albums.map(async (album) => {
      if (!album.sourceId) {
        return album;
      }

      try {
        const coverArt = await findCoverArt(album.sourceId, fetcher);

        if (!coverArt.artworkUrl) {
          return album;
        }

        return {
          ...album,
          artworkUrl: coverArt.artworkUrl,
          artworkSource: coverArt.artworkSource,
        };
      } catch {
        return album;
      }
    }),
  );
}

function normalizeReleaseGroup(group: MusicBrainzReleaseGroup): AlbumDraftInput[] {
  if (!group.id || !group.title) {
    return [];
  }

  return [
    {
      id: group.id,
      title: group.title,
      artist: normalizeArtistCredit(group["artist-credit"] ?? []),
      releaseDate: group["first-release-date"] ?? "",
      source: "musicbrainz",
      sourceId: group.id,
    },
  ];
}

function normalizeArtistCredit(credits: MusicBrainzArtistCredit[]): string {
  const names = credits
    .map((credit) => credit.name?.trim())
    .filter((name): name is string => Boolean(name));
  return names.join(" & ");
}
```

- [ ] **Step 4: Run MusicBrainz and cache tests**

Run:

```bash
vp test --run src/sources/musicbrainz.test.ts src/sources/album-search-cache.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/sources/musicbrainz.ts src/sources/musicbrainz.test.ts
git commit -m 'feat: cache and enrich album searches'
```

---

### Task 3: Render search result thumbnails

**Files:**

- Modify: `src/components/AlbumSearch.vue`
- Modify: `src/style.css`

- [ ] **Step 1: Update the search result template**

In `src/components/AlbumSearch.vue`, replace the `<button ...>` contents inside `.results-list` with:

```vue
<div class="result-thumbnail" aria-hidden="true">
  <img v-if="result.artworkUrl" :src="result.artworkUrl" alt="" loading="lazy" />
  <span v-else class="result-thumbnail-placeholder">No art</span>
</div>
<div class="result-copy">
  <strong>{{ result.title }}</strong>
  <span>
    {{ result.artist || "Unknown artist" }} ·
    {{ result.releaseDate || "Unknown date" }}
  </span>
</div>
```

After the edit, the result button should look like:

```vue
<button
  v-for="(result, index) in results"
  :key="`${result.sourceId}-${index}`"
  :data-test="`result-${index}`"
  type="button"
  class="result-button"
  @click="emit('select', result)"
>
  <div class="result-thumbnail" aria-hidden="true">
    <img v-if="result.artworkUrl" :src="result.artworkUrl" alt="" loading="lazy" />
    <span v-else class="result-thumbnail-placeholder">No art</span>
  </div>
  <div class="result-copy">
    <strong>{{ result.title }}</strong>
    <span>
      {{ result.artist || "Unknown artist" }} ·
      {{ result.releaseDate || "Unknown date" }}
    </span>
  </div>
</button>
```

- [ ] **Step 2: Update result styles**

In `src/style.css`, replace the existing `.result-button` and `.result-button span` rules with:

```css
.result-button {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 10px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.6);
  text-align: left;
}

.result-thumbnail {
  display: grid;
  place-items: center;
  width: 52px;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid rgba(23, 23, 23, 0.08);
  border-radius: 10px;
  background: rgba(231, 222, 208, 0.72);
}

.result-thumbnail img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-thumbnail-placeholder {
  color: var(--muted);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

.result-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.result-copy strong,
.result-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-copy span {
  color: var(--muted);
  font-size: 0.9rem;
}
```

- [ ] **Step 3: Run component flow test as a smoke test**

Run:

```bash
vp test --run src/components/AppFlow.test.ts
```

Expected: PASS. This confirms the search result button still renders and can be clicked.

- [ ] **Step 4: Commit Task 3**

```bash
git add src/components/AlbumSearch.vue src/style.css
git commit -m 'feat: show album thumbnails in search results'
```

---

### Task 4: Use selected search artwork immediately

**Files:**

- Modify: `src/App.vue`
- Modify: `src/components/AppFlow.test.ts`

- [ ] **Step 1: Update the app flow test**

Replace `src/components/AppFlow.test.ts` with:

```ts
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import App from "../App.vue";
import { findCoverArt } from "../sources/cover-art";

vi.mock("../sources/musicbrainz", () => ({
  searchMusicBrainzAlbums: vi.fn().mockResolvedValue([
    {
      title: "Kids See Ghosts",
      artist: "Kanye West & Kid Cudi",
      releaseDate: "2018-06-08",
      source: "musicbrainz",
      sourceId: "rg-1",
      artworkUrl: "https://example.com/search-front.jpg",
      artworkSource: "cover-art-archive",
    },
  ]),
}));

vi.mock("../sources/cover-art", () => ({
  findCoverArt: vi.fn().mockResolvedValue({
    artworkUrl: "https://example.com/fallback-front.jpg",
    artworkSource: "cover-art-archive",
  }),
}));

describe("App flow", () => {
  it("searches, selects a result, uses search artwork, and allows manual title override", async () => {
    const wrapper = mount(App);

    await wrapper.find('[data-test="search-input"]').setValue("kids see ghosts");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    await wrapper.find('[data-test="result-0"]').trigger("click");
    await Promise.resolve();

    expect(wrapper.text()).toContain("Kids See Ghosts");
    expect(wrapper.find(".poster-art").attributes("src")).toBe(
      "https://example.com/search-front.jpg",
    );
    expect(findCoverArt).not.toHaveBeenCalled();

    await wrapper.find('[data-test="title-input"]').setValue("My Custom Poster Title");

    expect(wrapper.text()).toContain("My Custom Poster Title");
  });
});
```

- [ ] **Step 2: Run the app flow test to verify it fails**

Run:

```bash
vp test --run src/components/AppFlow.test.ts
```

Expected: FAIL because `App.vue` still calls `findCoverArt()` whenever `sourceId` exists, even when selected search data already includes artwork.

- [ ] **Step 3: Update selected-album cover-art fallback**

In `src/App.vue`, replace this block in `selectAlbum()`:

```ts
if (album.sourceId) {
  try {
    draft.value = applyDraftPatch(draft.value, await findCoverArt(album.sourceId));
  } catch (error) {
    status.value =
      error instanceof Error ? error.message : "Artwork lookup failed. Add artwork manually.";
  }
}
```

with:

```ts
if (album.sourceId && !album.artworkUrl) {
  try {
    draft.value = applyDraftPatch(draft.value, await findCoverArt(album.sourceId));
  } catch (error) {
    status.value =
      error instanceof Error ? error.message : "Artwork lookup failed. Add artwork manually.";
  }
}
```

- [ ] **Step 4: Run the app flow test to verify it passes**

Run:

```bash
vp test --run src/components/AppFlow.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/App.vue src/components/AppFlow.test.ts
git commit -m 'feat: reuse search artwork on album selection'
```

---

### Task 5: Final verification

**Files:**

- No required source changes.
- Include any files changed by formatter if `vp check` or `vp fmt` updates them.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
vp test --run src/sources/album-search-cache.test.ts src/sources/musicbrainz.test.ts src/components/AppFlow.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
vp test --run
```

Expected: PASS.

- [ ] **Step 3: Run project checks**

Run:

```bash
vp check
```

Expected: PASS.

- [ ] **Step 4: Build production bundle**

Run:

```bash
vp build
```

Expected: PASS and no TypeScript or Vite build errors.

- [ ] **Step 5: Inspect git diff**

Run:

```bash
git diff -- src/sources/album-search-cache.ts src/sources/album-search-cache.test.ts src/sources/musicbrainz.ts src/sources/musicbrainz.test.ts src/components/AlbumSearch.vue src/style.css src/App.vue src/components/AppFlow.test.ts
```

Expected: Diff only contains the cache helper, cached/enriched search behavior, thumbnail UI, selected-artwork fallback, and matching tests.

- [ ] **Step 6: Commit verification fixes if needed**

If any formatting/check fixes were needed, commit only those changed source/test files:

```bash
git add src/sources/album-search-cache.ts src/sources/album-search-cache.test.ts src/sources/musicbrainz.ts src/sources/musicbrainz.test.ts src/components/AlbumSearch.vue src/style.css src/App.vue src/components/AppFlow.test.ts
git commit -m 'chore: finalize album search thumbnail cache'
```

If there were no new changes after Task 4, skip this commit.

---

## Self-review

- Spec coverage: covered thumbnails, 90-day `localStorage` cache, enriched search results, immediate selected artwork, MusicBrainz errors, cover-art best-effort behavior, malformed/expired cache handling, and tests.
- Placeholder scan: no red-flag placeholder wording or underspecified steps remain.
- Type consistency: `StorageLike`, `AlbumDraftInput`, `SearchMusicBrainzAlbumsOptions`, `artworkUrl`, and `artworkSource` are used consistently across tasks.
