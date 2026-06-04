<script setup lang="ts">
import posthog from "posthog-js";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AlbumDraft,
  GradientDirection,
  PosterBackgroundMode,
  PosterFont,
  PosterLayout,
  SwatchShape,
  TracklistColumns,
  TracklistSize,
  TypographySection,
  TypographyStyle,
  TypographyWeight,
} from "../domain/album";
import { posterFontOptions } from "../domain/album";
import { createArtworkObjectUrl, validateArtworkFile } from "../media/image-upload";
import { loadGoogleFont } from "../services/google-fonts";

type AlbumEditorTab = "information" | "tracklist" | "style";

const props = withDefaults(
  defineProps<{
    activeTab?: AlbumEditorTab;
    draft: AlbumDraft;
  }>(),
  {
    activeTab: "information",
  },
);

const emit = defineEmits<{
  patch: [patch: Partial<AlbumDraft>];
}>();

const typographySections: Array<{ key: TypographySection; label: string }> = [
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "metadata", label: "Date / metadata" },
  { key: "tracklist", label: "Tracklist" },
];

const typographyWeights: Array<{ value: TypographyWeight; label: string }> = [
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 700, label: "Bold" },
  { value: 800, label: "Extra bold" },
  { value: 900, label: "Black" },
];

function updateField(
  field: keyof Pick<
    AlbumDraft,
    "title" | "artist" | "releaseDate" | "metadataLine" | "artworkUrl" | "font"
  >,
  value: string | number,
): void {
  emit("patch", { [field]: String(value) });
}

