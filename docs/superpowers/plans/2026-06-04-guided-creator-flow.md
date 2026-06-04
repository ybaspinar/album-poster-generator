# Guided Creator Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dense editor-first UI with a direct creator journey: search, choose model, edit with preview and tabs, export.

**Architecture:** Keep album loading/export orchestration in `App.vue`, add a focused poster model picker, and refactor `AlbumEditor.vue` from accordion sections into task tabs. Existing data services, draft merging, poster preview, export presets, and export capture stay unchanged.

**Tech Stack:** Vue 3 SFCs with `<script setup lang="ts">`, Pinia, shadcn-vue-style local UI components, Vite, Vitest, Vue Test Utils.

---

## Component Map

- `src/domain/poster-models.ts`: pure model definitions and draft patches for Standard, Frame, Basic, and Full Cover.
- `src/domain/poster-models.test.ts`: behavior tests proving every model has copy and applies a meaningful patch.
- `src/components/PosterModelPicker.vue`: visual model-card selector. Props down: selected model id. Events up: select model, back.
- `src/components/PosterModelPicker.test.ts`: verifies model cards render, select emits the id, and back emits.
- `src/components/AlbumSearch.vue`: keep search state and MusicBrainz behavior; make results artwork-first cards and add a manual-start event.
- `src/components/AlbumSearch.test.ts`: update existing expectations for card-style results and manual-start.
- `src/components/AlbumEditor.vue`: replace accordion surface with top tabs. Keep field update functions and emitted patch contract.
- `src/components/AlbumEditor.test.ts`: update around tabs exposing information, tracklist, style, and export sections.
- `src/App.vue`: own `CreatorStep`/`EditorTab`, route search → models → editor, keep edition dialog before models, embed export in editor tab.
- `src/components/AppFlow.test.ts`: cover the new user journey end-to-end.
- `src/components/AppLayout.test.ts`: update old layout assertion to the new creator shell.

---

### Task 1: Add poster model definitions

**Files:**
- Create: `src/domain/poster-models.ts`
- Create: `src/domain/poster-models.test.ts`

- [ ] **Step 1: Write the failing model tests**

Create `src/domain/poster-models.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAlbumDraft } from "./album";
import { applyPosterModel, posterModels } from "./poster-models";

describe("poster models", () => {
  it("defines four selectable creator models with stable labels", () => {
    expect(posterModels.map((model) => [model.id, model.label])).toEqual([
      ["standard", "Standard"],
      ["frame", "Frame"],
      ["basic", "Basic"],
      ["full-cover", "Full Cover"],
    ]);
  });

  it("applies model settings without replacing album identity or metadata", () => {
    const draft = createAlbumDraft({
      id: "draft-1",
      title: "Starboy",
      artist: "The Weeknd",
      releaseDate: "2016-11-25",
      tracklist: ["Starboy"],
    });

    const modelled = applyPosterModel(draft, "full-cover");

    expect(modelled.id).toBe("draft-1");
    expect(modelled.title).toBe("Starboy");
    expect(modelled.artist).toBe("The Weeknd");
    expect(modelled.backgroundMode).toBe("artwork");
    expect(modelled.layout).toBe("edge-to-edge");
  });

  it("falls back to the standard model for unknown ids", () => {
    const draft = createAlbumDraft({ id: "draft-2", layout: "large" });

    const modelled = applyPosterModel(draft, "missing");

    expect(modelled.id).toBe("draft-2");
    expect(modelled.layout).toBe("medium");
    expect(modelled.backgroundMode).toBe("default");
  });
});
```

- [ ] **Step 2: Run the failing model tests**

Run:

```bash
pnpm test --run src/domain/poster-models.test.ts
```

Expected: FAIL because `src/domain/poster-models.ts` does not exist.

- [ ] **Step 3: Implement poster models**

Create `src/domain/poster-models.ts`:

