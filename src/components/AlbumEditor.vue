<script setup lang="ts">
import { ref } from "vue";
import posthog from "posthog-js";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  PosterFont,
  SwatchShape,
  TracklistColumns,
  TracklistSize,
} from "../domain/album";
import { posterFontOptions } from "../domain/album";
import { createArtworkObjectUrl, validateArtworkFile } from "../media/image-upload";
import { loadGoogleFont } from "../services/google-fonts";

const props = defineProps<{
  draft: AlbumDraft;
}>();

const emit = defineEmits<{
  patch: [patch: Partial<AlbumDraft>];
}>();

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
  <Card>
    <CardHeader>
      <CardTitle>Edit poster</CardTitle>
    </CardHeader>
    <CardContent class="grid gap-0">
      <Accordion
        type="multiple"
        class="w-full"
        :default-value="['info', 'tracklist', 'artwork', 'typography', 'colors', 'layout']"
      >
        <AccordionItem value="info">
          <AccordionTrigger>Info</AccordionTrigger>
          <AccordionContent>
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tracklist">
          <AccordionTrigger>Tracklist</AccordionTrigger>
          <AccordionContent>
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
                    <Select
                      :model-value="draft.tracklistSize"
                      @update:model-value="updateTracklistSize"
                    >
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="artwork">
          <AccordionTrigger>Artwork</AccordionTrigger>
          <AccordionContent>
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="typography">
          <AccordionTrigger>Typography</AccordionTrigger>
          <AccordionContent>
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
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="colors">
          <AccordionTrigger>Colors</AccordionTrigger>
          <AccordionContent>
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="layout">
          <AccordionTrigger>Layout</AccordionTrigger>
          <AccordionContent>
            <div class="px-1 py-2">
              <p class="text-sm text-muted-foreground">
                Additional layout options will appear here.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
</template>
