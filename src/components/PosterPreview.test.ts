import { readFileSync } from "node:fs";
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
    expect(wrapper.find(".poster-swatches").classes()).toContain("poster-swatches-square");
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

  it("renders a numbered tracklist below the metadata row", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          artist: "Test Artist",
          tracklist: ["Foo", "Xox", "Last Song"],
        }),
      },
    });

    const metaRow = wrapper.find(".poster-meta-row");
    const tracklist = wrapper.find(".poster-tracklist");
    expect(tracklist.exists()).toBe(true);
    expect(tracklist.classes()).toContain("poster-tracklist-columns-3");
    expect(tracklist.classes()).toContain("poster-tracklist-size-medium");
    expect(metaRow.find(".poster-tracklist").exists()).toBe(false);
    expect(metaRow.element.nextElementSibling).toBe(tracklist.element);
    expect(tracklist.text()).toContain("1) Foo");
    expect(tracklist.text()).toContain("2) Xox");
    expect(tracklist.text()).toContain("3) Last Song");
  });

  it("does not render a tracklist block when there are no tracks", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          artist: "Test Artist",
          tracklist: [],
        }),
      },
    });

    expect(wrapper.find(".poster-tracklist").exists()).toBe(false);
  });

  it("does not render a tracklist block when tracklist visibility is disabled", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          artist: "Test Artist",
          tracklist: ["Foo", "Xox"],
          showTracklist: false,
        }),
      },
    });

    expect(wrapper.find(".poster-tracklist").exists()).toBe(false);
  });

  it("allows long track names to use available space instead of truncating", () => {
    const css = readFileSync("src/styles/globals.css", "utf8");
    const trackTitleRule = css.match(/\.poster-tracklist span:last-child \{(?<body>[^}]+)\}/)
      ?.groups?.body;

    expect(trackTitleRule).toBeDefined();
    expect(trackTitleRule).not.toContain("text-overflow: ellipsis");
    expect(trackTitleRule).not.toContain("white-space: nowrap");
  });

  it("supports configurable tracklist columns and text size", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          tracklist: ["Long Song Name"],
          tracklistColumns: "2",
          tracklistSize: "small",
        }),
      },
    });
    const css = readFileSync("src/styles/globals.css", "utf8");
    const twoColumnRule = css.match(/\.poster-tracklist-columns-2 \{(?<body>[^}]+)\}/)?.groups
      ?.body;
    const smallRule = css.match(/\.poster-tracklist-size-small \{(?<body>[^}]+)\}/)?.groups?.body;

    expect(wrapper.find(".poster-tracklist").classes()).toContain("poster-tracklist-columns-2");
    expect(wrapper.find(".poster-tracklist").classes()).toContain("poster-tracklist-size-small");
    expect(twoColumnRule).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(smallRule).toContain("font-size: clamp(0.5rem, 0.95cqw, 0.66rem)");
  });

  it("hides swatches and supports circular swatches", () => {
    const hiddenWrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({ showSwatches: false }),
      },
    });
    const circleWrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({ swatchShape: "circle" }),
      },
    });

    expect(hiddenWrapper.find(".poster-swatches").exists()).toBe(false);
    expect(circleWrapper.find(".poster-swatches").classes()).toContain("poster-swatches-circle");
  });

  it("balances metadata and palette swatches in the poster caption row", () => {
    const css = readFileSync("src/styles/globals.css", "utf8");
    const metaRowRule = css.match(/\.poster-meta-row \{(?<body>[^}]+)\}/)?.groups?.body;
    const metaLeftRule = css.match(/\.poster-meta-left \{(?<body>[^}]+)\}/)?.groups?.body;
    const releaseRule = css.match(/\.poster-release \{(?<body>[^}]+)\}/)?.groups?.body;
    const artistRule = css.match(/\.poster-artist \{(?<body>[^}]+)\}/)?.groups?.body;
    const swatchesRule = css.match(/\.poster-swatches \{(?<body>[^}]+)\}/)?.groups?.body;
    const swatchRule = css.match(/\.poster-swatch \{(?<body>[^}]+)\}/)?.groups?.body;

    expect(metaRowRule).toContain("grid-template-columns: minmax(0, 1fr) auto");
    expect(metaLeftRule).toContain("max-width: 48cqw");
    expect(releaseRule).toContain("0.82rem");
    expect(artistRule).toContain("1rem");
    expect(artistRule).toContain("letter-spacing: 0.15em");
    expect(swatchesRule).toContain("gap: clamp(8px, 1.2cqw, 12px)");
    expect(swatchesRule).toContain("min-height: 2.4em");
    expect(swatchRule).toContain("width: clamp(18px, 3cqw, 34px)");
  });

  it("keeps artwork mode close to the standard poster layout without frame effects", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          backgroundMode: "artwork",
          artworkUrl: "https://example.com/cover.jpg",
          tracklist: ["Stargazing", "Carousel"],
        }),
      },
    });
    const css = readFileSync("src/styles/globals.css", "utf8");
    const artworkFrameRule = css.match(
      /\.poster-page\.poster-bg-artwork \.poster-art-frame \{(?<body>[^}]+)\}/,
    )?.groups?.body;
    const artworkPageRule = css.match(/\.poster-page\.poster-bg-artwork \{(?<body>[^}]+)\}/)?.groups
      ?.body;
    const captionRule = css.match(
      /\.poster-page\.poster-bg-artwork \.poster-caption \{(?<body>[^}]+)\}/,
    )?.groups?.body;

    expect(wrapper.find(".poster-art-frame").exists()).toBe(true);
    expect(wrapper.find(".poster-page").classes()).toContain("poster-bg-artwork");
    expect(artworkFrameRule).toBeDefined();
    expect(artworkFrameRule).not.toContain("display: none");
    expect(artworkPageRule).not.toContain("border:");
    expect(artworkPageRule).not.toContain("box-shadow:");
    expect(captionRule ?? "").not.toContain("grid-template-areas");
    expect(captionRule ?? "").not.toContain("text-align: right");
    expect(captionRule).toContain("z-index: 2");
    expect(wrapper.find(".poster-page").attributes("style")).toContain("--poster-bg-blur: 10px");
  });

  it("applies typography customizations to poster sections", () => {
    const wrapper = mount(PosterPreview, {
      props: {
        draft: createAlbumDraft({
          title: "Donda",
          artist: "Kanye West",
          releaseDate: "2021",
          tracklist: ["Jail"],
          typography: {
            title: { color: "#ff0000", size: 140, weight: 900, italic: true, uppercase: false },
            artist: { color: "#00ff00", size: 80, weight: 700, italic: false, uppercase: false },
            metadata: { color: "#0000ff", size: 90, weight: 500, italic: true, uppercase: true },
            tracklist: { color: "#123456", size: 120, weight: 800, italic: true, uppercase: false },
          },
        }),
      },
    });
    const style = wrapper.find(".poster-page").attributes("style");

    expect(style).toContain("--poster-title-color: #ff0000");
    expect(style).toContain("--poster-title-size: 140%");
    expect(style).toContain("--poster-title-weight: 900");
    expect(style).toContain("--poster-title-style: italic");
    expect(style).toContain("--poster-title-transform: none");
    expect(style).toContain("--poster-artist-color: #00ff00");
    expect(style).toContain("--poster-tracklist-color: #123456");
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
          // Using a Google Font (not a built-in font)
          font: "Roboto",
        }),
      },
    });

    expect(wrapper.find("article").classes()).not.toContain("font-Roboto");
    const style = wrapper.find("article").attributes("style");
    expect(style).toContain("font-family:");
    expect(style).toContain("Roboto");
  });
});
