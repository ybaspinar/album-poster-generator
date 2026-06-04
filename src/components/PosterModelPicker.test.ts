import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PosterModelPicker from "./PosterModelPicker.vue";

describe("PosterModelPicker", () => {
  it("renders the creator models as visual cards", () => {
    const wrapper = mount(PosterModelPicker, {
      props: { selectedModelId: "standard" },
    });

    expect(wrapper.text()).toContain("Choose a poster model");
    expect(wrapper.findAll('[data-test^="poster-model-"]')).toHaveLength(4);
    expect(wrapper.find('[data-test="poster-model-standard"]').text()).toContain("Standard");
    expect(wrapper.find('[data-test="poster-model-full-cover"]').text()).toContain("Full Cover");
  });

  it("emits model selection and back navigation", async () => {
    const wrapper = mount(PosterModelPicker, {
      props: { selectedModelId: "standard" },
    });

    await wrapper.find('[data-test="poster-model-basic"]').trigger("click");
    await wrapper.find('[data-test="model-back-button"]').trigger("click");

    expect(wrapper.emitted("selectModel")?.[0]).toEqual(["basic"]);
    expect(wrapper.emitted("back")).toHaveLength(1);
  });
});