function updateTracklist(value: string | number): void {
  const tracklist = String(value)
    .split("\n")
    .map((track) => track.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  emit("patch", { tracklist });
}

function updateShowTracklist(event: Event): void {
  emit("patch", { showTracklist: (event.target as HTMLInputElement).checked });
}

function updateTracklistColumns(value: string): void {
  emit("patch", { tracklistColumns: value as TracklistColumns });
}

function updateTracklistSize(value: string): void {
  emit("patch", { tracklistSize: value as TracklistSize });
}

function updateShowSwatches(event: Event): void {
  emit("patch", { showSwatches: (event.target as HTMLInputElement).checked });
}

function updateSwatchShape(value: string): void {
  emit("patch", { swatchShape: value as SwatchShape });
}

function updatePalette(index: number, value: string | number): void {
  const palette = [...props.draft.palette];
  palette[index] = String(value);
  emit("patch", { palette });
}

function uploadArtwork(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  const result = validateArtworkFile(file);

  if (!result.ok) {
    window.alert(result.message);
    target.value = "";
    return;
  }

  posthog.capture("artwork_uploaded", { file_type: file.type, file_size_bytes: file.size });
  emit("patch", { artworkUrl: createArtworkObjectUrl(file), artworkSource: "manual" });
}

function selectFont(value: string): void {
  emit("patch", { font: value as PosterFont });
}

function updateLayout(value: string): void {
  emit("patch", { layout: value as PosterLayout });
}

function updateBackgroundMode(value: string): void {
  emit("patch", { backgroundMode: value as PosterBackgroundMode });
}

function updateBackgroundSolidColor(value: string | number): void {
  emit("patch", { backgroundSolidColor: String(value) });
}

function updateBackgroundGradientFrom(value: string | number): void {
  emit("patch", { backgroundGradientFrom: String(value) });
}

function updateBackgroundGradientTo(value: string | number): void {
  emit("patch", { backgroundGradientTo: String(value) });
}

function updateBackgroundGradientDirection(value: string): void {
  emit("patch", { backgroundGradientDirection: value as GradientDirection });
}

function updateBackgroundBlur(event: Event): void {
  emit("patch", { backgroundBlur: (event.target as HTMLInputElement).checked });
}

function updateBackgroundBlurAmount(value: string | number): void {
  const amount = Number(value);
  emit("patch", { backgroundBlurAmount: Number.isFinite(amount) ? amount : 0 });
}

function updateTypography(section: TypographySection, patch: Partial<TypographyStyle>): void {
  emit("patch", {
    typography: {
      ...props.draft.typography,
      [section]: {
        ...props.draft.typography[section],
        ...patch,
      },
    },
  });
}

function updateTypographyColor(section: TypographySection, value: string | number): void {
  updateTypography(section, { color: String(value) });
}

function updateTypographySize(section: TypographySection, value: string | number): void {
  const size = Number(value);
  updateTypography(section, { size: Number.isFinite(size) ? size : 100 });
}

function updateTypographyWeight(section: TypographySection, value: string): void {
  const weight = Number(value);
  updateTypography(section, {
    weight: (weight === 400 || weight === 500 || weight === 700 || weight === 800 || weight === 900
      ? weight
      : 400) as TypographyWeight,
  });
}

function updateTypographyItalic(section: TypographySection, event: Event): void {
  updateTypography(section, { italic: (event.target as HTMLInputElement).checked });
}

function updateTypographyUppercase(section: TypographySection, event: Event): void {
  updateTypography(section, { uppercase: (event.target as HTMLInputElement).checked });
}

function fontLabel(font: PosterFont): string {
  const labels: Record<PosterFont, string> = {
    gotham: "Gotham (built-in sans-serif)",
    inter: "Inter (built-in sans-serif)",
    system: "System default",
    // Sans-serif Google Fonts
    Roboto: "Roboto",
    "Open Sans": "Open Sans",
    Lato: "Lato",
    Montserrat: "Montserrat",
    Poppins: "Poppins",
    Raleway: "Raleway",
    "Noto Sans": "Noto Sans",
    "Source Sans Pro": "Source Sans Pro",
    Nunito: "Nunito",
    Oswald: "Oswald",
    Ubuntu: "Ubuntu",
    "Work Sans": "Work Sans",
    Rubik: "Rubik",
    "IBM Plex Sans": "IBM Plex Sans",
    Karla: "Karla",
    "Space Grotesk": "Space Grotesk",
    "Bebas Neue": "Bebas Neue",
    Teko: "Teko",
    // Serif Google Fonts
    "Playfair Display": "Playfair Display",
    Merriweather: "Merriweather",
    Lora: "Lora",
    "Crimson Text": "Crimson Text",
    "Cormorant Garamond": "Cormorant Garamond",
    "Zilla Slab": "Zilla Slab",
    // Display/Decorative Google Fonts
    "Permanent Marker": "Permanent Marker",
    Pacifico: "Pacifico",
    "Dancing Script": "Dancing Script",
    Courgette: "Courgette",
    Bangers: "Bangers",
    Anton: "Anton",
  };
  return labels[font] || font;
}
</script>

<template>
  <section class="grid gap-4" data-test="album-editor-panels">
    <div v-show="props.activeTab === 'information'" data-test="editor-panel-information" class="grid gap-4">
      <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Album details
        </h3>
        <div class="grid gap-3 px-1">
          <div class="grid gap-2">
            <Label for="poster-title">Title</Label>
            <Input
              id="poster-title"
              data-test="title-input"
              :model-value="draft.title"
              @update:model-value="updateField('title', $event)"
            />
          </div>

          <div class="grid gap-2">
            <Label for="poster-artist">Artist</Label>
            <Input
              id="poster-artist"
              :model-value="draft.artist"
              @update:model-value="updateField('artist', $event)"
            />
          </div>

          <div class="grid gap-2">
            <Label for="poster-release-date">Release date</Label>
            <Input
              id="poster-release-date"
              :model-value="draft.releaseDate"
              aria-label="Release date, for example 2018-06-08"
              @update:model-value="updateField('releaseDate', $event)"
            />
          </div>

          <div class="grid gap-2">
            <Label for="poster-metadata-line">Metadata line</Label>
            <Input
              id="poster-metadata-line"
              :model-value="draft.metadataLine"
              @update:model-value="updateField('metadataLine', $event)"
            />
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Artwork
        </h3>
        <div class="grid gap-3 px-1">
          <div class="grid gap-2">
            <Label for="poster-artwork-url">Artwork URL</Label>
            <Input
              id="poster-artwork-url"
              :model-value="draft.artworkUrl"
              @update:model-value="updateField('artworkUrl', $event)"
            />
          </div>

          <div class="grid gap-2">
            <Label for="poster-artwork-upload">Upload artwork</Label>
            <Input
              id="poster-artwork-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              @change="uploadArtwork"
            />
          </div>
        </div>
      </section>
    </div>

    <div v-show="props.activeTab === 'tracklist'" data-test="editor-panel-tracklist" class="grid gap-4">
      <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
        <div class="grid gap-3 px-1">
          <div class="grid gap-2">
            <div class="flex items-center justify-between gap-3">
              <Label for="poster-tracklist">Tracklist</Label>
              <label
                for="poster-show-tracklist"
                class="flex items-center gap-2 text-xs font-medium text-muted-foreground"
              >
                <input
                  id="poster-show-tracklist"
                  data-test="show-tracklist-input"
                  type="checkbox"
                  class="size-4 rounded border-input accent-primary"
                  :checked="draft.showTracklist"
                  @change="updateShowTracklist"
                />
                Show on poster
              </label>
            </div>
            <textarea
              id="poster-tracklist"
              data-test="tracklist-input"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              :value="draft.tracklist.join('\n')"
              placeholder="One track per line"
              @input="updateTracklist(($event.target as HTMLTextAreaElement).value)"
            />
            <p class="text-muted-foreground text-xs">
              One track per line. Numbers are added on the poster.
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div class="grid gap-2">
                <Label for="poster-tracklist-columns">Tracklist columns</Label>
                <Select
                  :model-value="draft.tracklistColumns"
                  @update:model-value="updateTracklistColumns"
                >
                  <SelectTrigger id="poster-tracklist-columns" class="w-full">
                    <SelectValue placeholder="Columns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="1">1 column</SelectItem>
                      <SelectItem value="2">2 columns</SelectItem>
                      <SelectItem value="3">3 columns</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid gap-2">
                <Label for="poster-tracklist-size">Tracklist size</Label>
                <Select :model-value="draft.tracklistSize" @update:model-value="updateTracklistSize">
                  <SelectTrigger id="poster-tracklist-size" class="w-full">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-show="props.activeTab === 'style'" data-test="editor-panel-style" class="grid gap-4">
      <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Typography
        </h3>
        <div class="grid gap-3 px-1">
          <div class="grid gap-2">
            <Label for="poster-font">Font</Label>
            <Select :model-value="draft.font" @update:model-value="selectFont">
              <SelectTrigger id="poster-font" class="w-full">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="font in posterFontOptions" :key="font" :value="font">
                    {{ fontLabel(font) }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div
            v-for="section in typographySections"
            :key="section.key"
            class="grid gap-3 rounded-md border border-border/60 p-3"
          >
            <div class="text-sm font-semibold">{{ section.label }}</div>
            <div class="grid grid-cols-2 gap-3">
              <div class="grid gap-2">
                <Label :for="`typography-${section.key}-color`">Color</Label>
                <Input
                  :id="`typography-${section.key}-color`"
                  :data-test="`typography-${section.key}-color-input`"
                  type="color"
                  class="h-10 p-1"
                  :model-value="draft.typography[section.key].color"
                  @update:model-value="updateTypographyColor(section.key, $event)"
                />
              </div>
              <div class="grid gap-2">
                <Label :for="`typography-${section.key}-weight`">Weight</Label>
                <Select
                  :model-value="String(draft.typography[section.key].weight)"
                  @update:model-value="updateTypographyWeight(section.key, String($event))"
                >
                  <SelectTrigger :id="`typography-${section.key}-weight`" class="w-full">
                    <SelectValue placeholder="Weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="weight in typographyWeights"
                        :key="weight.value"
                        :value="String(weight.value)"
                      >
                        {{ weight.label }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="grid gap-2">
              <div class="flex items-center justify-between gap-3">
                <Label :for="`typography-${section.key}-size`">Size</Label>
                <span class="text-xs tabular-nums text-muted-foreground">
                  {{ draft.typography[section.key].size }}px
                </span>
              </div>
              <Input
                :id="`typography-${section.key}-size`"
                :data-test="`typography-${section.key}-size-input`"
                type="number"
                min="8"
                max="96"
                step="1"
                class="h-9"
                :model-value="draft.typography[section.key].size"
                @update:model-value="updateTypographySize(section.key, $event)"
              />
              <label class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  class="size-4 rounded border-input accent-primary"
                  :checked="draft.typography[section.key].italic"
                  @change="updateTypographyItalic(section.key, $event)"
                />
                Italic
              </label>
              <label class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  class="size-4 rounded border-input accent-primary"
                  :checked="draft.typography[section.key].uppercase"
                  @change="updateTypographyUppercase(section.key, $event)"
                />
                Uppercase
              </label>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Swatches
        </h3>
        <div class="grid gap-3 px-1">
          <div class="flex items-center justify-between gap-3">
            <Label for="poster-show-swatches">Palette swatches</Label>
            <label
              for="poster-show-swatches"
              class="flex items-center gap-2 text-xs font-medium text-muted-foreground"
            >
              <input
                id="poster-show-swatches"
                data-test="show-swatches-input"
                type="checkbox"
                class="size-4 rounded border-input accent-primary"
                :checked="draft.showSwatches"
                @change="updateShowSwatches"
              />
              Show on poster
            </label>
          </div>

          <div class="grid gap-2">
            <Label for="poster-swatch-shape">Swatch shape</Label>
            <Select :model-value="draft.swatchShape" @update:model-value="updateSwatchShape">
              <SelectTrigger id="poster-swatch-shape" class="w-full">
                <SelectValue placeholder="Select swatch shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-3 gap-3" aria-label="Palette editor">
            <div
              v-for="(color, index) in draft.palette"
              :key="`${color}-${index}`"
              class="grid gap-2"
            >
              <Label :for="`palette-${index}`">Swatch {{ index + 1 }}</Label>
              <Input
                :id="`palette-${index}`"
                :data-test="`palette-input-${index}`"
                type="color"
                class="h-10 p-1"
                :model-value="color"
                @update:model-value="updatePalette(index, $event)"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Background
        </h3>
        <div class="grid gap-3 px-1">
          <div class="grid gap-2">
            <Label for="poster-background-mode">Mode</Label>
            <Select :model-value="draft.backgroundMode" @update:model-value="updateBackgroundMode">
              <SelectTrigger id="poster-background-mode" class="w-full">
                <SelectValue placeholder="Select background" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="artwork">Artwork</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div v-if="draft.backgroundMode === 'solid'" class="grid gap-2">
            <Label for="poster-background-color">Background color</Label>
            <Input
              id="poster-background-color"
              type="color"
              class="h-10 p-1"
              :model-value="draft.backgroundSolidColor"
              @update:model-value="updateBackgroundSolidColor"
            />
          </div>

          <template v-if="draft.backgroundMode === 'gradient'">
            <div class="grid grid-cols-2 gap-3">
              <div class="grid gap-2">
                <Label for="poster-bg-from">From</Label>
                <Input
                  id="poster-bg-from"
                  type="color"
                  class="h-10 p-1"
                  :model-value="draft.backgroundGradientFrom"
                  @update:model-value="updateBackgroundGradientFrom"
                />
              </div>
              <div class="grid gap-2">
                <Label for="poster-bg-to">To</Label>
                <Input
                  id="poster-bg-to"
                  type="color"
                  class="h-10 p-1"
                  :model-value="draft.backgroundGradientTo"
                  @update:model-value="updateBackgroundGradientTo"
                />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="poster-bg-direction">Direction</Label>
              <Select
                :model-value="draft.backgroundGradientDirection"
                @update:model-value="updateBackgroundGradientDirection"
              >
                <SelectTrigger id="poster-bg-direction" class="w-full">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </template>

          <div v-if="draft.backgroundMode === 'artwork'" class="text-sm text-muted-foreground">
            Album artwork will fill the poster background. Caption will remain on top.
          </div>

          <div class="grid gap-2 pt-1">
            <div class="flex items-center gap-2">
              <input
                id="poster-bg-blur"
                type="checkbox"
                class="size-4 rounded border-input accent-primary"
                :checked="draft.backgroundBlur"
                @change="updateBackgroundBlur"
              />
              <Label for="poster-bg-blur" class="text-sm font-medium">Frosted overlay</Label>
            </div>
            <div class="grid gap-2">
              <div class="flex items-center justify-between gap-3">
                <Label for="poster-bg-blur-amount" class="text-sm font-medium">
                  Blur level
                </Label>
                <span class="text-xs text-muted-foreground">{{ draft.backgroundBlurAmount }}px</span>
              </div>
              <Input
                id="poster-bg-blur-amount"
                data-test="background-blur-amount-input"
                type="range"
                min="0"
                max="24"
                step="1"
                class="h-10 p-0"
                :model-value="draft.backgroundBlurAmount"
                @update:model-value="updateBackgroundBlurAmount"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Layout
        </h3>
        <div class="grid gap-2 px-1">
          <Label for="poster-layout">Spacing</Label>
          <Select :model-value="draft.layout" @update:model-value="updateLayout">
            <SelectTrigger id="poster-layout" class="w-full">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="edge-to-edge">Edge to Edge</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </section>
    </div>
  </section>
</template>