```ts
import { applyDraftPatch } from "../editor/draft";
import type { AlbumDraft, AlbumDraftInput, PosterLayout } from "./album";

export type PosterModelId = "standard" | "frame" | "basic" | "full-cover";

export interface PosterModel {
  id: PosterModelId;
  label: string;
  description: string;
  layout: PosterLayout;
  patch: AlbumDraftInput;
}

export const posterModels: PosterModel[] = [
  {
    id: "standard",
    label: "Standard",
    description: "Balanced artwork, title, metadata, tracklist, and palette.",
    layout: "medium",
    patch: {
      layout: "medium",
      backgroundMode: "default",
      showTracklist: true,
      showSwatches: true,
      swatchShape: "square",
      typography: {
        title: { size: 48, weight: 700, uppercase: true },
        artist: { size: 16, weight: 400, uppercase: true },
        metadata: { size: 13, weight: 400, uppercase: true },
        tracklist: { size: 11, weight: 400, uppercase: true },
      },
    },
  },
  {
    id: "frame",
    label: "Frame",
    description: "A cleaner framed look with generous poster margins.",
    layout: "large",
    patch: {
      layout: "large",
      backgroundMode: "solid",
      backgroundSolidColor: "#f6f1e8",
      showTracklist: true,
      showSwatches: true,
      typography: {
        title: { size: 44, weight: 800, uppercase: true },
        artist: { size: 15, weight: 500, uppercase: true },
      },
    },
  },
  {
    id: "basic",
    label: "Basic",
    description: "Minimal artwork and type for quick clean posters.",
    layout: "small",
    patch: {
      layout: "small",
      backgroundMode: "default",
      showTracklist: false,
      showSwatches: false,
      typography: {
        title: { size: 42, weight: 700, uppercase: false },
        artist: { size: 18, weight: 500, uppercase: false },
      },
    },
  },
  {
    id: "full-cover",
    label: "Full Cover",
    description: "Artwork-forward poster with the cover driving the surface.",
    layout: "edge-to-edge",
    patch: {
      layout: "edge-to-edge",
      backgroundMode: "artwork",
      backgroundBlur: true,
      backgroundBlurAmount: 12,
      showTracklist: true,
      showSwatches: false,
      typography: {
        title: { size: 52, weight: 900, uppercase: true },
        artist: { size: 18, weight: 700, uppercase: true },
        tracklist: { size: 10, weight: 500, uppercase: true },
      },
    },
  },
];

export function getPosterModel(id: string): PosterModel {
  return posterModels.find((model) => model.id === id) ?? posterModels[0];
}

export function applyPosterModel(draft: AlbumDraft, modelId: string): AlbumDraft {
  return applyDraftPatch(draft, getPosterModel(modelId).patch);
}
```

- [ ] **Step 4: Run the model tests**

Run:

```bash
pnpm test --run src/domain/poster-models.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/poster-models.ts src/domain/poster-models.test.ts
git commit -m "Add poster model presets"
```

---

### Task 2: Add visual model picker

**Files:**
- Create: `src/components/PosterModelPicker.vue`
- Create: `src/components/PosterModelPicker.test.ts`

- [ ] **Step 1: Write the failing picker tests**

Create `src/components/PosterModelPicker.test.ts`:

```ts
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PosterModelPicker from "./PosterModelPicker.vue";

describe("PosterModelPicker", () => {
  it("renders the creator models as visual cards", () => {
    const wrapper = mount(PosterModelPicker, {
      props: { selectedModelId: "standard" },
    });

    expect(wrapper.text()).toContain("Choose a poster model");
    expect(wrapper.findAll('[data-test^="poster-model-"]')).toHaveLength(4);
    expect(wrapper.find('[data-test="poster-model-standard"]').text()).toContain("Standard");
    expect(wrapper.find('[data-test="poster-model-full-cover"]').text()).toContain("Full Cover");
  });

  it("emits model selection and back navigation", async () => {
    const wrapper = mount(PosterModelPicker, {
      props: { selectedModelId: "standard" },
    });

    await wrapper.find('[data-test="poster-model-basic"]').trigger("click");
    await wrapper.find('[data-test="model-back-button"]').trigger("click");

    expect(wrapper.emitted("selectModel")?.[0]).toEqual(["basic"]);
    expect(wrapper.emitted("back")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the failing picker tests**

Run:

```bash
pnpm test --run src/components/PosterModelPicker.test.ts
```

Expected: FAIL because `PosterModelPicker.vue` does not exist.

- [ ] **Step 3: Implement `PosterModelPicker.vue`**

Create `src/components/PosterModelPicker.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { posterModels, type PosterModelId } from "../domain/poster-models";

const props = defineProps<{
  selectedModelId: PosterModelId;
}>();

