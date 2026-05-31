import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createAlbumDraft } from "../domain/album";
import PosterPreview from "./PosterPreview.vue";

describe("PosterPreview", () => {
  it("renders album poster content and palette swatches", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          title: "Kids See Ghosts",
          artist: "Kanye West & Kid Cudi",
          releaseDate: "2018-06-08",
          metadataLine: "Released: June 8, 2018 · Kanye West & Kid Cudi",
          artworkUrl: "https://example.com/cover.jpg",
          palette: ["#f28c28", "#c02465", "#f4a35d", "#a98cbd", "#21889b", "#17245c"],
        }),
      },
    });

    expect(wrapper.text()).toContain("Kids See Ghosts");
    expect(wrapper.text()).toContain("Kanye West & Kid Cudi");
    expect(wrapper.find("img").attributes("src")).toBe("https://example.com/cover.jpg");
    expect(wrapper.findAll(".poster-swatch")).toHaveLength(6);
  });

  it("places artist name under release in the meta row", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          title: "Kids See Ghosts",
          artist: "Kanye West & Kid Cudi",
          releaseDate: "2018-06-08",
          artworkUrl: "https://example.com/cover.jpg",
        }),
      },
    });

    const metaRow = wrapper.find(".poster-meta-row");
    expect(metaRow.exists()).toBe(true);
    expect(metaRow.find(".poster-release").text()).toContain("2018-06-08");
    expect(metaRow.find(".poster-artist").text()).toBe("Kanye West & Kid Cudi");
  });

  it("loads remote artwork with anonymous CORS for PNG export", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          artworkUrl: "https://example.com/cover.jpg",
        }),
      },
    });

    expect(wrapper.find("img").attributes("crossorigin")).toBe("anonymous");
  });

  it("applies font inline style for predefined fonts", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          font: "inter",
        }),
      },
    });

    expect(wrapper.find("article").classes()).toContain("font-inter");
    expect(wrapper.find("article").attributes("style")).toContain("font-family:");
  });

  it("applies inline style for Google fonts without class", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          // Using a Google Font (not in predefined list)
          font: "Roboto" as any,
        }),
      },
    });

    expect(wrapper.find("article").classes()).not.toContain("font-Roboto");
    const style = wrapper.find("article").attributes("style");
    expect(style).toContain("font-family:");
    expect(style).toContain("Roboto");
  });
});
