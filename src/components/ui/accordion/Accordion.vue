<script setup lang="ts">
import type { AccordionRootProps } from "reka-ui";
import { AccordionRoot, useForwardProps } from "reka-ui";

const props = defineProps<AccordionRootProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <AccordionRoot v-slot="slotProps" data-slot="accordion" v-bind="forwardedProps">
    <slot v-bind="slotProps" />
  </AccordionRoot>
</template>