const emit = defineEmits<{
  back: [];
  selectModel: [modelId: PosterModelId];
}>();

const selectedModel = computed(() => props.selectedModelId);
</script>

<template>
  <Card class="border-border/80 bg-card/92 shadow-2xl shadow-black/10 backdrop-blur">
    <CardHeader class="gap-3">
      <Button
        data-test="model-back-button"
        type="button"
        variant="ghost"
        class="w-fit gap-2 px-0 text-muted-foreground hover:text-foreground"
        @click="emit('back')"
      >
        <ArrowLeft class="size-4" />
        Back to search
      </Button>
      <div class="grid gap-1">
        <CardTitle class="text-3xl tracking-tight">Choose a poster model</CardTitle>
        <CardDescription>Select a starting point. You can still edit every field after this.</CardDescription>
      </div>
    </CardHeader>

    <CardContent class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <button
        v-for="model in posterModels"
        :key="model.id"
        :data-test="`poster-model-${model.id}`"
        type="button"
        :class="[
          'group grid gap-3 rounded-2xl border bg-background/70 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-lg',
          selectedModel === model.id ? 'border-primary ring-2 ring-primary/25' : 'border-border/70',
        ]"
        @click="emit('selectModel', model.id)"
      >
        <span class="grid aspect-[3/4] place-items-center overflow-hidden rounded-xl border border-border/70 bg-zinc-950 p-4 shadow-inner">
          <span class="grid h-full w-full content-between rounded-lg border border-white/15 bg-gradient-to-b from-zinc-800 to-zinc-950 p-3">
            <span class="mx-auto size-16 rounded-2xl bg-white/80" />
            <span class="grid gap-1">
              <span class="h-3 w-4/5 rounded-full bg-white/80" />
              <span class="h-2 w-3/5 rounded-full bg-white/50" />
              <span class="mt-2 grid grid-cols-2 gap-1">
                <span class="h-1.5 rounded-full bg-white/35" />
                <span class="h-1.5 rounded-full bg-white/35" />
                <span class="h-1.5 rounded-full bg-white/25" />
                <span class="h-1.5 rounded-full bg-white/25" />
              </span>
            </span>
          </span>
        </span>
        <span class="grid gap-1">
          <strong class="text-base text-foreground">{{ model.label }}</strong>
          <span class="text-sm text-muted-foreground">{{ model.description }}</span>
        </span>
      </button>
    </CardContent>
  </Card>
</template>
```

- [ ] **Step 4: Run picker tests**

Run:

```bash
pnpm test --run src/components/PosterModelPicker.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PosterModelPicker.vue src/components/PosterModelPicker.test.ts
git commit -m "Add poster model picker"
```

---

### Task 3: Make album search feel like a creator start

**Files:**
- Modify: `src/components/AlbumSearch.vue`
- Modify: `src/components/AlbumSearch.test.ts`

- [ ] **Step 1: Add failing search UI tests**

Update `src/components/AlbumSearch.test.ts` with this test in the existing `describe("AlbumSearch", ...)` block:

```ts
it("offers manual start and renders artwork-first result cards", async () => {
  const wrapper = mount(AlbumSearch);

  expect(wrapper.find('[data-test="manual-start-button"]').exists()).toBe(true);

  await wrapper.find('[data-test="manual-start-button"]').trigger("click");
  expect(wrapper.emitted("manualStart")).toHaveLength(1);

  await wrapper.find('[data-test="artist-input"]').setValue("the weeknd");
  await wrapper.find('[data-test="title-input"]').setValue("starboy");
  await wrapper.find('[data-test="search-form"]').trigger("submit");
  await Promise.resolve();
  await Promise.resolve();

  const result = wrapper.find('[data-test="result-0"]');
  expect(result.classes().join(" ")).toContain("rounded-2xl");
  expect(result.find("img").exists()).toBe(true);
});
```

If the file has local MusicBrainz mocks with different result data, keep the test body and adjust only the input strings so the existing mock returns at least one result with artwork.

- [ ] **Step 2: Run the failing search test**

Run:

```bash
pnpm test --run src/components/AlbumSearch.test.ts
```

Expected: FAIL because `manualStart` and `manual-start-button` are not implemented yet.

- [ ] **Step 3: Update emits and add manual start action**

In `src/components/AlbumSearch.vue`, replace the emit type with:

```ts
const emit = defineEmits<{
  manualStart: [];
  select: [album: AlbumDraftInput];
}>();
```

In the action row under the submit button, add this secondary button after the Clear button:

```vue
<Button
  data-test="manual-start-button"
  type="button"
  variant="ghost"
  class="shrink-0"
  @click="emit('manualStart')"
