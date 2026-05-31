# Editable Tracklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manually editable tracklist that renders as a compact numbered list in the poster caption.

**Architecture:** Store tracklist as normalized `string[]` draft state. Use a textarea in `AlbumEditor` as the editing surface and render numbering only in `PosterPreview`.

**Tech Stack:** Vue 3 SFCs with `<script setup lang="ts">`, Vitest, Vue Test Utils, VitePlus commands (`vp test --run`, `vp check`).

---

## File Structure

- Modify `src/domain/album.ts`: add `tracklist` to `AlbumDraft` and `AlbumDraftInput`, normalize track strings in `createAlbumDraft`.
- Modify `src/domain/album.test.ts`: add tests for default and normalized tracklists.
- Modify `src/components/AlbumEditor.vue`: add textarea editing and `tracklist` patch emission.
- Modify `src/components/AlbumEditor.test.ts`: assert textarea exists and emits normalized tracks.
- Modify `src/components/PosterPreview.vue`: render numbered tracklist when tracks exist.
- Modify `src/components/PosterPreview.test.ts`: assert numbering and empty-state omission.
- Modify `src/styles/globals.css`: style the compact tracklist block under the artist.

### Task 1: Domain tracklist state

**Files:**

- Modify: `src/domain/album.ts`
- Test: `src/domain/album.test.ts`

- [ ] **Step 1: Write the failing domain tests**

Add these tests to `src/domain/album.test.ts` inside the existing `describe("album draft")` block:

```ts
it("defaults to an empty tracklist", () => {
  const draft = createAlbumDraft();

  expect(draft.tracklist).toEqual([]);
});

it("normalizes tracklist entries", () => {
  const draft = createAlbumDraft({
    tracklist: ["  Foo  ", "", "  Xox", "\t", "Last Song  "],
  });

  expect(draft.tracklist).toEqual(["Foo", "Xox", "Last Song"]);
});
```

- [ ] **Step 2: Run domain tests to verify RED**

Run:

```bash
vp test src/domain/album.test.ts --run
```

Expected: FAIL because `tracklist` is not part of `AlbumDraftInput` / `AlbumDraft` yet.

- [ ] **Step 3: Implement minimal domain support**

In `src/domain/album.ts`:

```ts
export interface AlbumDraft {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  metadataLine: string;
  artworkUrl: string;
  artworkSource: ArtworkSource;
  palette: string[];
  tracklist: string[];
  source: AlbumSource;
  sourceId: string;
  font: PosterFont;
}
```

```ts
export interface AlbumDraftInput {
  id?: string;
  title?: string;
  artist?: string;
  releaseDate?: string;
  metadataLine?: string;
  artworkUrl?: string;
  artworkSource?: ArtworkSource;
  palette?: string[];
  tracklist?: string[];
  source?: AlbumSource;
  sourceId?: string;
  font?: PosterFont;
}
```

Add `tracklist` in `createAlbumDraft`:

```ts
tracklist: normalizeTracklist(input.tracklist),
```

Add helper near `normalizePalette`:

```ts
function normalizeTracklist(tracklist: string[] | undefined): string[] {
  return tracklist?.map(normalizeAlbumText).filter(Boolean) ?? [];
}
```

- [ ] **Step 4: Run domain tests to verify GREEN**

Run:

```bash
vp test src/domain/album.test.ts --run
```

Expected: PASS.

### Task 2: Editor textarea

**Files:**

- Modify: `src/components/AlbumEditor.vue`
- Test: `src/components/AlbumEditor.test.ts`

- [ ] **Step 1: Write the failing editor test**

Add assertions to the existing `uses shadcn inputs and emits field and palette patches` test after the title input assertion:

```ts
const tracklistTextarea = wrapper.find('[data-test="tracklist-input"]');
expect(tracklistTextarea.exists()).toBe(true);
expect((tracklistTextarea.element as HTMLTextAreaElement).value).toBe("");

await tracklistTextarea.setValue("Foo\n\n  Xox  \nLast Song");
expect(wrapper.emitted("patch")?.[1]).toEqual([{ tracklist: ["Foo", "Xox", "Last Song"] }]);
```

Then update the later palette expectation index from `[1]` to `[2]` because the tracklist patch is now emitted before the palette patch.

- [ ] **Step 2: Run editor test to verify RED**

Run:

```bash
vp test src/components/AlbumEditor.test.ts --run
```

Expected: FAIL because `[data-test="tracklist-input"]` does not exist.

- [ ] **Step 3: Implement minimal editor support**

