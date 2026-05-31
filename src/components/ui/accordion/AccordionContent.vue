<script setup lang="ts">
import type { AccordionContentProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { AccordionContent, useForwardProps } from "reka-ui";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const props = defineProps<AccordionContentProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <AccordionContent
    data-slot="accordion-content"
    v-bind="forwardedProps"
    :class="cn('overflow-hidden text-sm transition-all', props.class)"
  >
    <CardContent :class="cn('p-4 pt-0', props.class)">
      <slot />
    </CardContent>
  </AccordionContent>
</template>
