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
