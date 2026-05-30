# Album Poster Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only Vue SPA that searches album metadata, accepts manual overrides and custom artwork, previews one polished print poster template, and exports print-size PNG files.

**Architecture:** The app uses small Vue components over focused TypeScript modules. External data is normalized into an `AlbumDraft`; user edits mutate the same draft; the poster template renders only from final draft state; export code turns the preview/export element into a PNG at the selected print preset dimensions.

**Tech Stack:** VitePlus, Vue 3, Vite 8, TypeScript 7 if usable, pnpm, Vitest, Vue Test Utils, Oxc/Oxlint/Oxfmt through VitePlus, `html-to-image` for PNG export.

---

## Scope Check

The approved spec is one focused MVP. It has several modules, but they are not independent products: each supports the same album-poster generation flow. Keep all work in one implementation plan.

## File Structure

Create or modify these files:

- `package.json` — project metadata, package manager, scripts, runtime/dev dependencies.
- `vite.config.ts` — VitePlus/Vite/Vitest/Oxlint/Oxfmt configuration.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TypeScript project references and compiler settings.
- `index.html` — SPA mount point.
- `src/main.ts` — Vue app bootstrap.
- `src/App.vue` — page shell and orchestration.
- `src/style.css` — global layout, form, preview, and print-poster styling tokens.
- `src/domain/album.ts` — normalized album types and empty/demo draft constructors.
- `src/domain/album.test.ts` — draft model tests.
- `src/sources/musicbrainz.ts` — MusicBrainz album search adapter.
- `src/sources/musicbrainz.test.ts` — MusicBrainz normalization tests.
- `src/sources/cover-art.ts` — Cover Art Archive artwork lookup adapter.
- `src/sources/cover-art.test.ts` — artwork adapter tests.
- `src/editor/draft.ts` — draft patching, reset, and manual override helpers.
- `src/editor/draft.test.ts` — editor state unit tests.
- `src/media/image-upload.ts` — uploaded image validation and object URL conversion.
- `src/media/palette.ts` — local canvas-based palette extraction.
- `src/media/image-upload.test.ts` — upload validation tests.
- `src/media/palette.test.ts` — palette extraction tests with a fake canvas seam.
- `src/export/presets.ts` — print preset dimensions, labels, filenames.
- `src/export/presets.test.ts` — preset and filename tests.
- `src/export/png.ts` — PNG export via `html-to-image`.
- `src/export/png.test.ts` — export behavior tests with mocked `html-to-image`.
- `src/components/AlbumSearch.vue` — MusicBrainz search UI.
- `src/components/AlbumEditor.vue` — manual field/artwork/palette controls.
- `src/components/ExportPanel.vue` — preset picker and export button.
- `src/components/PosterPreview.vue` — polished poster template.
- `src/components/PosterPreview.test.ts` — template rendering tests.
- `src/components/AppFlow.test.ts` — integration test for search/manual/edit/export flow.
- `README.md` — project purpose and commands.

## Tasks

### Task 1: Scaffold VitePlus Vue project

**Files:**

- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/style.css`

- [ ] **Step 1: Verify VitePlus is available**

Run:

```bash
command -v vp || curl -fsSL https://vite.plus | bash
vp --version
```

Expected: `vp --version` prints a version. If the installer changes PATH, open a new shell in `/home/yusuf/Projects/album-poster-generator` and rerun `vp --version`.

- [ ] **Step 2: Scaffold Vue TypeScript files through VitePlus**

Run from `/home/yusuf/Projects/album-poster-generator`:

```bash
vp create vite --directory .scaffold -- --template vue-ts
cp -a .scaffold/. .
rm -rf .scaffold
```

Expected: `package.json`, `index.html`, `vite.config.ts`, and `src/` exist while `docs/` is still present.

- [ ] **Step 3: Replace `package.json` with project scripts and dependencies**

Write `package.json` exactly as:

```json
{
  "name": "album-poster-generator",
  "version": "0.0.0",
  "private": false,
  "type": "module",
  "packageManager": "pnpm@10.12.1",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "preview": "vp run preview",
    "test": "vp test",
    "test:watch": "vp test --watch",
    "check": "vp check",
    "lint": "vp lint",
    "fmt": "vp fmt"
  },
  "dependencies": {
    "@vitejs/plugin-vue": "latest",
    "html-to-image": "latest",
    "vite": "latest",
    "vite-plus": "latest",
    "vue": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@vitejs/plugin-vue-jsx": "latest",
    "@vue/test-utils": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vitest": "latest",
    "vue-tsc": "latest"
  }
}
```

- [ ] **Step 4: Install dependencies with VitePlus**

Run:

```bash
vp install
vp list vite typescript vue vite-plus html-to-image
```

Expected: install succeeds and the listed packages resolve from the project dependency graph. If the package manager selects newer `pnpm`, keep the lockfile it writes and do not downgrade.

- [ ] **Step 5: Replace `vite.config.ts` with VitePlus config**

Write `vite.config.ts` exactly as:

```ts
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
    coverage: {
      reporter: ["text", "html"],
    },
  },
  lint: {
    ignorePatterns: ["dist/**", "coverage/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "no-console": ["error", { allow: ["error"] }],
    },
  },
  fmt: {
    ignorePatterns: ["dist/**", "coverage/**"],
  },
});
```

- [ ] **Step 6: Replace TypeScript config files**

Write `tsconfig.json` exactly as:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

Write `tsconfig.app.json` exactly as:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2024",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

Write `tsconfig.node.json` exactly as:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: Create minimal app shell**

Write `src/main.ts` exactly as:

```ts
import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

createApp(App).mount("#app");
```

Write `src/App.vue` exactly as:

```vue
<template>
  <main class="app-shell">
    <section class="hero-panel">
      <p class="eyebrow">Album Poster Generator</p>
      <h1>Make print-ready album posters from metadata, artwork, and your own edits.</h1>
      <p class="hero-copy">
        Search, override, preview, and export a polished poster without leaving the browser.
      </p>
    </section>
  </main>
</template>
```

Write `src/style.css` exactly as:

```css
:root {
  color: #171717;
  background: #f4efe6;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --paper: #fffaf0;
  --ink: #171717;
  --muted: #6b6259;
  --line: #d6cab9;
  --panel: rgba(255, 250, 240, 0.72);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
  padding: 48px;
}

.hero-panel {
  max-width: 880px;
  padding: 48px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--panel);
  box-shadow: 0 24px 80px rgba(23, 23, 23, 0.08);
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  max-width: 760px;
  margin: 0;
  font-size: clamp(2.4rem, 7vw, 5.6rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
}

