<script setup lang="ts">
import type { AccordionItemProps } from "reka-ui";
import { AccordionItem as AccordionItemRoot, useForwardProps } from "reka-ui";

const props = defineProps<AccordionItemProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <AccordionItemRoot data-slot="accordion-item" v-bind="forwardedProps">
    <slot />
  </AccordionItemRoot>
</template>
