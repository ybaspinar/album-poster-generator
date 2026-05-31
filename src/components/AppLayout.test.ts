import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import App from "../App.vue";

describe("App layout and brand", () => {
  it("uses the ink-slate brand shell and gives the preview more desktop space", () => {
    const wrapper = mount(App);

    expect(wrapper.find('[data-test="app-shell"]').attributes("data-brand")).toBe("ink-slate");
    expect(wrapper.find('[data-test="app-workspace"]').classes().join(" ")).toContain(
      "2xl:grid-cols-[460px_minmax(0,1fr)]",
    );
    expect(wrapper.find('[data-test="preview-stage"]').classes().join(" ")).toContain(
      "min-h-[calc(100vh-6rem)]",
    );
  });
});