In `src/components/AlbumEditor.vue`, import `computed`:

```ts
import { computed } from "vue";
```

Add computed textarea value and normalization function in `<script setup>`:

```ts
const tracklistText = computed(() => props.draft.tracklist.join("\n"));

function updateTracklist(value: string | number): void {
  const tracklist = String(value)
    .split("\n")
    .map((track) => track.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  emit("patch", { tracklist });
}
```

Add this field after metadata line and before artwork URL:

```vue
<div class="grid gap-2">
  <Label for="poster-tracklist">Tracklist</Label>
  <textarea
    id="poster-tracklist"
    data-test="tracklist-input"
    class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
    :value="tracklistText"
    placeholder="One track per line"
    @input="updateTracklist(($event.target as HTMLTextAreaElement).value)"
  />
  <p class="text-muted-foreground text-xs">One track per line. Numbers are added on the poster.</p>
</div>
```

- [ ] **Step 4: Run editor test to verify GREEN**

Run:

```bash
vp test src/components/AlbumEditor.test.ts --run
```

Expected: PASS.

### Task 3: Poster preview rendering

**Files:**

- Modify: `src/components/PosterPreview.vue`
- Modify: `src/styles/globals.css`
- Test: `src/components/PosterPreview.test.ts`

- [ ] **Step 1: Write the failing preview tests**

Add these tests to `src/components/PosterPreview.test.ts`:

```ts
it("renders a numbered tracklist under the artist metadata", () => {
  const wrapper = mount(PosterPreview, {
    props: {
      draft: createAlbumDraft({
        artist: "Test Artist",
        tracklist: ["Foo", "Xox", "Last Song"],
      }),
    },
  });

  const tracklist = wrapper.find(".poster-tracklist");
  expect(tracklist.exists()).toBe(true);
  expect(tracklist.text()).toContain("1) Foo");
  expect(tracklist.text()).toContain("2) Xox");
  expect(tracklist.text()).toContain("3) Last Song");
});

it("does not render a tracklist block when there are no tracks", () => {
  const wrapper = mount(PosterPreview, {
    props: {
      draft: createAlbumDraft({
        artist: "Test Artist",
        tracklist: [],
      }),
    },
  });

  expect(wrapper.find(".poster-tracklist").exists()).toBe(false);
});
```

- [ ] **Step 2: Run preview tests to verify RED**

Run:

```bash
vp test src/components/PosterPreview.test.ts --run
```

Expected: FAIL because `.poster-tracklist` does not exist for non-empty tracks.

- [ ] **Step 3: Implement minimal preview markup**

In `src/components/PosterPreview.vue`, inside `.poster-meta-left` after the artist paragraph:

```vue
<ol v-if="draft.tracklist.length" class="poster-tracklist" aria-label="Tracklist">
  <li v-for="(track, index) in draft.tracklist" :key="`${track}-${index}`">
    <span>{{ index + 1 }})</span>
    <span>{{ track }}</span>
  </li>
</ol>
```

In `src/styles/globals.css`, add after `.poster-artist`:

```css
.poster-tracklist {
  display: grid;
  gap: 0.45cqw;
  max-width: 44cqw;
  margin: 1.5cqw 0 0;
  padding: 0;
  list-style: none;
  color: var(--poster-muted);
  font-size: clamp(0.58rem, 1.15cqw, 0.78rem);
  line-height: 1.25;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.poster-tracklist li {
  display: grid;
  grid-template-columns: 2.4em 1fr;
  gap: 0.5em;
}

.poster-tracklist span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 4: Run preview tests to verify GREEN**

Run:

```bash
vp test src/components/PosterPreview.test.ts --run
```

Expected: PASS.

### Task 4: Full verification

**Files:**

- Verify all modified files.

- [ ] **Step 1: Format and check**

Run:

```bash
vp fmt
vp check
```

Expected: both complete without errors.

- [ ] **Step 2: Run full test suite**

Run:

```bash
vp test --run
```

Expected: all tests pass.

- [ ] **Step 3: Review git diff**

Run:

```bash
git diff -- src/domain/album.ts src/domain/album.test.ts src/components/AlbumEditor.vue src/components/AlbumEditor.test.ts src/components/PosterPreview.vue src/components/PosterPreview.test.ts src/styles/globals.css docs/superpowers/specs/2026-05-31-editable-tracklist-design.md docs/superpowers/plans/2026-05-31-editable-tracklist.md
```

Expected: diff only contains editable tracklist support, docs, and related tests.
