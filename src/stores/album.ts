import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AlbumDraft, AlbumDraftInput, PosterLayout } from "../domain/album";
import { createAlbumDraft, defaultPosterLayout } from "../domain/album";
import type { ExportPresetId } from "../export/presets";
import { applyDraftPatch, mergeFetchedAlbum } from "../editor/draft";
import type { MusicBrainzEdition } from "../sources/musicbrainz";

const showTracklistPreferenceKey = "album-poster-generator:show-tracklist";
const layoutPreferenceKey = "album-poster-generator:layout";

function readShowTracklistPreference(): boolean {
  try {
    return window.localStorage.getItem(showTracklistPreferenceKey) !== "false";
  } catch {
    return true;
  }
}

function writeShowTracklistPreference(showTracklist: boolean): void {
  try {
    window.localStorage.setItem(showTracklistPreferenceKey, String(showTracklist));
  } catch {
    // Ignore unavailable storage
  }
}

function readLayoutPreference(): PosterLayout {
  try {
    const stored = window.localStorage.getItem(layoutPreferenceKey);
    if (
      stored === "small" ||
      stored === "medium" ||
      stored === "large" ||
      stored === "edge-to-edge"
    ) {
      return stored;
    }
  } catch {
    // Ignore unavailable storage
  }
  return defaultPosterLayout;
}

function writeLayoutPreference(layout: PosterLayout): void {
  try {
    window.localStorage.setItem(layoutPreferenceKey, layout);
  } catch {
    // Ignore unavailable storage
  }
}

export const useAlbumStore = defineStore("album", () => {
  // State
  const draft = ref<AlbumDraft>(
  createAlbumDraft({
    showTracklist: readShowTracklistPreference(),
    layout: readLayoutPreference(),
  }),
);
  const selectedPresetId = ref<ExportPresetId>("a4-portrait");
  const exporting = ref(false);
  const status = ref("");
  const pendingAlbum = ref<AlbumDraftInput | null>(null);
  const pendingEditions = ref<MusicBrainzEdition[]>([]);

  // Getters
  const editionDialogOpen = computed(
    () => pendingAlbum.value !== null && pendingEditions.value.length > 1,
  );

  // Actions
  function setDraft(newDraft: AlbumDraft): void {
    draft.value = newDraft;
  }

  function setPreset(id: ExportPresetId): void {
    selectedPresetId.value = id;
  }

  function setExporting(value: boolean): void {
    exporting.value = value;
  }

  function setStatus(message: string): void {
    status.value = message;
  }

  function setPendingAlbum(
    album: AlbumDraftInput | null,
    editions: MusicBrainzEdition[] = [],
  ): void {
    pendingAlbum.value = album;
    pendingEditions.value = editions;
  }

  function clearPendingAlbum(): void {
    pendingAlbum.value = null;
    pendingEditions.value = [];
  }

  function updateShowTracklistPreference(showTracklist: boolean): void {
    writeShowTracklistPreference(showTracklist);
  }

  function loadFetchedAlbum(album: AlbumDraftInput, tracklist: string[]): void {
    draft.value = mergeFetchedAlbum(draft.value, {
      ...album,
      tracklist,
      showTracklist: readShowTracklistPreference(),
    });
  }

  function patchDraft(patch: Partial<AlbumDraft>): void {
    if (typeof patch.showTracklist === "boolean") {
      updateShowTracklistPreference(patch.showTracklist);
    }
    if (typeof patch.layout === "string") {
      writeLayoutPreference(patch.layout);
    }
    draft.value = applyDraftPatch(draft.value, patch);
  }

  return {
    // State
    draft,
    selectedPresetId,
    exporting,
    status,
    pendingAlbum,
    pendingEditions,
    // Getters
    editionDialogOpen,
    // Actions
    setDraft,
    setPreset,
    setExporting,
    setStatus,
    setPendingAlbum,
    clearPendingAlbum,
    updateShowTracklistPreference,
    readShowTracklistPreference,
    loadFetchedAlbum,
    patchDraft,
  };
});
