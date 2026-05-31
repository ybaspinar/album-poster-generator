<script setup lang="ts">
import { computed, ref, watch } from "vue";
import posthog from "posthog-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createExportableArtworkUrl, type ExportableArtworkUrlResult } from "./media/artwork-url";
import { extractPaletteFromImage } from "./media/palette";
import { findCoverArt } from "./sources/cover-art";
import {
  fetchMusicBrainzEditions,
  fetchMusicBrainzTracklist,
  fetchMusicBrainzTracklistForRelease,
  type MusicBrainzEdition,
} from "./sources/musicbrainz";

const showTracklistPreferenceKey = "album-poster-generator:show-tracklist";

const draft = ref<AlbumDraft>(createAlbumDraft({ showTracklist: readShowTracklistPreference() }));
const selectedPresetId = ref<ExportPresetId>("a4-portrait");
const exporting = ref(false);
const status = ref("");
const selectedPreset = computed(() => getExportPreset(selectedPresetId.value));
const pendingAlbum = ref<AlbumDraftInput | null>(null);
const pendingEditions = ref<MusicBrainzEdition[]>([]);
const editionDialogOpen = computed(() => pendingAlbum.value !== null && pendingEditions.value.length > 1);
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
  const editions = album.sourceId ? await fetchMusicBrainzEditions(album.sourceId) : [];

  if (editions.length > 1) {
    pendingAlbum.value = album;
    pendingEditions.value = editions;
    status.value = "Choose an album edition to load its exact tracklist.";
    return;
  }

  const tracklist = album.sourceId ? await fetchMusicBrainzTracklist(album.sourceId) : [];
  await loadAlbumDraft(album, tracklist);
}

async function selectEdition(edition: MusicBrainzEdition): Promise<void> {
  if (!pendingAlbum.value) {
    return;
  }

  const album = pendingAlbum.value;
  pendingAlbum.value = null;
  pendingEditions.value = [];
  const tracklist = await fetchMusicBrainzTracklistForRelease(edition.id);

  await loadAlbumDraft(
    {
      ...album,
      title: edition.title || album.title,
      releaseDate: edition.releaseDate || album.releaseDate,
      artworkUrl: edition.artworkUrl || album.artworkUrl,
    },
    tracklist,
  );
}

function cancelEditionSelection(): void {
  pendingAlbum.value = null;
  pendingEditions.value = [];
  status.value = "Album selection cancelled.";
}

async function loadAlbumDraft(album: AlbumDraftInput, tracklist: string[]): Promise<void> {
  const exportableArtwork = album.artworkUrl
    ? await makeArtworkExportable(album.artworkUrl)
    : createExportableArtworkResult(album.artworkUrl ?? "");

  draft.value = mergeFetchedAlbum(draft.value, {
    ...album,
    tracklist,
    showTracklist: readShowTracklistPreference(),
    artworkUrl: exportableArtwork.artworkUrl,
  });
  status.value = exportableArtwork.ok
    ? "Album data loaded. You can override every field."
    : exportableArtwork.message;

  if (album.sourceId && !album.artworkUrl) {
    try {
      const coverArt = await findCoverArt(album.sourceId);
      const exportableCoverArt = coverArt.artworkUrl
        ? await makeArtworkExportable(coverArt.artworkUrl)
        : createExportableArtworkResult(coverArt.artworkUrl ?? "");
      draft.value = applyDraftPatch(draft.value, {
        ...coverArt,
        artworkUrl: exportableCoverArt.artworkUrl,
      });

      if (!exportableCoverArt.ok) {
        status.value = exportableCoverArt.message;
      }
    } catch (error) {
      status.value =
        error instanceof Error ? error.message : "Artwork lookup failed. Add artwork manually.";
    }
  }
}

function startManual(): void {
  draft.value = createAlbumDraft({ showTracklist: readShowTracklistPreference() });
  status.value = "Manual draft ready.";
  posthog.capture("manual_draft_started");
}

function patchDraft(patch: Partial<AlbumDraft>): void {
  if (typeof patch.showTracklist === "boolean") {
    writeShowTracklistPreference(patch.showTracklist);
  }

  draft.value = applyDraftPatch(draft.value, patch);
}

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
    // Ignore unavailable storage; the in-memory draft still updates.
  }
}

