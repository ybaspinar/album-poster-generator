<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { capturePostHogEvent, capturePostHogException } from "./analytics/posthog";
import Alert from "@/components/ui/alert/Alert.vue";
import AlertDescription from "@/components/ui/alert/AlertDescription.vue";
import Button from "@/components/ui/button/Button.vue";
import Card from "@/components/ui/card/Card.vue";
import CardContent from "@/components/ui/card/CardContent.vue";
import CardDescription from "@/components/ui/card/CardDescription.vue";
import CardHeader from "@/components/ui/card/CardHeader.vue";
import CardTitle from "@/components/ui/card/CardTitle.vue";
import Dialog from "@/components/ui/dialog/Dialog.vue";
import DialogContent from "@/components/ui/dialog/DialogContent.vue";
import DialogDescription from "@/components/ui/dialog/DialogDescription.vue";
import DialogFooter from "@/components/ui/dialog/DialogFooter.vue";
import DialogHeader from "@/components/ui/dialog/DialogHeader.vue";
import DialogTitle from "@/components/ui/dialog/DialogTitle.vue";
import AlbumEditor from "./components/AlbumEditor.vue";
import AlbumSearch from "./components/AlbumSearch.vue";
import ExportPanel from "./components/ExportPanel.vue";
import LanguageSwitcher from "./components/LanguageSwitcher.vue";
import PosterModelPicker from "./components/PosterModelPicker.vue";
import PosterPreview from "./components/PosterPreview.vue";
import { useTheme } from "./composables/useTheme";
import { type AlbumDraft, type AlbumDraftInput } from "./domain/album";
import { applyPosterModel, type PosterModelId } from "./domain/poster-models";
import { applyDraftPatch, mergeFetchedAlbum } from "./editor/draft";
import { createExportFilename, getExportPreset } from "./export/presets";
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
import { useAlbumStore } from "./stores/album";
const { t, locale } = useI18n();

watch(
  locale,
  (val) => {
    document.documentElement.lang = val;
  },
  { immediate: true },
);

const store = useAlbumStore();
const { draft, selectedPresetId, exporting, status, pendingAlbum, pendingEditions } =
  storeToRefs(store);
const editionDialogOpen = computed(() => store.editionDialogOpen);

const selectedPreset = computed(() => getExportPreset(selectedPresetId.value));
type CreatorStep = "search" | "models" | "editor";
type EditorTab = "information" | "tracklist" | "style";

const creatorStep = shallowRef<CreatorStep>("search");
const activeEditorTab = shallowRef<EditorTab>("information");
const selectedModelId = shallowRef<PosterModelId>("clean");

const { theme, toggleTheme } = useTheme();
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
        store.patchDraft({ palette });
      }
    } catch {
      // Palette extraction is best-effort. Keep the current swatches if artwork cannot be read.
    }
  },
);

async function selectAlbum(album: AlbumDraftInput): Promise<void> {
  const editions = album.sourceId ? await fetchMusicBrainzEditions(album.sourceId) : [];

  if (editions.length > 1) {
    store.setPendingAlbum(album, editions);
    store.setStatus(t("status.chooseEdition"));
    return;
  }

  const tracklist = album.sourceId ? await fetchMusicBrainzTracklist(album.sourceId) : [];
  await loadAlbumDraft(album, tracklist);
}

async function selectEdition(edition: MusicBrainzEdition): Promise<void> {
  if (!pendingAlbum.value) {
    return;
  }

  capturePostHogEvent("edition_selected", {
    edition_id: edition.id,
    has_artwork: Boolean(edition.artworkUrl),
    country: edition.country ?? null,
    track_count: edition.trackCount ?? null,
  });

  const album = pendingAlbum.value;
  store.clearPendingAlbum();
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
  capturePostHogEvent("edition_selection_cancelled");
  store.clearPendingAlbum();
  store.setStatus(t("status.selectionCancelled"));
}

async function loadAlbumDraft(album: AlbumDraftInput, tracklist: string[]): Promise<void> {
  const exportableArtwork = album.artworkUrl
    ? await makeArtworkExportable(album.artworkUrl)
    : createExportableArtworkResult(album.artworkUrl ?? "");

  draft.value = mergeFetchedAlbum(draft.value, {
    ...album,
    tracklist,
    showTracklist: store.readShowTracklistPreference(),
    artworkUrl: exportableArtwork.artworkUrl,
  });
  status.value = exportableArtwork.ok ? t("status.albumLoaded") : exportableArtwork.message;

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
      status.value = error instanceof Error ? error.message : t("status.artworkLookupFailed");
    }
  }
  creatorStep.value = "models";
}

function patchDraft(patch: Partial<AlbumDraft>): void {
  if (typeof patch.showTracklist === "boolean") {
    store.updateShowTracklistPreference(patch.showTracklist);
  }

  draft.value = applyDraftPatch(draft.value, patch);
}

function startManualDraft(): void {
  capturePostHogEvent("manual_start_clicked");
  creatorStep.value = "models";
  status.value = t("status.chooseModel");
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
  capturePostHogEvent("poster_model_selected", { model_id: modelId });
  selectedModelId.value = modelId;
  draft.value = applyPosterModel(draft.value, modelId);
  creatorStep.value = "editor";
  activeEditorTab.value = "information";
  status.value = t("status.modelApplied");
}

