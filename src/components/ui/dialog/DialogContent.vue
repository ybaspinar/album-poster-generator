<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { DialogContent, DialogOverlay, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<DialogContentProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<DialogContentEmits>();

const delegatedProps = reactiveOmit(props, "class");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DialogOverlay class="fixed inset-0 z-50 bg-black/70" />
  <DialogContent
    v-bind="{ ...$attrs, ...forwarded }"
    :class="
      cn(
        'fixed left-1/2 top-1/2 z-50 grid max-h-[85vh] w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-lg border bg-background p-6 text-foreground shadow-2xl',
        props.class,
      )
    "
  >
    <slot />
  </DialogContent>
</template>
