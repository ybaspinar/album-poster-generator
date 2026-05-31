<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AlbumDraft } from "../domain/album";
import { createArtworkObjectUrl, validateArtworkFile } from "../media/image-upload";

const props = defineProps<{
  draft: AlbumDraft;
}>();

const emit = defineEmits<{
  patch: [patch: Partial<AlbumDraft>];
}>();

function updateField(
  field: keyof Pick<AlbumDraft, "title" | "artist" | "releaseDate" | "metadataLine" | "artworkUrl">,
  value: string | number,
): void {
  emit("patch", { [field]: String(value) });
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

  emit("patch", { artworkUrl: createArtworkObjectUrl(file), artworkSource: "manual" });
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Edit poster</CardTitle>
    </CardHeader>
    <CardContent class="grid gap-5">
      <div class="grid gap-3">
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

      <div class="grid grid-cols-3 gap-3" aria-label="Palette editor">
        <div v-for="(color, index) in draft.palette" :key="`${color}-${index}`" class="grid gap-2">
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
    </CardContent>
  </Card>
</template>
