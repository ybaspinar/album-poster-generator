# Poster Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new Background accordion card with background mode (Default/Solid/Gradient/Artwork) and an independent frosted blur toggle, persisted to localStorage.

**Architecture:** Extend domain model with background types/defaults, add localStorage blob read/write in the store, render backgrounds via inline styles + CSS classes on `.poster-page`, and build a new card in the editor with mode-selective controls that show/hide based on the selected mode.

**Tech Stack:** Vue 3, Pinia, TypeScript, shadcn-vue Select/Input/Checkbox, CSS custom properties

---

### Task 1: Add background types and defaults to domain model

**Files:**

- Modify: `src/domain/album.ts`

- [ ] **Step 1: Add new types and default constants**

After the `posterLayoutOptions` array (before `AlbumDraft` interface), add:

```ts
export type PosterBackgroundMode = "default" | "solid" | "gradient" | "artwork";
export type GradientDirection = "horizontal" | "vertical" | "radial";

export const defaultPosterBackgroundMode: PosterBackgroundMode = "default";
export const defaultBackgroundSolidColor = "#1a1a2e";
export const defaultBackgroundGradientFrom = "#1a1a2e";
export const defaultBackgroundGradientTo = "#16213e";
export const defaultBackgroundGradientDirection: GradientDirection = "vertical";
```

- [ ] **Step 2: Add background fields to `AlbumDraft`**

In the `AlbumDraft` interface, after `layout`:

```ts
backgroundMode: PosterBackgroundMode;
backgroundSolidColor: string;
backgroundGradientFrom: string;
backgroundGradientTo: string;
backgroundGradientDirection: GradientDirection;
backgroundBlur: boolean;
```

- [ ] **Step 3: Add background fields to `AlbumDraftInput`**

In the `AlbumDraftInput` interface, after `layout`:

```ts
  backgroundMode?: PosterBackgroundMode;
  backgroundSolidColor?: string;
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?: GradientDirection;
  backgroundBlur?: boolean;
```

- [ ] **Step 4: Add defaults in `createAlbumDraft`**

In the return object, after the `layout` line:

```ts
    backgroundMode: input.backgroundMode ?? defaultPosterBackgroundMode,
    backgroundSolidColor: input.backgroundSolidColor ?? defaultBackgroundSolidColor,
    backgroundGradientFrom: input.backgroundGradientFrom ?? defaultBackgroundGradientFrom,
    backgroundGradientTo: input.backgroundGradientTo ?? defaultBackgroundGradientTo,
    backgroundGradientDirection:
      input.backgroundGradientDirection ?? defaultBackgroundGradientDirection,
    backgroundBlur: input.backgroundBlur ?? false,
```

- [ ] **Step 5: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/domain/album.ts
git commit -m "feat(domain): add background mode types and defaults"
```

---

### Task 2: Add background localStorage persistence to Pinia store

**Files:**

- Modify: `src/stores/album.ts`

- [ ] **Step 1: Add localStorage key and helper functions**

After the `writeLayoutPreference` function, add:

```ts
const backgroundPreferenceKey = "album-poster-generator:background";

interface BackgroundSettings {
  mode: PosterBackgroundMode;
  solidColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientDirection: GradientDirection;
  blur: boolean;
}