.hero-copy {
  max-width: 560px;
  margin: 24px 0 0;
  color: var(--muted);
  font-size: 1.1rem;
  line-height: 1.6;
}
```

- [ ] **Step 8: Verify scaffold**

Run:

```bash
vp test --run
vp build
vp check
```

Expected: tests either report no tests found with a successful exit, or pass if the scaffold created tests; build and check succeed.

- [ ] **Step 9: Commit scaffold**

Run:

```bash
git add package.json pnpm-lock.yaml vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src/main.ts src/App.vue src/style.css
git commit -m "chore: scaffold VitePlus Vue app"
```

Expected: one commit with the VitePlus Vue scaffold.

### Task 2: Add album domain model

**Files:**

- Create: `src/domain/album.ts`
- Create: `src/domain/album.test.ts`

- [ ] **Step 1: Write failing domain tests**

Create `src/domain/album.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAlbumDraft, createEmptyAlbumDraft, normalizeAlbumText } from "./album";

describe("album draft model", () => {
  it("creates an empty editable draft", () => {
    expect(createEmptyAlbumDraft()).toEqual({
      id: expect.stringMatching(/^draft-/),
      title: "",
      artist: "",
      releaseDate: "",
      metadataLine: "",
      artworkUrl: "",
      artworkSource: "manual",
      palette: ["#f28c28", "#c02465", "#f4a35d", "#a98cbd", "#21889b", "#17245c"],
      source: "manual",
      sourceId: "",
    });
  });

  it("normalizes noisy text fields", () => {
    expect(normalizeAlbumText("  Kids   See\nGhosts  ")).toBe("Kids See Ghosts");
  });

  it("applies provided values while preserving defaults", () => {
    const draft = createAlbumDraft({ title: "Graduation", artist: "Kanye West" });

    expect(draft.title).toBe("Graduation");
    expect(draft.artist).toBe("Kanye West");
    expect(draft.palette).toHaveLength(6);
    expect(draft.source).toBe("manual");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
vp test --run src/domain/album.test.ts
```

Expected: fail because `src/domain/album.ts` does not exist.

- [ ] **Step 3: Implement album model**

Create `src/domain/album.ts`:

```ts
export type AlbumSource = "manual" | "musicbrainz";
export type ArtworkSource = "manual" | "cover-art-archive" | "remote";

export interface AlbumDraft {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  metadataLine: string;
  artworkUrl: string;
  artworkSource: ArtworkSource;
  palette: string[];
  source: AlbumSource;
  sourceId: string;
}

export interface AlbumDraftInput {
  id?: string;
  title?: string;
  artist?: string;
  releaseDate?: string;
  metadataLine?: string;
  artworkUrl?: string;
  artworkSource?: ArtworkSource;
  palette?: string[];
  source?: AlbumSource;
  sourceId?: string;
}

export const defaultPalette = ["#f28c28", "#c02465", "#f4a35d", "#a98cbd", "#21889b", "#17245c"];

export function normalizeAlbumText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function createEmptyAlbumDraft(): AlbumDraft {
  return createAlbumDraft();
}

export function createAlbumDraft(input: AlbumDraftInput = {}): AlbumDraft {
  return {
    id: input.id ?? `draft-${crypto.randomUUID()}`,
    title: normalizeAlbumText(input.title ?? ""),
    artist: normalizeAlbumText(input.artist ?? ""),
    releaseDate: normalizeAlbumText(input.releaseDate ?? ""),
    metadataLine: normalizeAlbumText(input.metadataLine ?? ""),
    artworkUrl: input.artworkUrl ?? "",
    artworkSource: input.artworkSource ?? "manual",
    palette: normalizePalette(input.palette),
    source: input.source ?? "manual",
    sourceId: input.sourceId ?? "",
  };
}

function normalizePalette(palette: string[] | undefined): string[] {
  const values = palette?.filter((value) => /^#[0-9a-f]{6}$/i.test(value)) ?? [];
  return [...values, ...defaultPalette].slice(0, 6);
}
```

- [ ] **Step 4: Run domain tests**

Run:

```bash
vp test --run src/domain/album.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit domain model**

Run:

```bash
git add src/domain/album.ts src/domain/album.test.ts
git commit -m "feat: add album draft model"
```

Expected: one commit with domain model and tests.

### Task 3: Add MusicBrainz source adapter

**Files:**

- Create: `src/sources/musicbrainz.ts`
- Create: `src/sources/musicbrainz.test.ts`

- [ ] **Step 1: Write failing MusicBrainz tests**

Create `src/sources/musicbrainz.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { searchMusicBrainzAlbums } from "./musicbrainz";

describe("searchMusicBrainzAlbums", () => {
  it("normalizes release group search results", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
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
      ),
    );

    await expect(searchMusicBrainzAlbums("kids see ghosts", fetcher)).resolves.toEqual([
      {
        id: "rg-1",
        title: "Kids See Ghosts",
        artist: "Kanye West & Kid Cudi",
        releaseDate: "2018-06-08",
        source: "musicbrainz",
        sourceId: "rg-1",
      },
    ]);

    expect(fetcher).toHaveBeenCalledWith(
      "https://musicbrainz.org/ws/2/release-group?query=kids%20see%20ghosts&type=album&fmt=json&limit=8",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
  });

  it("returns an empty list for blank queries without fetching", async () => {
    const fetcher = vi.fn();

    await expect(searchMusicBrainzAlbums("  ", fetcher)).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("throws a readable error when MusicBrainz fails", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("rate limited", { status: 503 }));

    await expect(searchMusicBrainzAlbums("test", fetcher)).rejects.toThrow(
      "MusicBrainz search failed with status 503",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
vp test --run src/sources/musicbrainz.test.ts
```

Expected: fail because `src/sources/musicbrainz.ts` does not exist.

- [ ] **Step 3: Implement MusicBrainz adapter**

Create `src/sources/musicbrainz.ts`:

```ts
import type { AlbumDraftInput } from "../domain/album";

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

const musicBrainzBaseUrl = "https://musicbrainz.org/ws/2/release-group";

export async function searchMusicBrainzAlbums(
  query: string,
  fetcher: Fetcher = fetch,
): Promise<AlbumDraftInput[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const url = new URL(musicBrainzBaseUrl);
  url.searchParams.set("query", normalizedQuery);
  url.searchParams.set("type", "album");
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", "8");

  const response = await fetcher(url.toString(), {
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

function normalizeReleaseGroup(group: MusicBrainzReleaseGroup): AlbumDraftInput[] {
  if (!group.id || !group.title) {
    return [];
  }

  return [
    {
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

- [ ] **Step 4: Run MusicBrainz tests**

Run:

```bash
vp test --run src/sources/musicbrainz.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit MusicBrainz adapter**

Run:

```bash
git add src/sources/musicbrainz.ts src/sources/musicbrainz.test.ts
git commit -m "feat: add MusicBrainz album search"
```

Expected: one commit with adapter and tests.

### Task 4: Add Cover Art Archive adapter

**Files:**

- Create: `src/sources/cover-art.ts`
- Create: `src/sources/cover-art.test.ts`

- [ ] **Step 1: Write failing cover art tests**

Create `src/sources/cover-art.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
vp test --run src/sources/cover-art.test.ts
```

Expected: fail because `src/sources/cover-art.ts` does not exist.

- [ ] **Step 3: Implement cover art adapter**

Create `src/sources/cover-art.ts`:

```ts
import type { AlbumDraftInput } from "../domain/album";

type Fetcher = typeof fetch;

interface CoverArtImage {
  front?: boolean;
  image?: string;
  thumbnails?: {
    large?: string;
    small?: string;
  };
}

interface CoverArtResponse {
  images?: CoverArtImage[];
}

export async function findCoverArt(
  releaseGroupId: string,
  fetcher: Fetcher = fetch,
): Promise<AlbumDraftInput> {
  const id = releaseGroupId.trim();

  if (!id) {
    return { artworkUrl: "", artworkSource: "remote" };
  }

  const response = await fetcher(
    `https://coverartarchive.org/release-group/${encodeURIComponent(id)}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (response.status === 404) {
    return { artworkUrl: "", artworkSource: "remote" };
  }

  if (!response.ok) {
    throw new Error(`Cover art lookup failed with status ${response.status}`);
  }

  const data = (await response.json()) as CoverArtResponse;
  const images = data.images ?? [];
  const selected = images.find((image) => image.front) ?? images[0];
  const artworkUrl = selected?.thumbnails?.large ?? selected?.image ?? "";

  return {
    artworkUrl,
    artworkSource: artworkUrl ? "cover-art-archive" : "remote",
  };
}
```

- [ ] **Step 4: Run cover art tests**

Run:

```bash
vp test --run src/sources/cover-art.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit cover art adapter**

Run:

```bash
git add src/sources/cover-art.ts src/sources/cover-art.test.ts
git commit -m "feat: add cover art lookup"
```

Expected: one commit with adapter and tests.

### Task 5: Add draft editing helpers

**Files:**

- Create: `src/editor/draft.ts`
- Create: `src/editor/draft.test.ts`

- [ ] **Step 1: Write failing draft editor tests**

Create `src/editor/draft.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAlbumDraft } from "../domain/album";
import { applyDraftPatch, createPosterMetadataLine, mergeFetchedAlbum } from "./draft";

describe("draft editing helpers", () => {
  it("merges fetched album data into a new draft", () => {
    const draft = mergeFetchedAlbum(createAlbumDraft({ title: "Old" }), {
      title: "Kids See Ghosts",
      artist: "Kanye West & Kid Cudi",
      releaseDate: "2018-06-08",
      source: "musicbrainz",
      sourceId: "rg-1",
    });

    expect(draft.title).toBe("Kids See Ghosts");
    expect(draft.artist).toBe("Kanye West & Kid Cudi");
    expect(draft.releaseDate).toBe("2018-06-08");
    expect(draft.source).toBe("musicbrainz");
    expect(draft.sourceId).toBe("rg-1");
  });

  it("applies manual overrides without mutating the previous draft", () => {
    const original = createAlbumDraft({ title: "Fetched", artist: "Artist" });
    const edited = applyDraftPatch(original, { title: "My Version" });

    expect(original.title).toBe("Fetched");
    expect(edited.title).toBe("My Version");
    expect(edited.artist).toBe("Artist");
  });

  it("creates a readable metadata line", () => {
    expect(createPosterMetadataLine("2018-06-08", "Kanye West & Kid Cudi")).toBe(
      "Released: June 8, 2018 · Kanye West & Kid Cudi",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
vp test --run src/editor/draft.test.ts
```

Expected: fail because `src/editor/draft.ts` does not exist.

- [ ] **Step 3: Implement draft editing helpers**

Create `src/editor/draft.ts`:

```ts
import { createAlbumDraft, type AlbumDraft, type AlbumDraftInput } from "../domain/album";

export function mergeFetchedAlbum(current: AlbumDraft, fetched: AlbumDraftInput): AlbumDraft {
  return createAlbumDraft({
    ...current,
    ...fetched,
    id: current.id,
    metadataLine: createPosterMetadataLine(
      fetched.releaseDate ?? current.releaseDate,
      fetched.artist ?? current.artist,
    ),
  });
}

export function applyDraftPatch(current: AlbumDraft, patch: AlbumDraftInput): AlbumDraft {
  return createAlbumDraft({
    ...current,
    ...patch,
    id: current.id,
  });
}

export function createPosterMetadataLine(releaseDate: string, artist: string): string {
  const parts = [];
  const formattedDate = formatReleaseDate(releaseDate);

  if (formattedDate) {
    parts.push(`Released: ${formattedDate}`);
  }

  if (artist.trim()) {
    parts.push(artist.trim());
  }

  return parts.join(" · ");
}

function formatReleaseDate(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const date = new Date(`${trimmed}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
```

- [ ] **Step 4: Run draft editor tests**

Run:

```bash
vp test --run src/editor/draft.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit draft helpers**

Run:

```bash
git add src/editor/draft.ts src/editor/draft.test.ts
git commit -m "feat: add poster draft editing helpers"
```

Expected: one commit with draft editing helpers and tests.

### Task 6: Add image upload and palette utilities

**Files:**

- Create: `src/media/image-upload.ts`
- Create: `src/media/image-upload.test.ts`
- Create: `src/media/palette.ts`
- Create: `src/media/palette.test.ts`

- [ ] **Step 1: Write failing upload tests**

Create `src/media/image-upload.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateArtworkFile } from "./image-upload";

describe("validateArtworkFile", () => {
  it("accepts common image files under the size limit", () => {
    const file = new File(["image"], "cover.png", { type: "image/png" });

    expect(validateArtworkFile(file)).toEqual({ ok: true, message: "" });
  });

  it("rejects non-image files", () => {
    const file = new File(["text"], "notes.txt", { type: "text/plain" });

    expect(validateArtworkFile(file)).toEqual({
      ok: false,
      message: "Choose a PNG, JPEG, or WebP image.",
    });
  });

  it("rejects files above 15 MB", () => {
    const file = new File([new Uint8Array(16 * 1024 * 1024)], "huge.jpg", { type: "image/jpeg" });

    expect(validateArtworkFile(file)).toEqual({
      ok: false,
      message: "Choose an image smaller than 15 MB.",
    });
  });
});
```

- [ ] **Step 2: Write failing palette tests**

Create `src/media/palette.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { quantizePixelsToPalette, rgbToHex } from "./palette";

describe("palette helpers", () => {
  it("converts RGB values to hex", () => {
    expect(rgbToHex(242, 140, 40)).toBe("#f28c28");
  });

  it("quantizes pixels into up to six stable colors", () => {
    const pixels = new Uint8ClampedArray([
      242, 140, 40, 255, 242, 140, 40, 255, 192, 36, 101, 255, 33, 136, 155, 255, 23, 36, 92, 255,
      255, 255, 255, 0,
    ]);

    expect(quantizePixelsToPalette(pixels)).toEqual(["#f08c28", "#c02468", "#20889c", "#18245c"]);
  });
});
```

- [ ] **Step 3: Run media tests to verify failure**

Run:

```bash
vp test --run src/media/image-upload.test.ts src/media/palette.test.ts
```

Expected: fail because implementation files do not exist.

- [ ] **Step 4: Implement image upload validation**

Create `src/media/image-upload.ts`:

```ts
export interface ValidationResult {
  ok: boolean;
  message: string;
}

const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxArtworkBytes = 15 * 1024 * 1024;

export function validateArtworkFile(file: File): ValidationResult {
  if (!acceptedTypes.has(file.type)) {
    return { ok: false, message: "Choose a PNG, JPEG, or WebP image." };
  }

  if (file.size > maxArtworkBytes) {
    return { ok: false, message: "Choose an image smaller than 15 MB." };
  }

  return { ok: true, message: "" };
}

export function createArtworkObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}
```

- [ ] **Step 5: Implement palette helpers**

Create `src/media/palette.ts`:

```ts
import { defaultPalette } from "../domain/album";

export function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function quantizePixelsToPalette(pixels: Uint8ClampedArray, maxColors = 6): string[] {
  const buckets = new Map<string, number>();

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;

    if (alpha < 128) {
      continue;
    }

    const red = quantizeChannel(pixels[index] ?? 0);
    const green = quantizeChannel(pixels[index + 1] ?? 0);
    const blue = quantizeChannel(pixels[index + 2] ?? 0);
    const color = rgbToHex(red, green, blue);
    buckets.set(color, (buckets.get(color) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color)
    .slice(0, maxColors);
}

export async function extractPaletteFromImage(url: string, maxColors = 6): Promise<string[]> {
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return defaultPalette;
  }

  const size = 96;
  canvas.width = size;
  canvas.height = size;
  context.drawImage(image, 0, 0, size, size);

  const palette = quantizePixelsToPalette(context.getImageData(0, 0, size, size).data, maxColors);
  return palette.length > 0 ? palette : defaultPalette;
}

function quantizeChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value / 4) * 4));
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Image could not be loaded for palette extraction.")),
    );
    image.src = url;
  });
}
```

- [ ] **Step 6: Run media tests**

Run:

```bash
vp test --run src/media/image-upload.test.ts src/media/palette.test.ts
```

Expected: all tests pass.

- [ ] **Step 7: Commit media utilities**

Run:

```bash
git add src/media/image-upload.ts src/media/image-upload.test.ts src/media/palette.ts src/media/palette.test.ts
git commit -m "feat: add artwork upload and palette utilities"
```

Expected: one commit with media utilities and tests.

### Task 7: Add export presets

**Files:**

- Create: `src/export/presets.ts`
- Create: `src/export/presets.test.ts`

- [ ] **Step 1: Write failing preset tests**

Create `src/export/presets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createExportFilename, exportPresets, getExportPreset } from "./presets";

describe("export presets", () => {
  it("defines initial print presets at 300 DPI", () => {
    expect(exportPresets.map((preset) => preset.id)).toEqual([
      "a4-portrait",
      "a3-portrait",
      "poster-12x18",
      "square",
    ]);
    expect(getExportPreset("a4-portrait")).toMatchObject({
      widthPx: 2480,
      heightPx: 3508,
      dpi: 300,
    });
    expect(getExportPreset("a3-portrait")).toMatchObject({
      widthPx: 3508,
      heightPx: 4961,
      dpi: 300,
    });
  });

  it("creates safe lowercase filenames", () => {
    expect(
      createExportFilename(
        "Kanye West & Kid Cudi",
        "Kids See Ghosts",
        getExportPreset("a4-portrait"),
      ),
    ).toBe("kanye-west-kid-cudi-kids-see-ghosts-a4.png");
  });
});
```

- [ ] **Step 2: Run preset tests to verify failure**

Run:

```bash
vp test --run src/export/presets.test.ts
```

Expected: fail because `src/export/presets.ts` does not exist.

- [ ] **Step 3: Implement export presets**

Create `src/export/presets.ts`:

```ts
export type ExportPresetId = "a4-portrait" | "a3-portrait" | "poster-12x18" | "square";

export interface ExportPreset {
  id: ExportPresetId;
  label: string;
  widthIn: number;
  heightIn: number;
  widthPx: number;
  heightPx: number;
  dpi: number;
  filenameSuffix: string;
}

export const exportPresets: ExportPreset[] = [
  {
    id: "a4-portrait",
    label: "A4 Portrait",
    widthIn: 8.27,
    heightIn: 11.69,
    widthPx: 2480,
    heightPx: 3508,
    dpi: 300,
    filenameSuffix: "a4",
  },
  {
    id: "a3-portrait",
    label: "A3 Portrait",
    widthIn: 11.69,
    heightIn: 16.54,
    widthPx: 3508,
    heightPx: 4961,
    dpi: 300,
    filenameSuffix: "a3",
  },
  {
    id: "poster-12x18",
    label: "12×18 Poster",
    widthIn: 12,
    heightIn: 18,
    widthPx: 3600,
    heightPx: 5400,
    dpi: 300,
    filenameSuffix: "12x18",
  },
  {
    id: "square",
    label: "Square Poster",
    widthIn: 12,
    heightIn: 12,
    widthPx: 3600,
    heightPx: 3600,
    dpi: 300,
    filenameSuffix: "square",
  },
];

export function getExportPreset(id: ExportPresetId): ExportPreset {
  const preset = exportPresets.find((item) => item.id === id);

  if (!preset) {
    throw new Error(`Unknown export preset: ${id}`);
  }

  return preset;
}

export function createExportFilename(artist: string, title: string, preset: ExportPreset): string {
  const base = [artist, title, preset.filenameSuffix].map(slugify).filter(Boolean).join("-");

  return `${base || "album-poster"}.png`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Run preset tests**

Run:

```bash
vp test --run src/export/presets.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit export presets**

Run:

```bash
git add src/export/presets.ts src/export/presets.test.ts
git commit -m "feat: add print export presets"
```

Expected: one commit with export presets and tests.

### Task 8: Add poster preview template

**Files:**

- Create: `src/components/PosterPreview.vue`
- Create: `src/components/PosterPreview.test.ts`
- Modify: `src/style.css`

- [ ] **Step 1: Write failing poster preview test**

Create `src/components/PosterPreview.test.ts`:

```ts
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createAlbumDraft } from "../domain/album";
import PosterPreview from "./PosterPreview.vue";

describe("PosterPreview", () => {
  it("renders album poster content and palette swatches", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          title: "Kids See Ghosts",
          artist: "Kanye West & Kid Cudi",
          releaseDate: "2018-06-08",
          metadataLine: "Released: June 8, 2018 · Kanye West & Kid Cudi",
          artworkUrl: "https://example.com/cover.jpg",
          palette: ["#f28c28", "#c02465", "#f4a35d", "#a98cbd", "#21889b", "#17245c"],
        }),
      },
    });

    expect(wrapper.text()).toContain("Kids See Ghosts");
    expect(wrapper.text()).toContain("Kanye West & Kid Cudi");
    expect(wrapper.find("img").attributes("src")).toBe("https://example.com/cover.jpg");
    expect(wrapper.findAll(".poster-swatch")).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run poster preview test to verify failure**

Run:

```bash
vp test --run src/components/PosterPreview.test.ts
```

Expected: fail because `PosterPreview.vue` does not exist.

- [ ] **Step 3: Implement poster preview component**

Create `src/components/PosterPreview.vue`:

```vue
<script setup lang="ts">
import type { AlbumDraft } from "../domain/album";

defineProps<{
  draft: AlbumDraft;
}>();
</script>

<template>
  <article class="poster-page" aria-label="Album poster preview">
    <div class="poster-art-frame">
      <img
        v-if="draft.artworkUrl"
        :src="draft.artworkUrl"
        :alt="`${draft.title || 'Album'} artwork`"
        class="poster-art"
      />
      <div v-else class="poster-art poster-art-empty">
        <span>Add artwork</span>
      </div>
    </div>

    <section class="poster-caption">
      <h2>{{ draft.title || "Untitled Album" }}</h2>
      <p class="poster-artist">{{ draft.artist || "Unknown Artist" }}</p>
      <div class="poster-rule" />
      <div class="poster-meta-row">
        <p>{{ draft.metadataLine || draft.releaseDate || "Release date" }}</p>
        <div class="poster-swatches" aria-label="Poster palette">
          <span
            v-for="color in draft.palette"
            :key="color"
            class="poster-swatch"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>
    </section>
  </article>
</template>
```

- [ ] **Step 4: Append poster CSS**

Append to `src/style.css`:

```css
.poster-page {
  width: min(100%, 720px);
  aspect-ratio: 2480 / 3508;
  padding: 7.2%;
  color: var(--ink);
  background:
    radial-gradient(circle at 50% 14%, rgba(255, 255, 255, 0.9), transparent 34%), var(--paper);
  box-shadow: 0 32px 100px rgba(23, 23, 23, 0.18);
}

.poster-art-frame {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #e7ded0;
}

.poster-art {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-art-empty {
  display: grid;
  place-items: center;
  color: var(--muted);
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.poster-caption {
  padding-top: 7.5%;
}

.poster-caption h2 {
  margin: 0;
  font-size: clamp(2.6rem, 8vw, 5.8rem);
  line-height: 0.88;
  letter-spacing: -0.07em;
  text-transform: uppercase;
}

.poster-artist {
  margin: 2.4% 0 0;
  font-size: clamp(1.1rem, 2.8vw, 2rem);
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.poster-rule {
  margin: 3.6% 0;
  border-top: 2px solid var(--ink);
}

.poster-meta-row {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.poster-meta-row p {
  margin: 0;
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  line-height: 1.5;
  text-transform: uppercase;
}

.poster-swatches {
  display: flex;
  gap: 14px;
}

.poster-swatch {
  display: block;
  width: clamp(24px, 4vw, 44px);
  aspect-ratio: 1;
}
```

- [ ] **Step 5: Run poster preview test**

Run:

```bash
vp test --run src/components/PosterPreview.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit poster template**

Run:

```bash
git add src/components/PosterPreview.vue src/components/PosterPreview.test.ts src/style.css
git commit -m "feat: add album poster preview template"
```

Expected: one commit with the poster template and test.

### Task 9: Add editor/search UI flow

**Files:**

- Create: `src/components/AlbumSearch.vue`
- Create: `src/components/AlbumEditor.vue`
- Create: `src/components/ExportPanel.vue`
- Create: `src/components/AppFlow.test.ts`
- Modify: `src/App.vue`
- Modify: `src/style.css`

- [ ] **Step 1: Write failing app flow test**

Create `src/components/AppFlow.test.ts`:

```ts
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import App from "../App.vue";

vi.mock("../sources/musicbrainz", () => ({
  searchMusicBrainzAlbums: vi.fn().mockResolvedValue([
    {
      title: "Kids See Ghosts",
      artist: "Kanye West & Kid Cudi",
      releaseDate: "2018-06-08",
      source: "musicbrainz",
      sourceId: "rg-1",
    },
  ]),
}));

vi.mock("../sources/cover-art", () => ({
  findCoverArt: vi.fn().mockResolvedValue({
    artworkUrl: "https://example.com/front.jpg",
    artworkSource: "cover-art-archive",
  }),
}));

describe("App flow", () => {
  it("searches, selects a result, and allows manual title override", async () => {
    const wrapper = mount(App);

    await wrapper.find('[data-test="search-input"]').setValue("kids see ghosts");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    await wrapper.find('[data-test="result-0"]').trigger("click");
    await Promise.resolve();

    expect(wrapper.text()).toContain("Kids See Ghosts");

    await wrapper.find('[data-test="title-input"]').setValue("My Custom Poster Title");

    expect(wrapper.text()).toContain("My Custom Poster Title");
  });
});
```

- [ ] **Step 2: Run flow test to verify failure**

Run:

```bash
vp test --run src/components/AppFlow.test.ts
```

Expected: fail because UI components do not exist or App is still the shell.

- [ ] **Step 3: Implement `AlbumSearch.vue`**

Create `src/components/AlbumSearch.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { AlbumDraftInput } from "../domain/album";
import { searchMusicBrainzAlbums } from "../sources/musicbrainz";

const emit = defineEmits<{
  select: [album: AlbumDraftInput];
}>();

const query = ref("");
const results = ref<AlbumDraftInput[]>([]);
const status = ref("");
const loading = ref(false);

async function search(): Promise<void> {
  loading.value = true;
  status.value = "";

  try {
    results.value = await searchMusicBrainzAlbums(query.value);
    status.value = results.value.length
      ? `${results.value.length} result${results.value.length === 1 ? "" : "s"} found.`
      : "No results found. Start manually or adjust the query.";
  } catch (error) {
    status.value = error instanceof Error ? error.message : "MusicBrainz search failed.";
    results.value = [];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="control-card">
    <h2>Find album data</h2>
    <form data-test="search-form" class="search-form" @submit.prevent="search">
      <label>
        Album search
        <input
          data-test="search-input"
          v-model="query"
          type="search"
          aria-label="Album search example: Kids See Ghosts"
        />
      </label>
      <button type="submit" :disabled="loading">{{ loading ? "Searching…" : "Search" }}</button>
    </form>
    <p v-if="status" class="status-text">{{ status }}</p>
    <div class="results-list">
      <button
        v-for="(result, index) in results"
        :key="`${result.sourceId}-${index}`"
        :data-test="`result-${index}`"
        type="button"
        class="result-button"
        @click="emit('select', result)"
      >
        <strong>{{ result.title }}</strong>
        <span
          >{{ result.artist || "Unknown artist" }} ·
          {{ result.releaseDate || "Unknown date" }}</span
        >
      </button>
    </div>
  </section>
</template>
```

- [ ] **Step 4: Implement `AlbumEditor.vue`**

Create `src/components/AlbumEditor.vue`:

```vue
<script setup lang="ts">
import type { AlbumDraft } from "../domain/album";
import { createArtworkObjectUrl, validateArtworkFile } from "../media/image-upload";

const props = defineProps<{
  draft: AlbumDraft;
}>();

const emit = defineEmits<{
  patch: [patch: Partial<AlbumDraft>];
}>();

function updateField(
  field: keyof Pick<AlbumDraft, "title" | "artist" | "releaseDate" | "metadataLine" | "artworkUrl">,
  event: Event,
): void {
  const target = event.target as HTMLInputElement;
  emit("patch", { [field]: target.value });
}

function updatePalette(index: number, event: Event): void {
  const target = event.target as HTMLInputElement;
  const palette = [...props.draft.palette];
  palette[index] = target.value;
  emit("patch", { palette });
}

function uploadArtwork(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  const result = validateArtworkFile(file);

  if (!result.ok) {
    window.alert(result.message);
    target.value = "";
    return;
  }

  emit("patch", { artworkUrl: createArtworkObjectUrl(file), artworkSource: "manual" });
}
</script>

<template>
  <section class="control-card">
    <h2>Edit poster</h2>
    <div class="field-grid">
      <label>
        Title
        <input data-test="title-input" :value="draft.title" @input="updateField('title', $event)" />
      </label>
      <label>
        Artist
        <input :value="draft.artist" @input="updateField('artist', $event)" />
      </label>
      <label>
        Release date
        <input
          :value="draft.releaseDate"
          aria-label="Release date, for example 2018-06-08"
          @input="updateField('releaseDate', $event)"
        />
      </label>
      <label>
        Metadata line
        <input :value="draft.metadataLine" @input="updateField('metadataLine', $event)" />
      </label>
      <label>
        Artwork URL
        <input :value="draft.artworkUrl" @input="updateField('artworkUrl', $event)" />
      </label>
      <label>
        Upload artwork
        <input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadArtwork" />
      </label>
    </div>
    <div class="palette-editor" aria-label="Palette editor">
      <label v-for="(color, index) in draft.palette" :key="`${color}-${index}`">
        Swatch {{ index + 1 }}
        <input type="color" :value="color" @input="updatePalette(index, $event)" />
      </label>
    </div>
  </section>
</template>
```

- [ ] **Step 5: Implement `ExportPanel.vue`**

Create `src/components/ExportPanel.vue`:

```vue
<script setup lang="ts">
import { exportPresets, type ExportPresetId } from "../export/presets";

defineProps<{
  selectedPresetId: ExportPresetId;
  exporting: boolean;
}>();

const emit = defineEmits<{
  selectPreset: [presetId: ExportPresetId];
  exportPoster: [];
}>();
</script>

<template>
  <section class="control-card">
    <h2>Export</h2>
    <label>
      Print preset
      <select
        :value="selectedPresetId"
        @change="emit('selectPreset', ($event.target as HTMLSelectElement).value as ExportPresetId)"
      >
        <option v-for="preset in exportPresets" :key="preset.id" :value="preset.id">
          {{ preset.label }} · {{ preset.widthPx }}×{{ preset.heightPx }} px
        </option>
      </select>
    </label>
    <button
      data-test="export-button"
      type="button"
      :disabled="exporting"
      @click="emit('exportPoster')"
    >
      {{ exporting ? "Exporting…" : "Export PNG" }}
    </button>
  </section>
</template>
```

- [ ] **Step 6: Replace `App.vue` with integrated flow**

Write `src/App.vue` exactly as:

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import AlbumEditor from "./components/AlbumEditor.vue";
import AlbumSearch from "./components/AlbumSearch.vue";
import ExportPanel from "./components/ExportPanel.vue";
import PosterPreview from "./components/PosterPreview.vue";
import {
  createAlbumDraft,
  createEmptyAlbumDraft,
  type AlbumDraft,
  type AlbumDraftInput,
} from "./domain/album";
import { applyDraftPatch, mergeFetchedAlbum } from "./editor/draft";
import { type ExportPresetId, getExportPreset } from "./export/presets";
import { findCoverArt } from "./sources/cover-art";

const draft = ref<AlbumDraft>(createEmptyAlbumDraft());
const selectedPresetId = ref<ExportPresetId>("a4-portrait");
const exporting = ref(false);
const status = ref("");
const selectedPreset = computed(() => getExportPreset(selectedPresetId.value));

async function selectAlbum(album: AlbumDraftInput): Promise<void> {
  draft.value = mergeFetchedAlbum(draft.value, album);
  status.value = "Album data loaded. You can override every field.";

  if (album.sourceId) {
    try {
      draft.value = applyDraftPatch(draft.value, await findCoverArt(album.sourceId));
    } catch (error) {
      status.value =
        error instanceof Error ? error.message : "Artwork lookup failed. Add artwork manually.";
    }
  }
}

function startManual(): void {
  draft.value = createAlbumDraft();
  status.value = "Manual draft ready.";
}

function patchDraft(patch: Partial<AlbumDraft>): void {
  draft.value = applyDraftPatch(draft.value, patch);
}

async function exportPoster(): Promise<void> {
  exporting.value = true;
  status.value = `Export target: ${selectedPreset.value.label}. PNG export is wired in the export task.`;
  exporting.value = false;
}
</script>

<template>
  <main class="app-shell app-grid">
    <section class="workspace-panel controls-column">
      <div class="hero-panel compact">
        <p class="eyebrow">Album Poster Generator</p>
        <h1>Make print-ready album posters.</h1>
        <p class="hero-copy">
          Fetch metadata, override anything, and keep the poster browser-only.
        </p>
        <button type="button" @click="startManual">Start manually</button>
      </div>
      <AlbumSearch @select="selectAlbum" />
      <AlbumEditor :draft="draft" @patch="patchDraft" />
      <ExportPanel
        :selected-preset-id="selectedPresetId"
        :exporting="exporting"
        @select-preset="selectedPresetId = $event"
        @export-poster="exportPoster"
      />
      <p v-if="status" class="status-text">{{ status }}</p>
    </section>
    <section class="workspace-panel preview-column">
      <PosterPreview :draft="draft" />
    </section>
  </main>
</template>
```

- [ ] **Step 7: Append UI CSS**

Append to `src/style.css`:

```css
.app-grid {
  display: grid;
  grid-template-columns: minmax(320px, 520px) minmax(420px, 1fr);
  gap: 32px;
  align-items: start;
}

.workspace-panel {
  min-width: 0;
}

.controls-column {
  display: grid;
  gap: 18px;
}

.preview-column {
  position: sticky;
  top: 32px;
  display: grid;
  place-items: center;
}

.hero-panel.compact {
  padding: 28px;
  border-radius: 22px;
}

.hero-panel.compact h1 {
  font-size: clamp(2rem, 5vw, 3.6rem);
}

.control-card {
  display: grid;
  gap: 16px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--panel);
}

.control-card h2 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.search-form,
.field-grid {
  display: grid;
  gap: 12px;
}

label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

input,
select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.72);
}

button {
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  color: #fffaf0;
  background: var(--ink);
  font-weight: 800;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.status-text {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.results-list,
.palette-editor {
  display: grid;
  gap: 10px;
}

.result-button {
  display: grid;
  gap: 4px;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.6);
  text-align: left;
}

.result-button span {
  color: var(--muted);
  font-size: 0.9rem;
}

.palette-editor {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 980px) {
  .app-shell {
    padding: 24px;
  }

  .app-grid {
    grid-template-columns: 1fr;
  }

  .preview-column {
    position: static;
  }
}
```

- [ ] **Step 8: Run app flow test**

Run:

```bash
vp test --run src/components/AppFlow.test.ts src/components/PosterPreview.test.ts
```

Expected: all tests pass.

- [ ] **Step 9: Commit UI flow**

Run:

```bash
git add src/App.vue src/components/AlbumSearch.vue src/components/AlbumEditor.vue src/components/ExportPanel.vue src/components/AppFlow.test.ts src/style.css
git commit -m "feat: add album poster editor flow"
```

Expected: one commit with the working search/edit/preview flow.

### Task 10: Add PNG export engine

**Files:**

- Create: `src/export/png.ts`
- Create: `src/export/png.test.ts`
- Modify: `src/App.vue`
- Modify: `src/components/PosterPreview.vue`

- [ ] **Step 1: Write failing PNG export tests**

Create `src/export/png.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportElementAsPng } from "./png";
import { getExportPreset } from "./presets";

vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
}));

const appendChild = vi.spyOn(document.body, "appendChild");
const removeChild = vi.spyOn(document.body, "removeChild");

beforeEach(() => {
  appendChild.mockClear();
  removeChild.mockClear();
});

describe("exportElementAsPng", () => {
  it("exports an element with preset dimensions and downloads the result", async () => {
    const anchorClicks: string[] = [];
    const createElement = vi.spyOn(document, "createElement");
    createElement.mockImplementation((tagName: string) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tagName,
      ) as HTMLElement;
      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          value: () => anchorClicks.push("clicked"),
        });
      }
      return element as never;
    });

    const element = document.createElement("article");
    const preset = getExportPreset("a4-portrait");

    await exportElementAsPng(element, preset, "poster.png");

    const { toPng } = await import("html-to-image");
    expect(toPng).toHaveBeenCalledWith(element, {
      cacheBust: true,
      pixelRatio: 1,
      width: 2480,
      height: 3508,
      style: {
        width: "2480px",
        height: "3508px",
      },
    });
    expect(anchorClicks).toEqual(["clicked"]);
    createElement.mockRestore();
  });
});
```

- [ ] **Step 2: Run PNG export test to verify failure**

Run:

```bash
vp test --run src/export/png.test.ts
```

Expected: fail because `src/export/png.ts` does not exist.

- [ ] **Step 3: Implement PNG export engine**

Create `src/export/png.ts`:

```ts
import { toPng } from "html-to-image";
import type { ExportPreset } from "./presets";

