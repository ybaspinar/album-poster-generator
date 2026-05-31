<script setup lang="ts">
import { computed, watch } from "vue";
import type { AlbumDraft, PosterFont } from "../domain/album";
import { loadGoogleFont, getFontFamilyString } from "../services/google-fonts";
import { isGoogleFont } from "../domain/album";

const props = defineProps<{
  draft: AlbumDraft;
}>();

const fontClass = computed(() => {
  const font = props.draft.font;
  // Only add class for predefined fonts, Google Fonts use inline style
  if (isGoogleFont(font)) return "";
  return `font-${font}`;
});

function getFontFamily(_font: PosterFont): string {
  const fonts: Record<PosterFont, string> = {
    gotham: "'Gotham', 'Helvetica Neue', Arial, sans-serif",
    inter: "Inter, ui-sans-serif, system-ui, sans-serif",
    system: "system-ui, ui-sans-serif, sans-serif",
  };
  
  // Check if it's a predefined font
  if (_font in fonts) {
    return fonts[_font as keyof typeof fonts];
  }
  
  // It's a Google Font
  return getFontFamilyString(_font);
}

// Load Google Font when font changes
watch(
  () => props.draft.font,
  async (newFont) => {
    if (isGoogleFont(newFont)) {
      try {
        await loadGoogleFont(newFont, ["400", "700"]);
      } catch (e) {
        console.error("Failed to load Google Font:", e);
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <article
    data-export-poster
    class="poster-page"
    :class="fontClass"
    aria-label="Album poster preview"
    :style="{ fontFamily: getFontFamily(draft.font) }"
  >
    <div class="poster-art-frame">
      <img
        v-if="draft.artworkUrl"
        :src="draft.artworkUrl"
        crossorigin="anonymous"
        :alt="`${draft.title || 'Album'} artwork`"
        class="poster-art"
      />
      <div v-else class="poster-art poster-art-empty">
        <span>Add artwork</span>
      </div>
    </div>

    <section class="poster-caption">
      <h2>{{ draft.title || "Untitled Album" }}</h2>
      <div class="poster-rule" />
      <div class="poster-meta-row">
        <div class="poster-meta-left">
          <p class="poster-release">{{ draft.metadataLine || draft.releaseDate || "Release date" }}</p>
          <p class="poster-artist">{{ draft.artist || "Unknown Artist" }}</p>
        </div>
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