>
  Start manually
</Button>
```

- [ ] **Step 4: Replace dense result buttons with artwork-first cards**

In `src/components/AlbumSearch.vue`, replace the result list block beginning with `<div v-if="results.length" class="grid gap-2">` with:

```vue
<div v-if="results.length" class="grid gap-3 sm:grid-cols-2">
  <button
    v-for="(result, index) in results"
    :key="`${result.sourceId}-${index}`"
    :data-test="`result-${index}`"
    type="button"
    :class="[
      'grid overflow-hidden rounded-2xl border bg-background/80 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-lg',
      selectedIndex === index ? 'border-primary ring-2 ring-ring' : 'border-border/70',
    ]"
    @click="selectResult(result)"
  >
    <span class="grid aspect-square place-items-center overflow-hidden bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground">
      <img
        v-if="result.artworkUrl"
        :src="result.artworkUrl"
        alt=""
        class="size-full object-cover"
        loading="lazy"
      />
      <span v-else>No art</span>
    </span>
    <span class="grid min-w-0 gap-1 p-3">
      <strong class="truncate text-sm font-semibold text-foreground">{{ result.title }}</strong>
      <span class="truncate text-sm font-normal text-muted-foreground">
        {{ result.artist || "Unknown artist" }} &middot;
        {{ result.releaseDate || "Unknown date" }}
      </span>
    </span>
  </button>
</div>
```

- [ ] **Step 5: Run search tests**

Run:

```bash
pnpm test --run src/components/AlbumSearch.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/AlbumSearch.vue src/components/AlbumSearch.test.ts
git commit -m "Simplify album search start"
```

---

### Task 4: Convert AlbumEditor from accordion to top tabs

**Files:**
- Modify: `src/components/AlbumEditor.vue`
- Modify: `src/components/AlbumEditor.test.ts`

- [ ] **Step 1: Write failing editor tab tests**

Update `src/components/AlbumEditor.test.ts` to assert the tabbed surface. Add this test in the current describe block:

```ts
it("renders controls for the active editor task", async () => {
  const wrapper = mount(AlbumEditor, {
    props: {
      activeTab: "information",
      draft: createAlbumDraft({ title: "Starboy", artist: "The Weeknd" }),
    },
    global: {
      stubs: {
        SelectContent: true,
        SelectGroup: true,
        SelectItem: true,
        SelectTrigger: true,
        SelectValue: true,
      },
    },
  });

  expect(wrapper.find('[data-test="editor-panel-information"]').text()).toContain("Title");
  expect(wrapper.find('[data-test="editor-panel-tracklist"]').isVisible()).toBe(false);

  await wrapper.setProps({ activeTab: "tracklist" });
  expect(wrapper.find('[data-test="editor-panel-tracklist"]').text()).toContain("Tracklist");

  await wrapper.setProps({ activeTab: "style" });
  expect(wrapper.find('[data-test="editor-panel-style"]').text()).toContain("Font");
  expect(wrapper.find('[data-test="editor-panel-style"]').text()).toContain("Background");
});
```

- [ ] **Step 2: Run the failing editor tests**

Run:

```bash
pnpm test --run src/components/AlbumEditor.test.ts
```

Expected: FAIL because `AlbumEditor` does not accept an `activeTab` prop and still renders the accordion surface.

- [ ] **Step 3: Replace accordion imports and add active tab prop**

In `src/components/AlbumEditor.vue`, remove these imports:

```ts
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
```

Replace the props block with:

```ts
type AlbumEditorTab = "information" | "tracklist" | "style";