export async function exportElementAsPng(
  element: HTMLElement,
  preset: ExportPreset,
  filename: string,
): Promise<void> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 1,
    width: preset.widthPx,
    height: preset.heightPx,
    style: {
      width: `${preset.widthPx}px`,
      height: `${preset.heightPx}px`,
    },
  });

  downloadDataUrl(dataUrl, filename);
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

- [ ] **Step 4: Expose poster element ref from `PosterPreview.vue`**

Modify `src/components/PosterPreview.vue` so the root article has the export test id and still contains the same content:

```vue
<script setup lang="ts">
import type { AlbumDraft } from "../domain/album";

defineProps<{
  draft: AlbumDraft;
}>();
</script>

<template>
  <article data-export-poster class="poster-page" aria-label="Album poster preview">
    <div class="poster-art-frame">
      <img
        v-if="draft.artworkUrl"
        :src="draft.artworkUrl"
        :alt="`${draft.title || 'Album'} artwork`"
        class="poster-art"
      />
      <div v-else class="poster-art poster-art-empty">
        <span>Add artwork</span>
      </div>
    </div>

    <section class="poster-caption">
      <h2>{{ draft.title || "Untitled Album" }}</h2>
      <p class="poster-artist">{{ draft.artist || "Unknown Artist" }}</p>
      <div class="poster-rule" />
      <div class="poster-meta-row">
        <p>{{ draft.metadataLine || draft.releaseDate || "Release date" }}</p>
        <div class="poster-swatches" aria-label="Poster palette">
          <span
            v-for="color in draft.palette"
            :key="color"
            class="poster-swatch"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>
    </section>
  </article>
</template>
```

