import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { describe, expect, it } from "vitest";
import App from "../App.vue";

describe("App layout and brand", () => {
  it("uses the ink-slate brand shell and gives the preview more desktop space", () => {
    setActivePinia(createPinia());
    const wrapper = mount(App);

    expect(wrapper.find('[data-test="app-shell"]').attributes("data-brand")).toBe("ink-slate");
    expect(wrapper.find('[data-test="app-workspace"]').classes().join(" ")).toContain(
      "max-w-[112rem]",
    );
    expect(wrapper.find('[data-test="creator-search-step"]').exists()).toBe(true);
  });
});
