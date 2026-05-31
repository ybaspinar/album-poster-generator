<script setup lang="ts">
import type { AccordionHeaderProps } from "reka-ui";
import { AccordionHeader, useForwardProps } from "reka-ui";

const props = defineProps<AccordionHeaderProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <AccordionHeader data-slot="accordion-header" v-bind="forwardedProps">
    <slot />
  </AccordionHeader>
</template>
