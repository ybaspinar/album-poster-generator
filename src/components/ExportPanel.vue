<script setup lang="ts">
import { exportPresets, type ExportPresetId } from "../export/presets";

defineProps<{
  selectedPresetId: ExportPresetId;
  exporting: boolean;
}>();

const emit = defineEmits<{
  selectPreset: [presetId: ExportPresetId];
  exportPoster: [];
}>();
</script>

<template>
  <section class="control-card">
    <h2>Export</h2>
    <label>
      Print preset
      <select
        :value="selectedPresetId"
        @change="emit('selectPreset', ($event.target as HTMLSelectElement).value as ExportPresetId)"
      >
        <option v-for="preset in exportPresets" :key="preset.id" :value="preset.id">
          {{ preset.label }} · {{ preset.widthPx }}×{{ preset.heightPx }} px
        </option>
      </select>
    </label>
    <button
      data-test="export-button"
      type="button"
      :disabled="exporting"
      @click="emit('exportPoster')"
    >
      {{ exporting ? "Exporting…" : "Export PNG" }}
    </button>
  </section>
</template>
