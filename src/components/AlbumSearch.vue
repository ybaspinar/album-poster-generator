<script setup lang="ts">
import { ref } from "vue";
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
  <section class="control-card">
    <h2>Find album data</h2>
    <form data-test="search-form" class="search-form" @submit.prevent="search">
      <label>
        Album search
        <input
          data-test="search-input"
          v-model="query"
          type="search"
          aria-label="Album search example: Kids See Ghosts"
        />
      </label>
      <button type="submit" :disabled="loading">{{ loading ? "Searching…" : "Search" }}</button>
    </form>
    <p v-if="status" class="status-text">{{ status }}</p>
    <div class="results-list">
      <button
        v-for="(result, index) in results"
        :key="`${result.sourceId}-${index}`"
        :data-test="`result-${index}`"
        type="button"
        class="result-button"
        @click="emit('select', result)"
      >
        <strong>{{ result.title }}</strong>
        <span
          >{{ result.artist || "Unknown artist" }} ·
          {{ result.releaseDate || "Unknown date" }}</span
        >
      </button>
    </div>
  </section>
</template>
