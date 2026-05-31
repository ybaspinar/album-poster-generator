<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AlbumDraftInput } from "../domain/album";
import { searchMusicBrainzAlbums } from "../sources/musicbrainz";

const emit = defineEmits<{
  select: [album: AlbumDraftInput];
}>();

const query = ref("");
const results = ref<AlbumDraftInput[]>([]);
const status = ref("");
const loading = ref(false);

async function search(): Promise<void> {
  loading.value = true;
  status.value = "";

  try {
    results.value = await searchMusicBrainzAlbums(query.value);
    status.value = results.value.length
      ? `${results.value.length} result${results.value.length === 1 ? "" : "s"} found.`
      : "No results found. Start manually or adjust the query.";
  } catch (error) {
    status.value = error instanceof Error ? error.message : "MusicBrainz search failed.";
    results.value = [];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Find album data</CardTitle>
    </CardHeader>
    <CardContent class="grid gap-4">
      <form data-test="search-form" class="grid gap-3" @submit.prevent="search">
        <div class="grid gap-2">
          <Label for="album-search">Album search</Label>
          <Input
            id="album-search"
            v-model="query"
            data-test="search-input"
            type="search"
            aria-label="Album search example: Kids See Ghosts"
            placeholder="Kids See Ghosts"
          />
        </div>
        <Button type="submit" :disabled="loading">
          {{ loading ? "Searching…" : "Search" }}
        </Button>
      </form>

      <p v-if="status" class="text-sm text-muted-foreground">{{ status }}</p>

      <div v-if="results.length" class="grid gap-2">
        <Button
          v-for="(result, index) in results"
          :key="`${result.sourceId}-${index}`"
          :data-test="`result-${index}`"
          type="button"
          variant="outline"
          class="h-auto justify-start gap-3 whitespace-normal p-3 text-left"
          @click="emit('select', result)"
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
              {{ result.artist || "Unknown artist" }} ·
              {{ result.releaseDate || "Unknown date" }}
            </span>
          </span>
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
