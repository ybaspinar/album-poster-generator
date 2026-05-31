<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
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

const emit = defineEmits<{
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
  type.value = "";
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
      ? `${results.value.length} result${results.value.length === 1 ? "" : "s"} found.`
      : "No results found. Start manually or adjust the query.";
    if (results.value.length) {
      const label = paramsDisplayLabel(currentParams());
      if (label) addRecentSearch(label);
    }
  } catch (error) {
    status.value = error instanceof Error ? error.message : "MusicBrainz search failed.";
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
      <CardTitle>Find album data</CardTitle>
    </CardHeader>
    <CardContent class="grid gap-4">
      <form data-test="search-form" class="grid gap-3" @submit.prevent="performSearch">
        <div class="grid gap-2">
          <Label for="album-artist">Artist</Label>
          <div class="relative">
            <Input
              id="album-artist"
              ref="artistInputRef"
              v-model="artist"
              data-test="artist-input"
              type="search"
              placeholder="Kanye West"
              autocomplete="off"
              @focus="focusArtistInput"
              @blur="blurArtistInput"
              @input="onSearchInput"
              @keydown="onKeyDown"
            />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="album-title">Title</Label>
          <div class="relative">
            <Input
              id="album-title"
              v-model="title"
              data-test="title-input"
              type="search"
              placeholder="Kids See Ghosts"
              autocomplete="off"
              @input="onSearchInput"
              @keydown="onKeyDown"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-2">
            <Label for="album-year">Year</Label>
            <Input
              id="album-year"
              v-model="year"
              data-test="year-input"
              type="search"
              placeholder="2018"
              autocomplete="off"
              @input="onSearchInput"
              @keydown="onKeyDown"
            />
          </div>
          <div class="grid gap-2">
            <Label for="album-type">Type</Label>
            <Select v-model="type">
              <SelectTrigger id="album-type" data-test="type-select" class="w-full">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="album">Album</SelectItem>
                <SelectItem value="ep">EP</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex gap-2">
          <Button type="submit" class="flex-1" :disabled="loading || !hasSearchableContent">
            {{ loading ? "Searching…" : "Search" }}
          </Button>
          <Button
            v-if="hasSearchableContent"
            type="button"
            variant="outline"
            @click="clearAllFields"
          >
            Clear
          </Button>
        </div>
      </form>

      <div
        v-if="showRecents && recents.length"
        class="relative z-10 -mt-2 rounded-md border border-border bg-popover shadow-md"
      >
        <p class="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recent
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

      <div v-if="results.length" class="grid gap-2">
        <Button
          v-for="(result, index) in results"
          :key="`${result.sourceId}-${index}`"
          :data-test="`result-${index}`"
          type="button"
          variant="outline"
          :class="[
            'h-auto justify-start gap-3 whitespace-normal p-3 text-left',
            selectedIndex === index ? 'ring-2 ring-ring' : '',
          ]"
          @click="selectResult(result)"
        >
          <span
            class="grid size-13 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted text-[0.58rem] font-bold uppercase tracking-wider text-muted-foreground"
            aria-hidden="true"
          >
            <img
              v-if="result.artworkUrl"
              :src="result.artworkUrl"
              alt=""
              class="size-full object-cover"
              loading="lazy"
            />
            <span v-else>No art</span>
          </span>
          <span class="grid min-w-0 gap-1">
            <strong class="truncate text-sm font-medium text-foreground">{{ result.title }}</strong>
            <span class="truncate text-sm font-normal text-muted-foreground">
              {{ result.artist || "Unknown artist" }} &middot;
              {{ result.releaseDate || "Unknown date" }}
            </span>
          </span>
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