const props = withDefaults(
  defineProps<{
    activeTab?: AlbumEditorTab;
    draft: AlbumDraft;
  }>(),
  {
    activeTab: "information",
  },
);
```

- [ ] **Step 4: Replace accordion shell with panel shell**

In `src/components/AlbumEditor.vue`, replace the root `<Accordion ...>` opening block with:

```vue
<section class="grid gap-4" data-test="album-editor-panels">
```

Remove the closing `</Accordion>` at the bottom and close the root with:

```vue
</section>
```

- [ ] **Step 5: Convert each accordion item into one of three panels**

Use the existing field markup and update only the section wrappers:

Information panel wraps the current Info and Artwork fields:

```vue
<div v-show="props.activeTab === 'information'" data-test="editor-panel-information" class="grid gap-4">
  <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Album details</h3>
    Move the current Info field grid into this section without changing field bindings.
  </section>
  <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Artwork</h3>
    Move the current Artwork field grid into this section without changing field bindings.
  </section>
</div>
```

Tracklist panel wraps the current Tracklist fields:

```vue
<div v-show="props.activeTab === 'tracklist'" data-test="editor-panel-tracklist" class="grid gap-4">
  <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
    Move the current Tracklist field grid into this section without changing field bindings.
  </section>
</div>
```

Style panel wraps the current Typography, Swatches, Background, and Layout fields:

```vue
<div v-show="props.activeTab === 'style'" data-test="editor-panel-style" class="grid gap-4">
  <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Typography</h3>
    Move the current Typography field grid into this section without changing field bindings.
  </section>
  <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Swatches</h3>
    Move the current Swatches field grid into this section without changing field bindings.
  </section>
  <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Background</h3>
    Move the current Background field grid into this section without changing field bindings.
  </section>
  <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Layout</h3>
    Move the current Layout field grid into this section without changing field bindings.
  </section>
</div>
```

Keep all current `data-test` attributes inside the fields: `title-input`, `tracklist-input`, `show-tracklist-input`, `palette-input-*`, and `background-blur-amount-input`.

- [ ] **Step 6: Run editor tests**

Run:

```bash
pnpm test --run src/components/AlbumEditor.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/AlbumEditor.vue src/components/AlbumEditor.test.ts
git commit -m "Group album editor controls into tabs"
```

---

### Task 5: Wire the guided flow in App

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/AppFlow.test.ts`
- Modify: `src/components/AppLayout.test.ts`

- [ ] **Step 1: Write failing App flow tests**

Update `src/components/AppFlow.test.ts` to replace the first test with this journey-oriented test:

```ts
it("searches, selects an album, chooses a model, edits details, and exports from the guided flow", async () => {
  const wrapper = mount(App);

  expect(wrapper.find('[data-test="creator-search-step"]').exists()).toBe(true);
  expect(wrapper.find('[data-test="creator-models-step"]').exists()).toBe(false);
  expect(wrapper.find('[data-test="creator-editor-step"]').exists()).toBe(false);

  await wrapper.find('[data-test="artist-input"]').setValue("kanye");
  await wrapper.find('[data-test="title-input"]').setValue("kids see ghosts");
  await wrapper.find('[data-test="search-form"]').trigger("submit");
  await Promise.resolve();
  await Promise.resolve();

  await wrapper.find('[data-test="result-0"]').trigger("click");
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  expect(wrapper.find('[data-test="creator-models-step"]').exists()).toBe(true);
  expect(wrapper.text()).toContain("Choose a poster model");

  await wrapper.find('[data-test="poster-model-standard"]').trigger("click");
  await Promise.resolve();

  expect(wrapper.find('[data-test="creator-editor-step"]').exists()).toBe(true);
  expect(wrapper.find('[data-test="preview-stage"]').exists()).toBe(true);
  expect(wrapper.find('[data-test="tracklist-input"]').element).toHaveProperty(
    "value",
    "Feel the Love\nFire",
  );

  const editorTitleInput = wrapper.find('[data-test="creator-editor-step"] [data-test="title-input"]');
  await editorTitleInput.setValue("My Custom Poster Title");

  expect(wrapper.text()).toContain("My Custom Poster Title");
});
```

Add this manual-start test:

```ts
it("lets users start manually and choose a model without search", async () => {
  const wrapper = mount(App);

  await wrapper.find('[data-test="manual-start-button"]').trigger("click");
  expect(wrapper.find('[data-test="creator-models-step"]').exists()).toBe(true);

  await wrapper.find('[data-test="poster-model-basic"]').trigger("click");
  expect(wrapper.find('[data-test="creator-editor-step"]').exists()).toBe(true);
});
```

Update the multiple-edition test final assertions so model selection is required before tracklist input exists:

