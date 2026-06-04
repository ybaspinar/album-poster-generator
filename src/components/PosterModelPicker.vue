<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { posterModels, type PosterModelId } from "../domain/poster-models";

const props = defineProps<{
  selectedModelId: PosterModelId;
}>();

const emit = defineEmits<{
  back: [];
  selectModel: [modelId: PosterModelId];
}>();

const selectedModel = computed(() => props.selectedModelId);
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
        <CardDescription>Select a starting point. You can still edit every field after this.</CardDescription>
      </div>
    </CardHeader>

    <CardContent class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <button
        v-for="model in posterModels"
        :key="model.id"
        :data-test="`poster-model-${model.id}`"
        type="button"
        :class="[
          'group grid gap-3 rounded-2xl border bg-background/70 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-lg',
          selectedModel === model.id ? 'border-primary ring-2 ring-primary/25' : 'border-border/70',
        ]"
        @click="emit('selectModel', model.id)"
      >
        <span class="grid aspect-[3/4] place-items-center overflow-hidden rounded-xl border border-border/70 bg-zinc-950 p-4 shadow-inner">
          <span class="grid h-full w-full content-between rounded-lg border border-white/15 bg-gradient-to-b from-zinc-800 to-zinc-950 p-3">
            <span class="mx-auto size-16 rounded-2xl bg-white/80" />
            <span class="grid gap-1">
              <span class="h-3 w-4/5 rounded-full bg-white/80" />
              <span class="h-2 w-3/5 rounded-full bg-white/50" />
              <span class="mt-2 grid grid-cols-2 gap-1">
                <span class="h-1.5 rounded-full bg-white/35" />
                <span class="h-1.5 rounded-full bg-white/35" />
                <span class="h-1.5 rounded-full bg-white/25" />
                <span class="h-1.5 rounded-full bg-white/25" />
              </span>
            </span>
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
