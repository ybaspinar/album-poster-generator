<script setup lang="ts">
import type { AlbumDraft } from "../domain/album";

defineProps<{
  draft: AlbumDraft;
}>();
</script>

<template>
  <article data-export-poster class="poster-page" aria-label="Album poster preview">
    <div class="poster-art-frame">
      <img
        v-if="draft.artworkUrl"
        :src="draft.artworkUrl"
        :alt="`${draft.title || 'Album'} artwork`"
        class="poster-art"
      />
      <div v-else class="poster-art poster-art-empty">
        <span>Add artwork</span>
      </div>
    </div>

    <section class="poster-caption">
      <h2>{{ draft.title || "Untitled Album" }}</h2>
      <p class="poster-artist">{{ draft.artist || "Unknown Artist" }}</p>
      <div class="poster-rule" />
      <div class="poster-meta-row">
        <p>{{ draft.metadataLine || draft.releaseDate || "Release date" }}</p>
        <div class="poster-swatches" aria-label="Poster palette">
          <span
            v-for="color in draft.palette"
            :key="color"
            class="poster-swatch"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>
    </section>
  </article>
</template>