async function makeArtworkExportable(artworkUrl: string): Promise<ExportableArtworkUrlResult> {
  return createExportableArtworkUrl(artworkUrl);
}

function createExportableArtworkResult(artworkUrl: string): ExportableArtworkUrlResult {
  return { ok: true, artworkUrl };
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
    posthog.capture("poster_exported", {
      preset_id: selectedPreset.value.id,
      preset_label: selectedPreset.value.label,
      width_px: selectedPreset.value.widthPx,
      height_px: selectedPreset.value.heightPx,
      has_artist: Boolean(draft.value.artist),
      has_tracklist: draft.value.showTracklist && draft.value.tracklist.length > 0,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PNG export failed. Try another preset.";
    status.value = message;
    posthog.captureException(error instanceof Error ? error : new Error(message), {
      preset_id: selectedPreset.value.id,
    });
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <main
    data-test="app-shell"
    data-brand="ink-slate"
    class="min-h-screen bg-transparent px-5 py-6 text-foreground md:px-8 md:py-10 xl:px-12"
  >
    <div
      data-test="app-workspace"
      class="mx-auto grid max-w-[112rem] gap-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start xl:grid-cols-[440px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)]"
    >
      <section class="grid min-w-0 gap-4 xl:gap-5">
        <Card class="border-border/80 bg-card/92 shadow-2xl shadow-black/10 backdrop-blur">
          <CardHeader class="gap-5 pb-5">
            <p class="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Album Poster Generator
            </p>
            <CardTitle
              class="max-w-[12ch] text-4xl leading-[0.95] tracking-tight md:text-5xl xl:text-6xl"
            >
              Make print-ready album posters.
            </CardTitle>
            <CardDescription>
              Fetch metadata, override anything, and keep the poster browser-only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" size="lg" @click="startManual">Start manually</Button>
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

      <section
        data-test="preview-stage"
        class="min-w-0 lg:sticky lg:top-10 lg:min-h-[calc(100vh-6rem)]"
      >
        <Card
          class="min-h-full border-border/80 bg-card/80 shadow-2xl shadow-black/20 backdrop-blur"
        >
          <CardHeader class="border-b border-border/70">
            <CardTitle>Preview</CardTitle>
            <CardDescription
              >Only the poster surface is captured during PNG export.</CardDescription
            >
          </CardHeader>
          <CardContent
            class="grid min-h-[calc(100vh-14rem)] place-items-center overflow-auto p-6 xl:p-10 2xl:p-12"
          >
            <PosterPreview :draft="draft" />
          </CardContent>
        </Card>
      </section>
    </div>

    <Dialog :open="editionDialogOpen">
      <DialogContent data-test="edition-dialog">
        <DialogHeader>
          <DialogTitle>Choose edition</DialogTitle>
          <DialogDescription>
            This album has multiple MusicBrainz releases. Pick the edition whose tracklist and date
            should be used on the poster.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-2">
          <Button
            v-for="edition in pendingEditions"
            :key="edition.id"
            :data-test="`edition-${edition.id}`"
            type="button"
            variant="outline"
            class="h-auto justify-start p-3 text-left"
            @click="selectEdition(edition)"
          >
            <div class="flex items-center gap-3">
              <img
                v-if="edition.artworkUrl"
                :src="edition.artworkUrl"
                :alt="`${edition.title} cover`"
                class="h-12 w-12 rounded object-cover"
              />
              <div v-else class="h-12 w-12 rounded bg-muted" />
              <span class="grid gap-1">
                <strong class="text-sm text-foreground">{{ edition.title }}</strong>
                <span class="text-xs font-normal text-muted-foreground">
                  {{ edition.releaseDate || "Unknown date" }}
                  <template v-if="edition.country"> · {{ edition.country }}</template>
                  <template v-if="edition.formats.length"> · {{ edition.formats.join(", ") }}</template>
                  <template v-if="edition.trackCount"> · {{ edition.trackCount }} tracks</template>
                </span>
              </span>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="cancelEditionSelection">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>
</template>
