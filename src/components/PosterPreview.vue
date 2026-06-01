<script setup lang="ts">
import { computed, watch } from "vue";
import type { AlbumDraft, PosterFont, PosterLayout } from "../domain/album";
import { loadGoogleFont, getFontFamilyString } from "../services/google-fonts";

const props = defineProps<{
  draft: AlbumDraft;
}>();

// Built-in fonts that have CSS classes defined
const BUILTIN_FONTS = ["gotham", "inter", "system"] as const;

const fontClass = computed(() => {
  const font = props.draft.font;
  // Only add class for built-in fonts, others use inline style
  if (BUILTIN_FONTS.includes(font as (typeof BUILTIN_FONTS)[number])) {
    return `font-${font}`;
  }
  return "";
});

const layoutClass = computed(() => {
  const layout: PosterLayout = props.draft.layout;
  if (layout === "medium") return "";
  return `poster-layout-${layout}`;
});

const posterStyle = computed(() => ({
  fontFamily: getFontFamily(props.draft.font),
  "--poster-bg-blur": `${props.draft.backgroundBlurAmount}px`,
  ...typographyVariables("title", props.draft.typography.title),
  ...typographyVariables("artist", props.draft.typography.artist),
  ...typographyVariables("metadata", props.draft.typography.metadata),
  ...typographyVariables("tracklist", props.draft.typography.tracklist),
}));

const backgroundStyle = computed(() => {
  const mode = props.draft.backgroundMode;
  if (mode === "solid") {
    return { background: props.draft.backgroundSolidColor };
  }
  if (mode === "gradient") {
    const from = props.draft.backgroundGradientFrom;
    const to = props.draft.backgroundGradientTo;
    const dir = props.draft.backgroundGradientDirection;
    if (dir === "horizontal") {
      return { background: `linear-gradient(to right, ${from}, ${to})` };
    }
    if (dir === "radial") {
      return { background: `radial-gradient(circle, ${from}, ${to})` };
    }
    return { background: `linear-gradient(to bottom, ${from}, ${to})` };
  }
  if (mode === "artwork" && props.draft.artworkUrl) {
    return { backgroundImage: `url(${props.draft.artworkUrl})` };
  }
  return {};
});

const backgroundClasses = computed(() => {
  const classes: string[] = [];
  if (props.draft.backgroundBlur) classes.push("poster-bg-frosted");
  if (props.draft.backgroundMode === "artwork") classes.push("poster-bg-artwork");
  return classes;
});

function typographyVariables(
  section: "title" | "artist" | "metadata" | "tracklist",
  style: {
    color: string;
    size: number;
    weight: number;
    italic: boolean;
    uppercase: boolean;
  },
): Record<string, string> {
  return {
    [`--poster-${section}-color`]: style.color,
    [`--poster-${section}-size`]: `${style.size}px`,
    [`--poster-${section}-weight`]: String(style.weight),
    [`--poster-${section}-style`]: style.italic ? "italic" : "normal",
    [`--poster-${section}-transform`]: style.uppercase ? "uppercase" : "none",
  };
}

function getFontFamily(_font: PosterFont): string {
  const fonts: Record<PosterFont, string> = {
    gotham: "'Gotham', 'Helvetica Neue', Arial, sans-serif",
    inter: "Inter, ui-sans-serif, system-ui, sans-serif",
    system: "system-ui, ui-sans-serif, sans-serif",
  };

  // Check if it's a built-in font
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
    if (!BUILTIN_FONTS.includes(newFont as (typeof BUILTIN_FONTS)[number])) {
      try {
        await loadGoogleFont(newFont, ["400", "700"]);
      } catch {
        // Silently fail in test environment, use fallback font
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <article
    data-export-poster
    class="poster-page"
    :class="[fontClass, layoutClass, backgroundClasses]"
    aria-label="Album poster preview"
    :style="[posterStyle, backgroundStyle]"
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
          <p class="poster-release">
            {{ draft.metadataLine || draft.releaseDate || "Release date" }}
          </p>
          <p class="poster-artist">{{ draft.artist || "Unknown Artist" }}</p>
        </div>
        <div
          v-if="draft.showSwatches"
          class="poster-swatches"
          :class="`poster-swatches-${draft.swatchShape}`"
          aria-label="Poster palette"
        >
          <span
            v-for="color in draft.palette"
            :key="color"
            class="poster-swatch"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>

      <ol
        v-if="draft.showTracklist && draft.tracklist.length"
        class="poster-tracklist"
        :class="[
          `poster-tracklist-columns-${draft.tracklistColumns}`,
          `poster-tracklist-size-${draft.tracklistSize}`,
        ]"
        aria-label="Tracklist"
      >
        <li v-for="(track, index) in draft.tracklist" :key="`${track}-${index}`">
          <span>{{ index + 1 }}) </span>
          <span>{{ track }}</span>
        </li>
      </ol>
    </section>
  </article>
</template>
