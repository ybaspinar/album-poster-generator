import { onMounted, shallowRef } from "vue";

const THEME_KEY = "album-poster-generator:theme";
type Theme = "light" | "dark";

const theme = shallowRef<Theme>("light");

export function useTheme() {
  function applyTheme(next: Theme): void {
    theme.value = next;
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem(THEME_KEY, next);
  }

  function toggleTheme(): void {
    applyTheme(theme.value === "dark" ? "light" : "dark");
  }

  onMounted(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored === "dark" || stored === "light") {
      applyTheme(stored);
    }
  });

  return { theme, toggleTheme };
}
