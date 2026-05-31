<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchGoogleFonts, loadGoogleFont, getFontFamilyString, type GoogleFont } from "../services/google-fonts";

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const searchQuery = ref("");
const fonts = ref<GoogleFont[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const filteredFonts = computed(() => {
  if (!searchQuery.value) return fonts.value.slice(0, 20);
  const query = searchQuery.value.toLowerCase();
  return fonts.value
    .filter((font) => font.family.toLowerCase().includes(query))
    .slice(0, 20);
});

async function loadFonts(): Promise<void> {
  isLoading.value = true;
  error.value = null;
  try {
    fonts.value = await fetchGoogleFonts();
  } catch (e) {
    error.value = "Failed to load fonts";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue && fonts.value.length > 0) {
      const font = fonts.value.find((f) => f.family === newValue);
      if (font) {
        await loadGoogleFont(font.family, ["400", "700"]);
      }
    }
  }
);

defineExpose({ loadFonts });
</script>

<template>
  <div class="grid gap-2">
    <Label for="font-search">Search Google Fonts</Label>
    <Input
      id="font-search"
      v-model="searchQuery"
      placeholder="Search fonts..."
      @focus="loadFonts"
    />

    <Select :model-value="modelValue" @update:model-value="(value) => emit('update:modelValue', value as string)">
      <SelectTrigger class="w-full" :disabled="isLoading">
        <SelectValue placeholder="Select a font" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem
            v-for="font in filteredFonts"
            :key="font.family"
            :value="font.family"
          >
            <span :style="{ fontFamily: getFontFamilyString(font.family) }">
              {{ font.family }}
            </span>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>