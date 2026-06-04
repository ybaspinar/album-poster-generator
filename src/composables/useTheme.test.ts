import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { resetTheme, useTheme } from "./useTheme";

const TestComponent = defineComponent({
  setup() {
    const { theme, toggleTheme } = useTheme();
    return { theme, toggleTheme };
  },
  template: `<button data-test="toggle" @click="toggleTheme">{{ theme }}</button>`,
});

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  resetTheme();
});

describe("useTheme", () => {
  it("defaults to light mode", () => {
    const wrapper = mount(TestComponent);
    expect(wrapper.text()).toBe("light");
  });

  it("restores dark preference from localStorage on mount", async () => {
    localStorage.setItem("album-poster-generator:theme", "dark");
    const wrapper = mount(TestComponent);
    await nextTick();
    expect(wrapper.text()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles theme on click", async () => {
    const wrapper = mount(TestComponent);
    await nextTick();

    await wrapper.find('[data-test="toggle"]').trigger("click");
    await nextTick();

    expect(wrapper.text()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
