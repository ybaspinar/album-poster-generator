<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AlbumDraft } from "../domain/album";
import { applyPosterModel, posterModels, type PosterModelId } from "../domain/poster-models";
import PosterPreview from "./PosterPreview.vue";

const props = defineProps<{
  draft: AlbumDraft;
  selectedModelId: PosterModelId;
}>();

const emit = defineEmits<{
  back: [];
  selectModel: [modelId: PosterModelId];
}>();

const selectedModel = computed(() => props.selectedModelId);
const modelPreviews = computed(() =>
  posterModels.map((model) => ({
    ...model,
    draft: applyPosterModel(props.draft, model.id),
  })),
);
</script>

<template>
  <Card class="border-border/80 bg-card/92 shadow-2xl shadow-black/10 backdrop-blur">
    <CardHeader class="gap-3">
      <Button
        data-test="model-back-button"
        type="button"
        variant="ghost"
        class="w-fit gap-2 px-0 text-muted-foreground hover:text-foreground"
        @click="emit('back')"
      >
        <ArrowLeft class="size-4" />
        Back to search
      </Button>
      <div class="grid gap-1">
        <CardTitle class="text-3xl tracking-tight">Choose a poster model</CardTitle>
        <CardDescription
          >Select a starting point. You can still edit every field after this.</CardDescription
        >
      </div>
    </CardHeader>

    <CardContent class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        v-for="model in modelPreviews"
        :key="model.id"
        :data-test="`poster-model-${model.id}`"
        type="button"
        :class="[
          'group grid gap-3 rounded-2xl border bg-background/70 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-lg',
          selectedModel === model.id ? 'border-primary ring-2 ring-primary/25' : 'border-border/70',
        ]"
        @click="emit('selectModel', model.id)"
      >
        <span
          class="grid place-items-center overflow-hidden rounded-xl border border-border/70 bg-background p-1 shadow-sm"
        >
          <span class="w-full max-w-[420px] overflow-hidden rounded-lg">
            <PosterPreview :draft="model.draft" />
          </span>
        </span>
        <span class="grid gap-1">
          <strong class="text-base text-foreground">{{ model.label }}</strong>
          <span class="text-sm text-muted-foreground">{{ model.description }}</span>
        </span>
      </button>
    </CardContent>
  </Card>
</template>
