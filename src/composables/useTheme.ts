import { onMounted, ref } from "vue";

const THEME_KEY = "album-poster-generator:theme";
type Theme = "light" | "dark";

const theme = ref<Theme>("light");

export function useTheme() {
  function applyTheme(next: Theme): void {
    theme.value = next;
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage unavailable
    }
  }

  function toggleTheme(): void {
    applyTheme(theme.value === "dark" ? "light" : "dark");
  }

  function init(): void {
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored === "dark" || stored === "light") {
        applyTheme(stored);
      }
    } catch {
      // storage unavailable
    }
  }

  onMounted(init);

  return { theme, toggleTheme };
}

/** Reset module-level singleton for tests. */
export function resetTheme(): void {
  theme.value = "light";
}
