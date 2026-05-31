import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import App from "../App.vue";
import { findCoverArt } from "../sources/cover-art";

vi.mock("../sources/musicbrainz", () => ({
  searchMusicBrainzAlbums: vi.fn().mockResolvedValue([
    {
      title: "Kids See Ghosts",
      artist: "Kanye West & Kid Cudi",
      releaseDate: "2018-06-08",
      source: "musicbrainz",
      sourceId: "rg-1",
      artworkUrl: "https://example.com/search-front.jpg",
      artworkSource: "cover-art-archive",
    },
  ]),
}));

vi.mock("../sources/cover-art", () => ({
  findCoverArt: vi.fn().mockResolvedValue({
    artworkUrl: "https://example.com/fallback-front.jpg",
    artworkSource: "cover-art-archive",
  }),
}));

describe("App flow", () => {
  it("searches, selects a result, uses search artwork, and allows manual title override", async () => {
    const wrapper = mount(App);

    await wrapper.find('[data-test="search-input"]').setValue("kids see ghosts");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    await wrapper.find('[data-test="result-0"]').trigger("click");
    await Promise.resolve();

    expect(wrapper.text()).toContain("Kids See Ghosts");
    expect(wrapper.find(".poster-art").attributes("src")).toBe(
      "https://example.com/search-front.jpg",
    );
    expect(findCoverArt).not.toHaveBeenCalled();

    await wrapper.find('[data-test="title-input"]').setValue("My Custom Poster Title");

    expect(wrapper.text()).toContain("My Custom Poster Title");
  });
});
