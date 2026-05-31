# Poster Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a layout selector (Small / Medium / Large / Edge to Edge) that controls the outer padding of the poster, persisted to localStorage.

**Architecture:** Add `PosterLayout` type to domain model, bind a CSS class on `.poster-page` based on the draft's layout field, populate the Layout accordion card with a Select dropdown, and persist the preference following the existing `showTracklist` localStorage pattern.

**Tech Stack:** Vue 3, Pinia, TypeScript, shadcn-vue Select, CSS

---

### Task 1: Add PosterLayout type and default to domain model

**Files:**
- Modify: `src/domain/album.ts`

- [ ] **Step 1: Add the type and default constant**

Add after the `PosterFont` type block (after the `posterFontOptions` array, before the `AlbumDraft` interface):

```ts
export type PosterLayout = "small" | "medium" | "large" | "edge-to-edge";

export const defaultPosterLayout: PosterLayout = "medium";
```

- [ ] **Step 2: Add `layout` field to `AlbumDraftInput`**

In the `AlbumDraftInput` interface, add:

```ts
  layout?: PosterLayout;
```

- [ ] **Step 3: Add `layout` field to `AlbumDraft`**

In the `AlbumDraft` interface (after `font`):

```ts
  layout: PosterLayout;
```

- [ ] **Step 4: Add default in `createAlbumDraft`**

In the return object of `createAlbumDraft`, add:

```ts
    layout: input.layout ?? defaultPosterLayout,
```

Place it after the `font` default line.

- [ ] **Step 5: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/domain/album.ts
git commit -m "feat(domain): add PosterLayout type and default"
```

---

### Task 2: Persist layout preference in Pinia store

**Files:**
- Modify: `src/stores/album.ts`

- [ ] **Step 1: Add localStorage key constant**

After the `showTracklistPreferenceKey` declaration:

```js
const layoutPreferenceKey = "album-poster-generator:layout";
```

- [ ] **Step 2: Add read/write helpers**

After the `writeShowTracklistPreference` function:

```ts
function readLayoutPreference(): PosterLayout {
  try {
    const stored = window.localStorage.getItem(layoutPreferenceKey);
    if (stored === "small" || stored === "medium" || stored === "large" || stored === "edge-to-edge") {
      return stored;
    }
  } catch {
    // ignore
  }
  return defaultPosterLayout;
}

function writeLayoutPreference(layout: PosterLayout): void {
  try {
    window.localStorage.setItem(layoutPreferenceKey, layout);
  } catch {
    // ignore
  }
}
```

- [ ] **Step 3: Import `PosterLayout` and `defaultPosterLayout`**

Update the domain import:

```ts
import type { AlbumDraft, AlbumDraftInput, PosterLayout } from "../domain/album";
import { createAlbumDraft, defaultPosterLayout } from "../domain/album";
```

- [ ] **Step 4: Apply preference on draft creation**

Change the `draft` ref initialization to:

```ts
const draft = ref<AlbumDraft>(
  createAlbumDraft({
    showTracklist: readShowTracklistPreference(),
    layout: readLayoutPreference(),
  }),
);
```

- [ ] **Step 5: Write preference in `patchDraft`**

In the `patchDraft` function, after the `showTracklist` check block, add:

```ts
    if (typeof patch.layout === "string") {
      writeLayoutPreference(patch.layout);
    }
```

- [ ] **Step 6: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/stores/album.ts
git commit -m "feat(store): persist poster layout preference to localStorage"
```

---

### Task 3: Add layout CSS classes

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add layout override classes after the `.poster-page` block**

After the closing `}` of `.poster-page { ... }`, add:

```css
.poster-page.poster-layout-small {
  padding: 3% 4%;
}

.poster-page.poster-layout-large {
  padding: 7% 10%;
}

.poster-page.poster-layout-edge-to-edge {
  padding: 0;
}

.poster-page.poster-layout-edge-to-edge .poster-caption {
  padding: 0 3% 3%;
}
```

Note: `.poster-layout-medium` is not needed — the base `.poster-page` class already has `5.5% 7.5%`.

- [ ] **Step 2: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat(styles): add poster layout CSS classes"
```

---

### Task 4: Bind layout class in PosterPreview

**Files:**
- Modify: `src/components/PosterPreview.vue`

- [ ] **Step 1: Add a computed for the layout class**

In `<script setup>`, after the `fontClass` computed:

```ts
const layoutClass = computed(() => {
  const layout = props.draft.layout;
  if (layout === "medium") return "";
  return `poster-layout-${layout}`;
});
```

- [ ] **Step 2: Bind the class on `.poster-page`**

Change the template's `<article>` opening tag from:

```html
  <article
    data-export-poster
    class="poster-page"
    :class="fontClass"
```

To:

```html
  <article
    data-export-poster
    class="poster-page"
    :class="[fontClass, layoutClass]"
```

- [ ] **Step 3: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/PosterPreview.vue
git commit -m "feat(poster): bind layout CSS class to poster page"
```

---

### Task 5: Add Layout Select dropdown in AlbumEditor

**Files:**
- Modify: `src/components/AlbumEditor.vue`

- [ ] **Step 1: Add layout type imports**

Add to the import from `../domain/album`:

```ts
import type {
  AlbumDraft,
  PosterFont,
  PosterLayout,
  SwatchShape,
  TracklistColumns,
  TracklistSize,
} from "../domain/album";
import { posterFontOptions } from "../domain/album";
```

- [ ] **Step 2: Add the `updateLayout` handler**

After the `selectFont` function:

```ts
function updateLayout(value: string): void {
  emit("patch", { layout: value as PosterLayout });
}
```

- [ ] **Step 3: Replace the Layout accordion placeholder**

Replace the entire `<AccordionItem value="layout">...</AccordionItem>` block with:

```html
    <AccordionItem value="layout">
      <Card>
        <AccordionTrigger header="Layout" />
        <AccordionContent>
          <div class="grid gap-2 px-1">
            <Label for="poster-layout">Spacing</Label>
            <Select :model-value="draft.layout" @update:model-value="updateLayout">
              <SelectTrigger id="poster-layout" class="w-full">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="edge-to-edge">Edge to Edge</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
```

- [ ] **Step 4: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/AlbumEditor.vue
git commit -m "feat(editor): add layout select dropdown to Layout card"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run type check**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: all tests pass

- [ ] **Step 3: Commit plan file**

```bash
git add docs/superpowers/plans/2026-06-01-poster-layout.md
git commit -m "docs: add poster layout implementation plan"
```
