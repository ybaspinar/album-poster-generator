import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createAlbumDraft } from "../domain/album";
import PosterModelPicker from "./PosterModelPicker.vue";

const draft = createAlbumDraft({
  title: "Starboy",
  artist: "The Weeknd",
  artworkUrl: "https://example.com/starboy.jpg",
  tracklist: ["Starboy", "Party Monster"],
});

describe("PosterModelPicker", () => {
  it("renders the creator models as album preview cards", () => {
    const wrapper = mount(PosterModelPicker, {
      props: { draft, selectedModelId: "clean" },
    });

    expect(wrapper.text()).toContain("Choose a poster model");
    expect(wrapper.findAll('[data-test^="poster-model-"]')).toHaveLength(2);

    const cleanCard = wrapper.find('[data-test="poster-model-clean"]');
    expect(cleanCard.find(".poster-art").attributes("src")).toBe("https://example.com/starboy.jpg");

    const atmosphereCard = wrapper.find('[data-test="poster-model-atmosphere"]');
    expect(atmosphereCard.find(".poster-page").classes()).toContain("poster-layout-large");
  });

  it("emits model selection and back navigation", async () => {
    const wrapper = mount(PosterModelPicker, {
      props: { draft, selectedModelId: "clean" },
    });

    await wrapper.find('[data-test="poster-model-atmosphere"]').trigger("click");
    await wrapper.find('[data-test="model-back-button"]').trigger("click");

    expect(wrapper.emitted("selectModel")?.[0]).toEqual(["atmosphere"]);
    expect(wrapper.emitted("back")).toHaveLength(1);
  });
});
