<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { extractPaletteFromImage } from "./media/palette";
import { findCoverArt } from "./sources/cover-art";

const draft = ref<AlbumDraft>(createEmptyAlbumDraft());
const selectedPresetId = ref<ExportPresetId>("a4-portrait");
const exporting = ref(false);
const status = ref("");
const selectedPreset = computed(() => getExportPreset(selectedPresetId.value));
let paletteRequestId = 0;

watch(
  () => draft.value.artworkUrl,
  async (artworkUrl) => {
    const requestId = ++paletteRequestId;

    if (!artworkUrl) {
      return;
    }

    try {
      const palette = await extractPaletteFromImage(artworkUrl);

      if (requestId === paletteRequestId) {
        draft.value = applyDraftPatch(draft.value, { palette });
      }
    } catch {
      // Palette extraction is best-effort. Keep the current swatches if artwork cannot be read.
    }
  },
);

async function selectAlbum(album: AlbumDraftInput): Promise<void> {
  draft.value = mergeFetchedAlbum(draft.value, album);
  status.value = "Album data loaded. You can override every field.";

  if (album.sourceId && !album.artworkUrl) {
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
  <main class="min-h-screen bg-background p-6 text-foreground md:p-10">
    <div
      class="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(320px,520px)_minmax(420px,1fr)] lg:items-start"
    >
      <section class="grid min-w-0 gap-4">
        <Card>
          <CardHeader>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Album Poster Generator
            </p>
            <CardTitle class="text-4xl tracking-tight md:text-5xl">
              Make print-ready album posters.
            </CardTitle>
            <CardDescription>
              Fetch metadata, override anything, and keep the poster browser-only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" @click="startManual">Start manually</Button>
          </CardContent>
        </Card>

        <AlbumSearch @select="selectAlbum" />
        <AlbumEditor :draft="draft" @patch="patchDraft" />
        <ExportPanel
          :selected-preset-id="selectedPresetId"
          :exporting="exporting"
          @select-preset="selectedPresetId = $event"
          @export-poster="exportPoster"
        />

        <Alert v-if="status">
          <AlertDescription>{{ status }}</AlertDescription>
        </Alert>
      </section>

      <section class="min-w-0 lg:sticky lg:top-10">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription
              >Only the poster surface is captured during PNG export.</CardDescription
            >
          </CardHeader>
          <CardContent class="grid place-items-center overflow-auto">
            <PosterPreview :draft="draft" />
          </CardContent>
        </Card>
      </section>
    </div>
  </main>
</template>
