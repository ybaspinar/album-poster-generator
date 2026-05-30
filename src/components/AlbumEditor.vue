<script setup lang="ts">
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
  event: Event,
): void {
  const target = event.target as HTMLInputElement;
  emit("patch", { [field]: target.value });
}

function updatePalette(index: number, event: Event): void {
  const target = event.target as HTMLInputElement;
  const palette = [...props.draft.palette];
  palette[index] = target.value;
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
  <section class="control-card">
    <h2>Edit poster</h2>
    <div class="field-grid">
      <label>
        Title
        <input data-test="title-input" :value="draft.title" @input="updateField('title', $event)" />
      </label>
      <label>
        Artist
        <input :value="draft.artist" @input="updateField('artist', $event)" />
      </label>
      <label>
        Release date
        <input
          :value="draft.releaseDate"
          aria-label="Release date, for example 2018-06-08"
          @input="updateField('releaseDate', $event)"
        />
      </label>
      <label>
        Metadata line
        <input :value="draft.metadataLine" @input="updateField('metadataLine', $event)" />
      </label>
      <label>
        Artwork URL
        <input :value="draft.artworkUrl" @input="updateField('artworkUrl', $event)" />
      </label>
      <label>
        Upload artwork
        <input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadArtwork" />
      </label>
    </div>
    <div class="palette-editor" aria-label="Palette editor">
      <label v-for="(color, index) in draft.palette" :key="`${color}-${index}`">
        Swatch {{ index + 1 }}
        <input type="color" :value="color" @input="updatePalette(index, $event)" />
      </label>
    </div>
  </section>
</template>
