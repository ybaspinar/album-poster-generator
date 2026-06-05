<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import { capturePostHogEvent, capturePostHogException } from "../analytics/posthog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AlbumDraftInput } from "../domain/album";
import { addRecentSearch, readRecentSearches } from "../sources/search-recent";
import {
  paramsDisplayLabel,
  searchMusicBrainzAlbums,
  type MusicBrainzSearchParams,
} from "../sources/musicbrainz";

const { t } = useI18n();

const emit = defineEmits<{
  manualStart: [];
  select: [album: AlbumDraftInput];
}>();

const artist = ref("");
const title = ref("");
const year = ref("");
const type = ref<"any" | "album" | "ep" | "single" | "other">("any");

const results = ref<AlbumDraftInput[]>([]);
const status = ref("");
const loading = ref(false);
const selectedIndex = ref(-1);
const showRecents = ref(false);
const recents = ref<string[]>([]);
const artistInputRef = ref<HTMLInputElement | null>(null);

const hasSearchableContent = computed(() => {
  return (
    artist.value.trim().length > 0 || title.value.trim().length > 0 || year.value.trim().length > 0
  );
});

function currentParams(): MusicBrainzSearchParams {
  return {
    artist: artist.value,
    title: title.value,
    year: year.value,
    type: type.value === "any" ? undefined : type.value,
  };
}

function updateRecents(): void {
  recents.value = readRecentSearches();
}

function focusArtistInput(): void {
  if (!hasSearchableContent.value) {
    updateRecents();
    showRecents.value = recents.value.length > 0;
  }
}

function blurArtistInput(): void {
  setTimeout(() => {
    showRecents.value = false;
  }, 150);
}

function selectRecent(q: string): void {
  // Try to parse "artist - title" pattern back into fields
  const dashSplit = q.split(/\s+-\s+/);
  if (dashSplit.length === 2) {
    artist.value = dashSplit[0];
    title.value = dashSplit[1];
  } else {
    title.value = q;
  }
  showRecents.value = false;
  performSearch();
}

function clearResults(): void {
  results.value = [];
  selectedIndex.value = -1;
  status.value = "";
}

function clearAllFields(): void {
  artist.value = "";
  title.value = "";
  year.value = "";
  type.value = "any";
  clearResults();
  nextTick(() => {
    const el = artistInputRef.value?.$el?.querySelector?.("input") ?? artistInputRef.value;
    if (el && typeof el.focus === "function") {
      el.focus();
    }
  });
}

async function performSearch(): Promise<void> {
  if (!hasSearchableContent.value) {
    clearResults();
    return;
  }

  showRecents.value = false;
  loading.value = true;
  status.value = "";
  selectedIndex.value = -1;

  try {
    const params = currentParams();
    results.value = await searchMusicBrainzAlbums(params);
    status.value = results.value.length
      ? t("search.resultsFound", results.value.length)
      : t("search.noResults");
    capturePostHogEvent("album_searched", {
      result_count: results.value.length,
      has_artist: Boolean(params.artist),
      has_title: Boolean(params.title),
      has_year: Boolean(params.year),
      release_type: params.type ?? "any",
    });
    if (results.value.length) {
      const label = paramsDisplayLabel(currentParams());
      if (label) addRecentSearch(label);
    }
  } catch (error) {
    capturePostHogException(
      error instanceof Error ? error : new Error("MusicBrainz search failed."),
    );
    status.value = error instanceof Error ? error.message : t("status.searchFailed");
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function onSearchInput(): void {
  if (!hasSearchableContent.value) {
    clearResults();
    updateRecents();
    showRecents.value = recents.value.length > 0;
  }
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (showRecents.value) {
      selectedIndex.value = Math.min(selectedIndex.value + 1, recents.value.length - 1);
    } else {
      selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1);
    }
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (showRecents.value && selectedIndex.value >= 0) {
      selectRecent(recents.value[selectedIndex.value]);
    } else if (selectedIndex.value >= 0 && results.value[selectedIndex.value]) {
      emit("select", results.value[selectedIndex.value]);
      clearResults();
      artist.value = "";
      title.value = "";
      year.value = "";
    } else {
      performSearch();
    }
  } else if (event.key === "Escape") {
    showRecents.value = false;
    selectedIndex.value = -1;
  }
}

