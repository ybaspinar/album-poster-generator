import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  AlbumDraft,
  AlbumDraftInput,
  GradientDirection,
  PosterBackgroundMode,
  PosterLayout,
} from "../domain/album";
import { createAlbumDraft, defaultPosterLayout } from "../domain/album";
import { exportPresets, type ExportPresetId } from "../export/presets";
import { applyDraftPatch, mergeFetchedAlbum } from "../editor/draft";
import type { MusicBrainzEdition } from "../sources/musicbrainz";

const showTracklistPreferenceKey = "album-poster-generator:show-tracklist";
const layoutPreferenceKey = "album-poster-generator:layout";
const exportPresetPreferenceKey = "album-poster-generator:export-preset";
const swatchesPreferenceKey = "album-poster-generator:swatches";

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

function readExportPresetPreference(): ExportPresetId {
  try {
    const stored = window.localStorage.getItem(exportPresetPreferenceKey);
    if (exportPresets.some((preset) => preset.id === stored)) {
      return stored as ExportPresetId;
    }
  } catch {
    // Ignore unavailable storage
  }
  return "a4-portrait";
}

function writeExportPresetPreference(id: ExportPresetId): void {
  try {
    window.localStorage.setItem(exportPresetPreferenceKey, id);
  } catch {
    // Ignore unavailable storage
  }
}

interface SwatchesSettings {
  show: boolean;
  shape: "square" | "circle";
}

function readSwatchesPreference(): Partial<SwatchesSettings> | null {
  try {
    const stored = window.localStorage.getItem(swatchesPreferenceKey);
    if (stored) {
      return JSON.parse(stored) as SwatchesSettings;
    }
  } catch {
    // Ignore unavailable storage
  }
  return null;
}

function writeSwatchesPreference(settings: SwatchesSettings): void {
  try {
    window.localStorage.setItem(swatchesPreferenceKey, JSON.stringify(settings));
  } catch {
    // Ignore unavailable storage
  }
}

const backgroundPreferenceKey = "album-poster-generator:background";

interface BackgroundSettings {
  mode: PosterBackgroundMode;
  solidColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientDirection: GradientDirection;
  blur: boolean;
  blurAmount: number;
}

function readBackgroundPreference(): Partial<BackgroundSettings> | null {
  try {
    const stored = window.localStorage.getItem(backgroundPreferenceKey);
    if (stored) {
      return JSON.parse(stored) as BackgroundSettings;
    }
  } catch {
    // Ignore unavailable storage
  }
  return null;
}

function writeBackgroundPreference(settings: BackgroundSettings): void {
  try {
    window.localStorage.setItem(backgroundPreferenceKey, JSON.stringify(settings));
  } catch {
    // Ignore unavailable storage
  }
}

export const useAlbumStore = defineStore("album", () => {
  // State
  const savedBackground = readBackgroundPreference();
  const savedSwatches = readSwatchesPreference();
  const draft = ref<AlbumDraft>(
    createAlbumDraft({
      showTracklist: readShowTracklistPreference(),
      layout: readLayoutPreference(),
      showSwatches: savedSwatches?.show,
      swatchShape: savedSwatches?.shape,
      backgroundMode: savedBackground?.mode,
      backgroundSolidColor: savedBackground?.solidColor,
      backgroundGradientFrom: savedBackground?.gradientFrom,
      backgroundGradientTo: savedBackground?.gradientTo,
      backgroundGradientDirection: savedBackground?.gradientDirection,
      backgroundBlur: savedBackground?.blur,
      backgroundBlurAmount: savedBackground?.blurAmount,
    }),
  );
  const selectedPresetId = ref<ExportPresetId>(readExportPresetPreference());
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
    writeExportPresetPreference(id);
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
    if (typeof patch.showSwatches === "boolean" || typeof patch.swatchShape === "string") {
      const current = draft.value;
      writeSwatchesPreference({
        show: patch.showSwatches ?? current.showSwatches,
        shape: patch.swatchShape ?? current.swatchShape,
      });
    }
    if (
      typeof patch.backgroundMode === "string" ||
      typeof patch.backgroundBlur === "boolean" ||
      typeof patch.backgroundBlurAmount === "number" ||
      typeof patch.backgroundSolidColor === "string" ||
      typeof patch.backgroundGradientFrom === "string" ||
      typeof patch.backgroundGradientTo === "string" ||
      typeof patch.backgroundGradientDirection === "string"
    ) {
      const current = draft.value;
      writeBackgroundPreference({
        mode: patch.backgroundMode ?? current.backgroundMode,
        solidColor: patch.backgroundSolidColor ?? current.backgroundSolidColor,
        gradientFrom: patch.backgroundGradientFrom ?? current.backgroundGradientFrom,
        gradientTo: patch.backgroundGradientTo ?? current.backgroundGradientTo,
        gradientDirection: patch.backgroundGradientDirection ?? current.backgroundGradientDirection,
        blur: patch.backgroundBlur ?? current.backgroundBlur,
        blurAmount: patch.backgroundBlurAmount ?? current.backgroundBlurAmount,
      });
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
