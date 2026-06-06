<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { AlbumDraft, PosterFont, PosterLayout } from "../domain/album";
import { loadGoogleFont, getFontFamilyString } from "../services/google-fonts";
const props = defineProps<{
  draft: AlbumDraft;
}>();

const { t } = useI18n();

const POSTER_CANONICAL_WIDTH_PX = 720;

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

const previewScale = shallowRef(1);
const previewScaleStyle = computed(() => ({
  "--poster-preview-scale": String(previewScale.value),
}));

const posterStyle = computed(() => ({
  width: `${POSTER_CANONICAL_WIDTH_PX}px`,
  fontFamily: getFontFamily(props.draft.font),
  "--poster-bg-blur": `${props.draft.backgroundBlurAmount}px`,
  ...typographyVariables("title", props.draft.typography.title),
  ...typographyVariables("artist", props.draft.typography.artist),
  ...typographyVariables("metadata", props.draft.typography.metadata),
  ...typographyVariables("tracklist", props.draft.typography.tracklist),
}));

const previewFrameRef = useTemplateRef<HTMLElement>("previewFrame");
let previewFrameObserver: ResizeObserver | undefined;

function updatePreviewScale(): void {
  const frameWidth = previewFrameRef.value?.clientWidth ?? POSTER_CANONICAL_WIDTH_PX;
  previewScale.value = frameWidth > 0 ? frameWidth / POSTER_CANONICAL_WIDTH_PX : 1;
}

onMounted(() => {
  updatePreviewScale();

  if (typeof ResizeObserver === "undefined" || !previewFrameRef.value) {
    return;
  }

  previewFrameObserver = new ResizeObserver(updatePreviewScale);
  previewFrameObserver.observe(previewFrameRef.value);
});

onBeforeUnmount(() => {
  previewFrameObserver?.disconnect();
});

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
    [`--poster-${section}-size`]: String(style.size),
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
    Roboto: getFontFamilyString("Roboto"),
    "Open Sans": getFontFamilyString("Open Sans"),
    Lato: getFontFamilyString("Lato"),
    Montserrat: getFontFamilyString("Montserrat"),
    Poppins: getFontFamilyString("Poppins"),
    Raleway: getFontFamilyString("Raleway"),
    "Noto Sans": getFontFamilyString("Noto Sans"),
    "Source Sans Pro": getFontFamilyString("Source Sans Pro"),
    Nunito: getFontFamilyString("Nunito"),
    Oswald: getFontFamilyString("Oswald"),
    Ubuntu: getFontFamilyString("Ubuntu"),
    "Work Sans": getFontFamilyString("Work Sans"),
    Rubik: getFontFamilyString("Rubik"),
    "IBM Plex Sans": getFontFamilyString("IBM Plex Sans"),
    Karla: getFontFamilyString("Karla"),
    "Space Grotesk": getFontFamilyString("Space Grotesk"),
    "Bebas Neue": getFontFamilyString("Bebas Neue"),
    Teko: getFontFamilyString("Teko"),
    "Playfair Display": getFontFamilyString("Playfair Display"),
    Merriweather: getFontFamilyString("Merriweather"),
    Lora: getFontFamilyString("Lora"),
    "Crimson Text": getFontFamilyString("Crimson Text"),
    "Cormorant Garamond": getFontFamilyString("Cormorant Garamond"),
    "Zilla Slab": getFontFamilyString("Zilla Slab"),
    "Permanent Marker": getFontFamilyString("Permanent Marker"),
    Pacifico: getFontFamilyString("Pacifico"),
    "Dancing Script": getFontFamilyString("Dancing Script"),
    Courgette: getFontFamilyString("Courgette"),
    Bangers: getFontFamilyString("Bangers"),
    Anton: getFontFamilyString("Anton"),
  };

  return fonts[_font];
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
  <div ref="previewFrame" data-test="poster-preview-frame" class="poster-preview-frame">
    <div data-test="poster-preview-scale" class="poster-preview-scale" :style="previewScaleStyle">
      <article
        data-export-poster
        class="poster-page"
        :class="[fontClass, layoutClass, backgroundClasses]"
        :aria-label="t('preview.ariaLabel')"
        :style="[posterStyle, backgroundStyle]"
      >
        <div class="poster-art-frame">
          <img
            v-if="draft.artworkUrl"
            :src="draft.artworkUrl"
            crossorigin="anonymous"
            :alt="t('preview.artworkAlt', { title: draft.title || t('preview.untitledAlbum') })"
            class="poster-art"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="poster-art poster-art-empty">
            <span>{{ t("preview.addArtwork") }}</span>
          </div>
        </div>

        <section class="poster-caption">
          <h2 v-if="draft.showTitle">{{ draft.title || t("preview.untitledAlbum") }}</h2>
          <div v-if="draft.showTitle" class="poster-rule" />
          <div class="poster-meta-row">
            <div class="poster-meta-left">
              <p v-if="draft.showArtist" class="poster-release">
                {{ draft.metadataLine || draft.releaseDate || t("preview.releaseDate") }}
              </p>
              <p v-if="draft.showArtist" class="poster-artist">
                {{ draft.artist || t("preview.unknownArtist") }}
              </p>
            </div>
            <div
              v-if="draft.showSwatches"
              class="poster-swatches"
              :class="`poster-swatches-${draft.swatchShape}`"
              :aria-label="t('preview.paletteAria')"
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
            :aria-label="t('preview.tracklistAria')"
          >
            <li v-for="(track, index) in draft.tracklist" :key="`${track}-${index}`">
              <span>{{ index + 1 }}) </span>
              <span>{{ track }}</span>
            </li>
          </ol>
        </section>
      </article>
    </div>
  </div>
</template>
