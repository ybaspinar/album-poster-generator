import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AlbumDraft, AlbumDraftInput } from "../domain/album";
import type { ExportPresetId } from "../export/presets";
import { createAlbumDraft } from "../domain/album";
import type { MusicBrainzEdition } from "../sources/musicbrainz";

const showTracklistPreferenceKey = "album-poster-generator:show-tracklist";

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

export const useAlbumStore = defineStore("album", () => {
  // State
  const draft = ref<AlbumDraft>(createAlbumDraft({ showTracklist: readShowTracklistPreference() }));
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
  };
});