function readBackgroundPreference(): Partial<BackgroundSettings> | null {
  try {
    const stored = window.localStorage.getItem(backgroundPreferenceKey);
    if (stored) {
      return JSON.parse(stored) as BackgroundSettings;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeBackgroundPreference(settings: BackgroundSettings): void {
  try {
    window.localStorage.setItem(backgroundPreferenceKey, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
```

- [ ] **Step 2: Import new types**

Update the domain import line to include the new types:

```ts
import type {
  AlbumDraft,
  AlbumDraftInput,
  GradientDirection,
  PosterBackgroundMode,
  PosterLayout,
} from "../domain/album";
import { createAlbumDraft, defaultPosterLayout } from "../domain/album";
```

- [ ] **Step 3: Apply saved background on draft creation**

Change the `draft` ref initialization from:

```ts
const draft = ref<AlbumDraft>(
  createAlbumDraft({
    showTracklist: readShowTracklistPreference(),
    layout: readLayoutPreference(),
  }),
);
```

To:

```ts
const savedBackground = readBackgroundPreference();
const draft = ref<AlbumDraft>(
  createAlbumDraft({
    showTracklist: readShowTracklistPreference(),
    layout: readLayoutPreference(),
    backgroundMode: savedBackground?.mode,
    backgroundSolidColor: savedBackground?.solidColor,
    backgroundGradientFrom: savedBackground?.gradientFrom,
    backgroundGradientTo: savedBackground?.gradientTo,
    backgroundGradientDirection: savedBackground?.gradientDirection,
    backgroundBlur: savedBackground?.blur,
  }),
);
```

- [ ] **Step 4: Write background settings in `patchDraft`**

After the `patch.layout` check block inside `patchDraft`, add:

```ts
if (typeof patch.backgroundMode === "string" || typeof patch.backgroundBlur === "boolean") {
  const current = draft.value;
  writeBackgroundPreference({
    mode: patch.backgroundMode ?? current.backgroundMode,
    solidColor: patch.backgroundSolidColor ?? current.backgroundSolidColor,
    gradientFrom: patch.backgroundGradientFrom ?? current.backgroundGradientFrom,
    gradientTo: patch.backgroundGradientTo ?? current.backgroundGradientTo,
    gradientDirection: patch.backgroundGradientDirection ?? current.backgroundGradientDirection,
    blur: patch.backgroundBlur ?? current.backgroundBlur,
  });
}
```

- [ ] **Step 5: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/stores/album.ts
git commit -m "feat(store): persist background settings to localStorage"
```

---

### Task 3: Add background CSS classes

**Files:**

- Modify: `src/styles/globals.css`

- [ ] **Step 1: Remove hardcoded background from `.poster-page` and add CSS custom property defaults**

Change the `.poster-page` rule to use custom properties:

```css
.poster-page {
  container-type: inline-size;
  width: min(100%, 720px);
  aspect-ratio: 2480 / 3508;
  padding: 5.5% 7.5%;
  color: var(--ink);
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: var(--paper);
  box-shadow: 0 8px 40px rgba(23, 23, 23, 0.1);
  position: relative;
  overflow: hidden;
}
```

Add after the `.poster-swatches-square` closing brace at the end of the file:

```css
/* Background: frosted blur overlay */
.poster-page.poster-bg-frosted::before {
  content: "";
  position: absolute;
  inset: 0;
  backdrop-filter: blur(18px) saturate(1.15);
  background: rgba(255, 255, 255, 0.18);
  z-index: 1;
  pointer-events: none;
}

/* Background: artwork mode */
.poster-page.poster-bg-artwork {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.poster-page.poster-bg-artwork .poster-art-frame {
  display: none;
}

/* When artwork is background, caption needs a white gradient strip for readability */
.poster-page.poster-bg-artwork .poster-caption {
  position: relative;
}

.poster-page.poster-bg-artwork .poster-caption::after {
  content: "";
  position: absolute;
  inset: -60% -7.5% -8%;
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0.92) 0%,
    rgba(255, 255, 255, 0.78) 35%,
    rgba(255, 255, 255, 0.45) 60%,
    rgba(255, 255, 255, 0) 100%
  );
  z-index: 0;
  pointer-events: none;
}

.poster-page.poster-bg-artwork .poster-caption > * {
  position: relative;
  z-index: 2;
}

/* Ensure frosted overlay stays above background but below content */
.poster-page.poster-bg-frosted > * {
  position: relative;
  z-index: 2;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat(styles): add background frosted and artwork mode CSS"
```

---

### Task 4: Render backgrounds in PosterPreview

**Files:**

- Modify: `src/components/PosterPreview.vue`

- [ ] **Step 1: Add computed for background style and classes**

After the `layoutClass` computed, add:

```ts
const backgroundStyle = computed(() => {
  const mode = props.draft.backgroundMode;
  if (mode === "solid") {
    return { background: props.draft.backgroundSolidColor };
  }
  if (mode === "gradient") {
    const from = props.draft.backgroundGradientFrom;
    const to = props.draft.backgroundGradientTo;
    const dir = props.draft.backgroundGradientDirection;
    if (dir === "horizontal") {
      return { background: `linear-gradient(to right, ${from}, ${to})` };
    }
    if (dir === "radial") {
      return { background: `radial-gradient(circle, ${from}, ${to})` };
    }
    return { background: `linear-gradient(to bottom, ${from}, ${to})` };
  }
  if (mode === "artwork" && props.draft.artworkUrl) {
    return { backgroundImage: `url(${props.draft.artworkUrl})` };
  }
  return {};
});

const backgroundClasses = computed(() => {
  const classes: string[] = [];
  if (props.draft.backgroundBlur) classes.push("poster-bg-frosted");
  if (props.draft.backgroundMode === "artwork") classes.push("poster-bg-artwork");
  return classes;
});
```

- [ ] **Step 2: Bind style and classes on `.poster-page`**

Change the `<article>` opening tag from:

```html
<article
  data-export-poster
  class="poster-page"
  :class="[fontClass, layoutClass]"
  aria-label="Album poster preview"
  :style="{ fontFamily: getFontFamily(draft.font) }"
></article>
```

To:

```html
<article
  data-export-poster
  class="poster-page"
  :class="[fontClass, layoutClass, backgroundClasses]"
  aria-label="Album poster preview"
  :style="[{ fontFamily: getFontFamily(draft.font) }, backgroundStyle]"
></article>
```

- [ ] **Step 3: Hide artwork frame when mode is artwork**

The CSS in Task 3 already handles this with `.poster-page.poster-bg-artwork .poster-art-frame { display: none; }`, so no template change needed.

- [ ] **Step 4: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/PosterPreview.vue
git commit -m "feat(poster): render background modes and frosted blur"
```

---

### Task 5: Add Background card in AlbumEditor

**Files:**

- Modify: `src/components/AlbumEditor.vue`

- [ ] **Step 1: Add new type imports**

Update the import from `../domain/album`:

```ts
import type {
  AlbumDraft,
  GradientDirection,
  PosterBackgroundMode,
  PosterFont,
  PosterLayout,
  SwatchShape,
  TracklistColumns,
  TracklistSize,
} from "../domain/album";
```

- [ ] **Step 2: Add handler functions**

After the `updateLayout` function, add:

```ts
function updateBackgroundMode(value: string): void {
  emit("patch", { backgroundMode: value as PosterBackgroundMode });
}

function updateBackgroundSolidColor(value: string | number): void {
  emit("patch", { backgroundSolidColor: String(value) });
}

function updateBackgroundGradientFrom(value: string | number): void {
  emit("patch", { backgroundGradientFrom: String(value) });
}

function updateBackgroundGradientTo(value: string | number): void {
  emit("patch", { backgroundGradientTo: String(value) });
}

function updateBackgroundGradientDirection(value: string): void {
  emit("patch", { backgroundGradientDirection: value as GradientDirection });
}

function updateBackgroundBlur(event: Event): void {
  emit("patch", { backgroundBlur: (event.target as HTMLInputElement).checked });
}
```

- [ ] **Step 3: Add Background accordion item between Swatches and Layout**

Insert a new `<AccordionItem>` between the Swatches card and the Layout card. The new card should have value `"background"`:

```html
<AccordionItem value="background">
  <Card>
    <AccordionTrigger header="Background" />
    <AccordionContent>
      <div class="grid gap-3 px-1">
        <div class="grid gap-2">
          <label for="poster-background-mode">Mode</label>
          <select :model-value="draft.backgroundMode" @update:model-value="updateBackgroundMode">
            <SelectTrigger id="poster-background-mode" class="w-full">
              <SelectValue placeholder="Select background" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="artwork">Artwork</SelectItem>
              </SelectGroup>
            </SelectContent>
          </select>
        </div>

        <div v-if="draft.backgroundMode === 'solid'" class="grid gap-2">
          <label for="poster-background-color">Background color</label>
          <input
            id="poster-background-color"
            type="color"
            class="h-10 p-1"
            :model-value="draft.backgroundSolidColor"
            @update:model-value="updateBackgroundSolidColor"
          />
        </div>

        <template v-if="draft.backgroundMode === 'gradient'">
          <div class="grid grid-cols-2 gap-3">
            <div class="grid gap-2">
              <label for="poster-bg-from">From</label>
              <input
                id="poster-bg-from"
                type="color"
                class="h-10 p-1"
                :model-value="draft.backgroundGradientFrom"
                @update:model-value="updateBackgroundGradientFrom"
              />
            </div>
            <div class="grid gap-2">
              <label for="poster-bg-to">To</label>
              <input
                id="poster-bg-to"
                type="color"
                class="h-10 p-1"
                :model-value="draft.backgroundGradientTo"
                @update:model-value="updateBackgroundGradientTo"
              />
            </div>
          </div>
          <div class="grid gap-2">
            <label for="poster-bg-direction">Direction</label>
            <select
              :model-value="draft.backgroundGradientDirection"
              @update:model-value="updateBackgroundGradientDirection"
            >
              <SelectTrigger id="poster-bg-direction" class="w-full">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                </SelectGroup>
              </SelectContent>
            </select>
          </div>
        </template>

        <div v-if="draft.backgroundMode === 'artwork'" class="text-sm text-muted-foreground">
          Album artwork will fill the poster background. Caption will remain on top.
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input
            id="poster-bg-blur"
            type="checkbox"
            class="size-4 rounded border-input accent-primary"
            :checked="draft.backgroundBlur"
            @change="updateBackgroundBlur"
          />
          <label for="poster-bg-blur" class="text-sm font-medium">Frosted overlay</label>
        </div>
      </div>
    </AccordionContent>
  </Card>
</AccordionItem>
```

- [ ] **Step 4: Update default-value to include background**

Change the `:default-value` on the `<Accordion>` from:

```html
:default-value="['info', 'tracklist', 'artwork', 'typography', 'swatches', 'layout']"
```

To:

```html
:default-value="['info', 'tracklist', 'artwork', 'typography', 'swatches', 'background', 'layout']"
```

- [ ] **Step 5: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/AlbumEditor.vue
git commit -m "feat(editor): add Background accordion card with mode controls"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run type check**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: all tests pass (update any snapshots if needed)

- [ ] **Step 3: Commit plan file**

```bash
git add docs/superpowers/plans/2026-06-01-poster-background.md
git commit -m "docs: add poster background implementation plan"
```