function selectResult(album: AlbumDraftInput): void {
  capturePostHogEvent("album_selected", {
    album_title: album.title,
    album_artist: album.artist,
    has_artwork: Boolean(album.artworkUrl),
    source_id: album.sourceId,
  });
  emit("select", album);
  clearResults();
  artist.value = "";
  title.value = "";
  year.value = "";
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t("search.title") }}</CardTitle>
    </CardHeader>
    <CardContent class="grid gap-4">
      <form data-test="search-form" class="grid gap-3" @submit.prevent="performSearch">
        <div class="grid gap-2">
          <Label for="album-artist">{{ t("search.artist") }}</Label>
          <div class="relative">
            <Input
              id="album-artist"
              ref="artistInputRef"
              v-model="artist"
              data-test="artist-input"
              type="search"
              :placeholder="t('search.artistPlaceholder')"
              autocomplete="off"
              @focus="focusArtistInput"
              @blur="blurArtistInput"
              @input="onSearchInput"
              @keydown="onKeyDown"
            />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="album-title">{{ t("search.title") }}</Label>
          <div class="relative">
            <Input
              id="album-title"
              v-model="title"
              data-test="title-input"
              type="search"
              :placeholder="t('search.titlePlaceholder')"
              autocomplete="off"
              @input="onSearchInput"
              @keydown="onKeyDown"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-2">
            <Label for="album-year">{{ t("search.year") }}</Label>
            <Input
              id="album-year"
              v-model="year"
              data-test="year-input"
              type="search"
              :placeholder="t('search.yearPlaceholder')"
              autocomplete="off"
              @input="onSearchInput"
              @keydown="onKeyDown"
            />
          </div>
          <div class="grid gap-2">
            <Label for="album-type">{{ t("search.type") }}</Label>
            <Select v-model="type">
              <SelectTrigger id="album-type" data-test="type-select" class="w-full">
                <SelectValue :placeholder="t('search.any')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{{ t("search.any") }}</SelectItem>
                <SelectItem value="album">{{ t("search.album") }}</SelectItem>
                <SelectItem value="ep">{{ t("search.ep") }}</SelectItem>
                <SelectItem value="single">{{ t("search.single") }}</SelectItem>
                <SelectItem value="other">{{ t("search.other") }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex gap-2">
          <Button type="submit" class="flex-1" :disabled="loading || !hasSearchableContent">
            {{ loading ? t("search.searching") : t("search.search") }}
          </Button>
          <Button
            v-if="hasSearchableContent"
            type="button"
            variant="outline"
            @click="clearAllFields"
          >
            {{ t("search.clear") }}
          </Button>
          <Button
            data-test="manual-start-button"
            type="button"
            variant="ghost"
            class="shrink-0"
            @click="emit('manualStart')"
          >
            {{ t("search.startManually") }}
          </Button>
        </div>
      </form>

      <div
        v-if="showRecents && recents.length"
        class="relative z-10 -mt-2 rounded-md border border-border bg-popover shadow-md"
      >
        <p class="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {{ t("search.recent") }}
        </p>
        <button
          v-for="(recent, index) in recents"
          :key="recent"
          type="button"
          :class="[
            'w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground',
            selectedIndex === index ? 'bg-accent text-accent-foreground' : '',
          ]"
          @mousedown.prevent="selectRecent(recent)"
        >
          {{ recent }}
        </button>
      </div>

      <p v-if="status" class="text-sm text-muted-foreground">{{ status }}</p>

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
          <span
            class="grid aspect-square place-items-center overflow-hidden bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            <img
              v-if="result.artworkUrl"
              :src="result.artworkUrl"
              alt=""
              class="size-full object-cover"
              loading="lazy"
            />
            <span v-else>{{ t("search.noArt") }}</span>
          </span>
          <span class="grid min-w-0 gap-1 p-3">
            <strong class="truncate text-sm font-semibold text-foreground">{{
              result.title
            }}</strong>
            <span class="truncate text-sm font-normal text-muted-foreground">
              {{ result.artist || t("search.unknownArtist") }} &middot;
              {{ result.releaseDate || t("search.unknownDate") }}
            </span>
          </span>
        </button>
      </div>
    </CardContent>
  </Card>
</template>
