<script setup lang="ts">
import type { AccordionTriggerProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { ChevronDown } from "@lucide/vue";
import { reactiveOmit } from "@vueuse/core";
import { AccordionHeader, AccordionTrigger, useForwardProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <AccordionHeader as-child>
    <AccordionTrigger
      data-slot="accordion-trigger"
      v-bind="forwardedProps"
      :class="
        cn(
          'flex w-full items-center justify-between gap-3 p-3 text-left text-sm font-semibold hover:text-foreground/80',
          props.class,
        )
      "
    >
      <slot />
      <ChevronDown
        class="size-4 text-muted-foreground transition-transform duration-200"
        :class="{ 'rotate-180': forwardedProps.open }"
      />
    </AccordionTrigger>
  </AccordionHeader>
</template>
