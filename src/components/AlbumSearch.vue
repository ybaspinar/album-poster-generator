<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AlbumDraftInput } from "../domain/album";
import { addRecentSearch, readRecentSearches } from "../sources/search-recent";
import { searchMusicBrainzAlbums } from "../sources/musicbrainz";

const emit = defineEmits<{
  select: [album: AlbumDraftInput];
}>();

const query = ref("");
const results = ref<AlbumDraftInput[]>([]);
const status = ref("");
const loading = ref(false);
const selectedIndex = ref(-1);
const showRecents = ref(false);
const recents = ref<string[]>([]);
const searchInputRef = ref<HTMLInputElement | null>(null);

function updateRecents(): void {
  recents.value = readRecentSearches();
}

function focusInput(): void {
  if (!query.value.trim()) {
    updateRecents();
    showRecents.value = recents.value.length > 0;
  }
}

function blurInput(): void {
  // Delay hiding so clicks on recent items register.
  setTimeout(() => {
    showRecents.value = false;
  }, 150);
}

function selectRecent(q: string): void {
  query.value = q;
  showRecents.value = false;
  performSearch();
}

function clearResults(): void {
  results.value = [];
  selectedIndex.value = -1;
  status.value = "";
}

function clearQuery(): void {
  query.value = "";
  clearResults();
  nextTick(() => {
    const el = searchInputRef.value?.$el?.querySelector?.("input") ?? searchInputRef.value;
    if (el && typeof el.focus === "function") {
      el.focus();
    }
  });
}

async function performSearch(): Promise<void> {
  const trimmed = query.value.trim();

  if (!trimmed) {
    clearResults();
    return;
  }

  showRecents.value = false;
  loading.value = true;
  status.value = "";
  selectedIndex.value = -1;

  try {
    results.value = await searchMusicBrainzAlbums(trimmed);
    status.value = results.value.length
      ? `${results.value.length} result${results.value.length === 1 ? "" : "s"} found.`
      : "No results found. Start manually or adjust the query.";
    if (results.value.length) {
      addRecentSearch(trimmed);
    }
  } catch (error) {
    status.value = error instanceof Error ? error.message : "MusicBrainz search failed.";
    results.value = [];
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = useDebounceFn(performSearch, 350);

watch(query, (value, oldValue) => {
  if (value.trim() !== oldValue?.trim()) {
    if (value.trim().length >= 3) {
      debouncedSearch();
    } else if (!value.trim()) {
      clearResults();
      updateRecents();
      showRecents.value = recents.value.length > 0;
    }
  }
});

function onKeyDown(event: KeyboardEvent): void {
  if (!results.value.length && !showRecents.value) return;

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
      query.value = "";
    } else {
      debouncedSearch.cancel();
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
  query.value = "";
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
          <Label for="album-search">Album search</Label>
          <div class="relative">
            <Input
              id="album-search"
              ref="searchInputRef"
              v-model="query"
              data-test="search-input"
              type="search"
              aria-label="Album search example: Kids See Ghosts"
              placeholder="Kids See Ghosts"
              autocomplete="off"
              @focus="focusInput"
              @blur="blurInput"
              @keydown="onKeyDown"
            />
            <button
              v-if="query"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
              @click="clearQuery"
            >
              <span class="sr-only">Clear</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <p class="text-xs text-muted-foreground">Tip: try “artist - album” for better results.</p>
        </div>
        <Button type="submit" :disabled="loading">
          {{ loading ? "Searching…" : "Search" }}
        </Button>
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
