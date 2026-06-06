<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "@/components/ui/button/Button.vue";
import Card from "@/components/ui/card/Card.vue";
import CardContent from "@/components/ui/card/CardContent.vue";
import CardHeader from "@/components/ui/card/CardHeader.vue";
import CardTitle from "@/components/ui/card/CardTitle.vue";
import { Label } from "@/components/ui/label";
import Select from "@/components/ui/select/Select.vue";
import SelectContent from "@/components/ui/select/SelectContent.vue";
import SelectGroup from "@/components/ui/select/SelectGroup.vue";
import SelectItem from "@/components/ui/select/SelectItem.vue";
import SelectTrigger from "@/components/ui/select/SelectTrigger.vue";
import SelectValue from "@/components/ui/select/SelectValue.vue";
import { exportPresets, type ExportPresetId } from "../export/presets";

const { t } = useI18n();

defineProps<{
  selectedPresetId: ExportPresetId;
  exporting: boolean;
}>();

const emit = defineEmits<{
  selectPreset: [presetId: ExportPresetId];
  exportPoster: [];
}>();

function selectPreset(value: string): void {
  emit("selectPreset", value as ExportPresetId);
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t("export.title") }}</CardTitle>
    </CardHeader>
    <CardContent class="grid gap-4">
      <div class="grid gap-2">
        <Label for="print-preset">{{ t("export.printPreset") }}</Label>
        <Select :model-value="selectedPresetId" @update:model-value="(value) => { if (typeof value === 'string') selectPreset(value) }">
          <SelectTrigger id="print-preset" class="w-full">
            <SelectValue :placeholder="t('export.selectPreset')" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="preset in exportPresets" :key="preset.id" :value="preset.id">
                {{
                  t("export.presetLabel", {
                    label: t("presets." + preset.id),
                    width: preset.widthPx,
                    height: preset.heightPx,
                  })
                }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Button
        data-test="export-button"
        type="button"
        class="w-full"
        :disabled="exporting"
        @click="emit('exportPoster')"
      >
        {{ exporting ? t("export.exporting") : t("export.exportPng") }}
      </Button>
    </CardContent>
  </Card>
</template>