- [ ] **Step 5: Wire export in `App.vue`**

Replace `src/App.vue` with:

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import AlbumEditor from "./components/AlbumEditor.vue";
import AlbumSearch from "./components/AlbumSearch.vue";
import ExportPanel from "./components/ExportPanel.vue";
import PosterPreview from "./components/PosterPreview.vue";
import {
  createAlbumDraft,
  createEmptyAlbumDraft,
  type AlbumDraft,
  type AlbumDraftInput,
} from "./domain/album";
import { applyDraftPatch, mergeFetchedAlbum } from "./editor/draft";
import { createExportFilename, type ExportPresetId, getExportPreset } from "./export/presets";
import { exportElementAsPng } from "./export/png";
import { findCoverArt } from "./sources/cover-art";

const draft = ref<AlbumDraft>(createEmptyAlbumDraft());
const selectedPresetId = ref<ExportPresetId>("a4-portrait");
const exporting = ref(false);
const status = ref("");
const selectedPreset = computed(() => getExportPreset(selectedPresetId.value));

async function selectAlbum(album: AlbumDraftInput): Promise<void> {
  draft.value = mergeFetchedAlbum(draft.value, album);
  status.value = "Album data loaded. You can override every field.";

  if (album.sourceId) {
    try {
      draft.value = applyDraftPatch(draft.value, await findCoverArt(album.sourceId));
    } catch (error) {
      status.value =
        error instanceof Error ? error.message : "Artwork lookup failed. Add artwork manually.";
    }
  }
}