function selectEditorTab(tab: EditorTab): void {
  activeEditorTab.value = tab;
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
    status.value = t("status.notReady");
    return;
  }

  exporting.value = true;
  status.value = t("status.preparing");

  try {
    await exportElementAsPng(
      posterElement,
      selectedPreset.value,
      createExportFilename(draft.value.artist, draft.value.title, selectedPreset.value),
    );
    status.value = t("status.exported", { preset: selectedPreset.value.label });
    capturePostHogEvent("poster_exported", {
      preset_id: selectedPreset.value.id,
      preset_label: selectedPreset.value.label,
      width_px: selectedPreset.value.widthPx,
      height_px: selectedPreset.value.heightPx,
      has_artist: Boolean(draft.value.artist),
      has_tracklist: draft.value.showTracklist && draft.value.tracklist.length > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : t("status.exportFailed");
    status.value = message;
    capturePostHogException(error instanceof Error ? error : new Error(message), {
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
    <div data-test="app-workspace" class="mx-auto grid max-w-[112rem] gap-6">
      <section
        v-if="creatorStep === 'search'"
        data-test="creator-search-step"
        class="mx-auto grid w-full max-w-5xl gap-5"
      >
        <Card class="border-border/80 bg-card/92 shadow-2xl shadow-black/10 backdrop-blur">
          <CardHeader class="relative gap-3 pb-5">
            <div class="absolute right-4 top-4 flex items-center gap-2">
              <LanguageSwitcher />
              <Button
                :aria-label="
                  t('aria.toggleTheme', {
                    mode: theme === 'dark' ? t('aria.light') : t('aria.dark'),
                  })
                "
                type="button"
                variant="ghost"
                size="icon"
                @click="toggleTheme"
              >
                <Sun v-if="theme === 'dark'" class="size-5" />
                <Moon v-else class="size-5" />
              </Button>
            </div>
            <p class="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {{ t("app.brand") }}
            </p>
            <CardTitle class="max-w-2xl text-4xl leading-[0.95] tracking-tight md:text-5xl">
              {{ t("app.headline") }}
            </CardTitle>
            <CardDescription>
              {{ t("app.description") }}
            </CardDescription>
          </CardHeader>
        </Card>

        <AlbumSearch @manual-start="startManualDraft" @select="selectAlbum" />
      </section>

      <section
        v-else-if="creatorStep === 'models'"
        data-test="creator-models-step"
        class="grid w-full gap-5"
      >
        <PosterModelPicker
          :draft="draft"
          :selected-model-id="selectedModelId"
          @back="backToSearch"
          @select-model="selectPosterModel"
        />
      </section>

      <section
        v-else
        data-test="creator-editor-step"
        class="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_440px] lg:items-start xl:grid-cols-[minmax(0,1fr)_480px]"
      >
        <section
          data-test="preview-stage"
          class="min-w-0 lg:sticky lg:top-10 lg:min-h-[calc(100vh-6rem)]"
        >
          <Card
            class="min-h-full border-border/80 bg-card/80 shadow-2xl shadow-black/20 backdrop-blur"
          >
            <CardHeader
              class="flex flex-row items-center justify-between gap-3 border-b border-border/70"
            >
              <div>
                <CardTitle>{{ t("editor.previewTitle") }}</CardTitle>
                <CardDescription>{{ t("editor.previewCaption") }}</CardDescription>
              </div>
              <Button
                data-test="editor-back-button"
                type="button"
                variant="ghost"
                @click="backToModels"
              >
                {{ t("editor.back") }}
              </Button>
            </CardHeader>
            <CardContent
              class="grid min-h-[calc(100vh-14rem)] place-items-center overflow-auto p-6 xl:p-10 2xl:p-12"
            >
              <PosterPreview :draft="draft" />
            </CardContent>
          </Card>
        </section>

        <section class="grid min-w-0 gap-4 xl:gap-5">
          <div class="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-muted/40 p-1">
            <button
              data-test="creator-tab-information"
              type="button"
              :class="
                activeEditorTab === 'information'
                  ? 'rounded-xl bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm'
                  : 'rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground'
              "
              @click="selectEditorTab('information')"
            >
              {{ t("editor.tabInformation") }}
            </button>
            <button
              data-test="creator-tab-tracklist"
              type="button"
              :class="
                activeEditorTab === 'tracklist'
                  ? 'rounded-xl bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm'
                  : 'rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground'
              "
              @click="selectEditorTab('tracklist')"
            >
              {{ t("editor.tabTracklist") }}
            </button>
            <button
              data-test="creator-tab-style"
              type="button"
              :class="
                activeEditorTab === 'style'
                  ? 'rounded-xl bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm'
                  : 'rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground'
              "
              @click="selectEditorTab('style')"
            >
              {{ t("editor.tabStyle") }}
            </button>
          </div>

          <AlbumEditor :active-tab="activeEditorTab" :draft="draft" @patch="patchDraft" />
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
      </section>
    </div>

    <Dialog :open="editionDialogOpen">
      <DialogContent data-test="edition-dialog">
        <DialogHeader>
          <DialogTitle>{{ t("editionDialog.title") }}</DialogTitle>
          <DialogDescription>
            {{ t("editionDialog.description") }}
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
                :alt="t('preview.artworkAlt', { title: edition.title })"
                class="h-12 w-12 rounded object-cover"
              />
              <div v-else class="h-12 w-12 rounded bg-muted" />
              <span class="grid gap-1">
                <strong class="text-sm text-foreground">{{ edition.title }}</strong>
                <span class="text-xs font-normal text-muted-foreground">
                  {{ edition.releaseDate || t("editionDialog.unknownDate") }}
                  <template v-if="edition.country"> · {{ edition.country }}</template>
                  <template v-if="edition.formats.length">
                    · {{ edition.formats.join(", ") }}
                  </template>
                  <template v-if="edition.trackCount">
                    · {{ t("editionDialog.tracks", { count: edition.trackCount }) }}
                  </template>
                </span>
              </span>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="cancelEditionSelection">{{
            t("editionDialog.cancel")
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>
</template>
