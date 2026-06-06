<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Globe } from "@lucide/vue";
import Select from "@/components/ui/select/Select.vue";
import SelectContent from "@/components/ui/select/SelectContent.vue";
import SelectItem from "@/components/ui/select/SelectItem.vue";
import SelectTrigger from "@/components/ui/select/SelectTrigger.vue";
import SelectValue from "@/components/ui/select/SelectValue.vue";
import { saveLocale } from "@/i18n";

const { locale, t } = useI18n();

function changeLanguage(value: string): void {
  const next = value === "tr" ? "tr" : "en";
  locale.value = next;
  saveLocale(next);
}
</script>

<template>
  <div class="flex items-center gap-2">
    <Globe class="size-4 text-muted-foreground" />
    <Select :model-value="locale" @update:model-value="(value) => { if (typeof value === 'string') changeLanguage(value) }">
      <SelectTrigger
        :aria-label="t('language.label')"
        class="h-8 w-fit border-none bg-transparent px-0 text-sm font-medium text-muted-foreground hover:text-foreground focus:ring-0 focus:ring-offset-0"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{{ t("language.en") }}</SelectItem>
        <SelectItem value="tr">{{ t("language.tr") }}</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