function startManual(): void {
  draft.value = createAlbumDraft();
  status.value = "Manual draft ready.";
}

function patchDraft(patch: Partial<AlbumDraft>): void {
  draft.value = applyDraftPatch(draft.value, patch);
}

async function exportPoster(): Promise<void> {
  const posterElement = document.querySelector<HTMLElement>("[data-export-poster]");

  if (!posterElement) {
    status.value = "Poster preview is not ready to export.";
    return;
  }

  exporting.value = true;
  status.value = "Preparing PNG export…";

  try {
    await exportElementAsPng(
      posterElement,
      selectedPreset.value,
      createExportFilename(draft.value.artist, draft.value.title, selectedPreset.value),
    );
    status.value = `Exported ${selectedPreset.value.label} PNG.`;
  } catch (error) {
    status.value =
      error instanceof Error ? error.message : "PNG export failed. Try another preset.";
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <main class="app-shell app-grid">
    <section class="workspace-panel controls-column">
      <div class="hero-panel compact">
        <p class="eyebrow">Album Poster Generator</p>
        <h1>Make print-ready album posters.</h1>
        <p class="hero-copy">
          Fetch metadata, override anything, and keep the poster browser-only.
        </p>
        <button type="button" @click="startManual">Start manually</button>
      </div>
      <AlbumSearch @select="selectAlbum" />
      <AlbumEditor :draft="draft" @patch="patchDraft" />
      <ExportPanel
        :selected-preset-id="selectedPresetId"
        :exporting="exporting"
        @select-preset="selectedPresetId = $event"
        @export-poster="exportPoster"
      />
      <p v-if="status" class="status-text">{{ status }}</p>
    </section>
    <section class="workspace-panel preview-column">
      <PosterPreview :draft="draft" />
    </section>
  </main>
</template>
```

- [ ] **Step 6: Run export and flow tests**

Run:

```bash
vp test --run src/export/png.test.ts src/components/AppFlow.test.ts src/components/PosterPreview.test.ts
```

Expected: all tests pass.

- [ ] **Step 7: Commit PNG export**

Run:

```bash
git add src/export/png.ts src/export/png.test.ts src/App.vue src/components/PosterPreview.vue
git commit -m "feat: add PNG poster export"
```

Expected: one commit with PNG export wired into the app.

### Task 11: Final verification, README, and GitHub push

**Files:**

- Create: `README.md`
- Modify: files only if verification exposes a concrete bug

- [ ] **Step 1: Write README**

Create `README.md`:

````md
# Album Poster Generator

Browser-only Vue SPA for creating print-ready album posters.

## Features

- Search album metadata through MusicBrainz.
- Fetch linked cover art when available.
- Start manually when search is not useful.
- Override title, artist, release date, metadata line, artwork, and palette.
- Preview one polished reference-style poster template.
- Export PNG files for A4, A3, 12×18, and square print presets.

## Tooling

This project uses VitePlus with Vue 3, Vite, TypeScript, pnpm, Vitest, and Oxc-family checks.

## Commands

```bash
vp install
vp dev
vp test --run
vp build
vp check
```
````

## Notes

The MVP has no backend and stores no API secrets. External album data is treated as a helper; manual editing is always available.

````

- [ ] **Step 2: Run full test suite**

Run:

```bash
vp test --run
````

Expected: all tests pass.

- [ ] **Step 3: Run production build**

Run:

```bash
vp build
```

Expected: build completes and writes `dist/`.

- [ ] **Step 4: Run VitePlus checks**

Run:

```bash
vp check
```

Expected: type-aware lint/check completes without errors.

- [ ] **Step 5: Inspect final git status**

Run:

```bash
git status --short
git diff --stat
```

Expected: only `README.md` is uncommitted at this point. If verification fixes were required, the diff shows only those targeted fixes.

- [ ] **Step 6: Commit README and verification fixes**

Run:

```bash
git add README.md
git commit -m "docs: add project README"
```

If Step 5 includes targeted source/test fixes, add those exact files to the same commit before running `git commit`.

Expected: one docs commit.

- [ ] **Step 7: Push to GitHub**

Run:

```bash
git push origin main
```

Expected: GitHub repository `https://github.com/ybaspinar/album-poster-generator` receives all commits.

## Self-Review

- Spec coverage: Tasks cover VitePlus tooling, browser-only Vue SPA, MusicBrainz metadata, Cover Art Archive lookup, manual overrides, custom upload, palette editing, one polished poster template, multiple print presets, PNG export, tests, README, and GitHub push.
- Completeness scan: No banned empty markers, incomplete code steps, or unnamed files are intentionally present.
- Type consistency: `AlbumDraft`, `AlbumDraftInput`, `ExportPreset`, `ExportPresetId`, `applyDraftPatch`, `mergeFetchedAlbum`, `findCoverArt`, `searchMusicBrainzAlbums`, and `exportElementAsPng` keep the same names and signatures across tasks.