```ts
expect(wrapper.find('[data-test="creator-models-step"]').exists()).toBe(true);

await wrapper.find('[data-test="poster-model-standard"]').trigger("click");
await Promise.resolve();

expect(wrapper.find('[data-test="tracklist-input"]').element).toHaveProperty(
  "value",
  "State of Grace\nThe Moment I Knew",
);
```

- [ ] **Step 2: Run failing App tests**

Run:

```bash
pnpm test --run src/components/AppFlow.test.ts src/components/AppLayout.test.ts
```

Expected: FAIL because guided flow state is not wired in `App.vue`.

- [ ] **Step 3: Add flow state and model selection to `App.vue`**

In `src/App.vue`, change Vue import to:

```ts
import { computed, shallowRef, watch } from "vue";
```

Add imports:

```ts
import PosterModelPicker from "./components/PosterModelPicker.vue";
import { applyPosterModel, type PosterModelId } from "./domain/poster-models";
```

Add state after `selectedPreset`:

```ts
type CreatorStep = "search" | "models" | "editor";
type EditorTab = "information" | "tracklist" | "style" | "export";
type AlbumEditorTab = Exclude<EditorTab, "export">;

const creatorStep = shallowRef<CreatorStep>("search");
const activeEditorTab = shallowRef<EditorTab>("information");
const selectedModelId = shallowRef<PosterModelId>("standard");
const activeAlbumEditorTab = computed<AlbumEditorTab>(() =>
  activeEditorTab.value === "export" ? "information" : activeEditorTab.value,
);
```

In `loadAlbumDraft`, after the cover-art lookup block completes, set:

```ts
creatorStep.value = "models";
```

Do this once at the end of the function, after the `if (album.sourceId && !album.artworkUrl)` block.

Add these functions near `patchDraft`:

```ts
function startManualDraft(): void {
  creatorStep.value = "models";
  status.value = "Choose a poster model, then edit any details manually.";
}

function backToSearch(): void {
  creatorStep.value = "search";
  activeEditorTab.value = "information";
}

function backToModels(): void {
  creatorStep.value = "models";
  activeEditorTab.value = "information";
}

function selectPosterModel(modelId: PosterModelId): void {
  selectedModelId.value = modelId;
  draft.value = applyPosterModel(draft.value, modelId);
  creatorStep.value = "editor";
  activeEditorTab.value = "information";
  status.value = "Poster model applied. Fine-tune the details or export when ready.";
}

function selectEditorTab(tab: EditorTab): void {
  activeEditorTab.value = tab;
}
```

- [ ] **Step 4: Replace the old App template flow**

In `src/App.vue`, replace the top workspace structure that renders the hero card, `AlbumSearch`, `AlbumEditor`, `ExportPanel`, status alert, and preview section with this structure:

