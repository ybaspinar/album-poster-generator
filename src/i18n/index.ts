import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import tr from "./locales/tr.json";

const STORAGE_KEY = "album-poster-generator:language";

function readSavedLocale(): "en" | "tr" {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "tr") return "tr";
  } catch {
    // storage unavailable
  }
  return "en";
}

export const i18n = createI18n({
  legacy: false,
  locale: readSavedLocale(),
  fallbackLocale: "en",
  messages: { en, tr },
});

export function saveLocale(locale: "en" | "tr"): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // storage unavailable
  }
}