```vue
<div data-test="app-workspace" class="mx-auto grid max-w-[112rem] gap-6">
  <section v-if="creatorStep === 'search'" data-test="creator-search-step" class="mx-auto grid w-full max-w-5xl gap-5">
    <Card class="border-border/80 bg-card/92 shadow-2xl shadow-black/10 backdrop-blur">
      <CardHeader class="gap-3 pb-5">
        <p class="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Album Poster Generator
        </p>
        <CardTitle class="max-w-2xl text-4xl leading-[0.95] tracking-tight md:text-5xl">
          Make a print-ready album poster.
        </CardTitle>
        <CardDescription>
          Search an album, choose a model, tweak the poster, and export a PNG.
        </CardDescription>
      </CardHeader>
    </Card>

    <AlbumSearch @manual-start="startManualDraft" @select="selectAlbum" />
  </section>

  <section v-else-if="creatorStep === 'models'" data-test="creator-models-step" class="grid gap-5">
    <PosterModelPicker
      :selected-model-id="selectedModelId"
      @back="backToSearch"
      @select-model="selectPosterModel"
    />

    <section data-test="preview-stage" class="mx-auto w-full max-w-3xl">
      <Card class="border-border/80 bg-card/80 shadow-2xl shadow-black/20 backdrop-blur">
        <CardHeader class="border-b border-border/70">
          <CardTitle>Preview</CardTitle>
          <CardDescription>The selected model will use this poster data.</CardDescription>
        </CardHeader>
        <CardContent class="grid place-items-center overflow-auto p-6 xl:p-10">
          <PosterPreview :draft="draft" />
        </CardContent>
      </Card>
    </section>
  </section>

  <section
    v-else
    data-test="creator-editor-step"
    class="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_440px] lg:items-start xl:grid-cols-[minmax(0,1fr)_480px]"
  >
    <section data-test="preview-stage" class="min-w-0 lg:sticky lg:top-10 lg:min-h-[calc(100vh-6rem)]">
      <Card class="min-h-full border-border/80 bg-card/80 shadow-2xl shadow-black/20 backdrop-blur">
        <CardHeader class="flex flex-row items-center justify-between gap-3 border-b border-border/70">
          <div>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Only the poster surface is captured during PNG export.</CardDescription>
          </div>
          <Button type="button" variant="ghost" @click="backToModels">Back</Button>
        </CardHeader>
        <CardContent class="grid min-h-[calc(100vh-14rem)] place-items-center overflow-auto p-6 xl:p-10 2xl:p-12">
          <PosterPreview :draft="draft" />
        </CardContent>
      </Card>
    </section>

    <section class="grid min-w-0 gap-4 xl:gap-5">
      <div class="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-muted/40 p-1">
        <button
          data-test="creator-tab-information"
          type="button"
          :class="activeEditorTab === 'information' ? 'rounded-xl bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm' : 'rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground'"
          @click="selectEditorTab('information')"
        >
          Information
        </button>
        <button
          data-test="creator-tab-tracklist"
          type="button"
          :class="activeEditorTab === 'tracklist' ? 'rounded-xl bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm' : 'rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground'"
          @click="selectEditorTab('tracklist')"
        >
          Tracklist
        </button>
        <button
          data-test="creator-tab-style"
          type="button"
          :class="activeEditorTab === 'style' ? 'rounded-xl bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm' : 'rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground'"
          @click="selectEditorTab('style')"
        >
          Style
        </button>
        <button
          data-test="creator-tab-export"
          type="button"
          :class="activeEditorTab === 'export' ? 'rounded-xl bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm' : 'rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground'"
          @click="selectEditorTab('export')"
        >
          Export
        </button>
      </div>

      <AlbumEditor
        v-show="activeEditorTab !== 'export'"
        :active-tab="activeAlbumEditorTab"
        :draft="draft"
        @patch="patchDraft"
      />
      <ExportPanel
        v-show="activeEditorTab === 'export'"
        :selected-preset-id="selectedPresetId"
        :exporting="exporting"
        @select-preset="selectedPresetId = $event"
        @export-poster="exportPoster"
      />

      <Alert v-if="status">
        <AlertDescription>{{ status }}</AlertDescription>
      </Alert>
    </section>
  </section>
</div>
```

- [ ] **Step 5: Update App layout test**

In `src/components/AppLayout.test.ts`, replace the old desktop-column assertion with:
```ts
expect(wrapper.find('[data-test="app-workspace"]').classes().join(" ")).toContain("max-w-[112rem]");
expect(wrapper.find('[data-test="creator-search-step"]').exists()).toBe(true);
```

Remove the assertion that expects `preview-stage` on initial render, because preview now appears after manual start or album selection.

- [ ] **Step 6: Run App tests**

Run:

```bash
pnpm test --run src/components/AppFlow.test.ts src/components/AppLayout.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.vue src/components/AppFlow.test.ts src/components/AppLayout.test.ts
git commit -m "Wire guided creator flow"
```

---

### Task 6: Final focused verification

**Files:**
- Verify only changed tests and the project checks after all implementation tasks are complete.

- [ ] **Step 1: Run changed test files**

Run:

```bash
pnpm test --run src/domain/poster-models.test.ts src/components/PosterModelPicker.test.ts src/components/AlbumSearch.test.ts src/components/AlbumEditor.test.ts src/components/AppFlow.test.ts src/components/AppLayout.test.ts src/components/ExportPanel.test.ts
```

Expected: PASS for all listed files.

- [ ] **Step 2: Run type/build checks**

Run:

```bash
pnpm check
```

Expected: PASS.

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Commit any final fixes**

If verification required code changes, commit them:

```bash
git add src docs/superpowers/plans/2026-06-04-guided-creator-flow.md
git commit -m "Verify guided creator flow"
```

If verification required no code changes, do not create an empty commit.
