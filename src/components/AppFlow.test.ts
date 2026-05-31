import { mount } from "@vue/test-utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { describe, expect, it, vi } from "vitest";
import App from "../App.vue";
import { createExportableArtworkUrl } from "../media/artwork-url";
import { findCoverArt } from "../sources/cover-art";
import { fetchMusicBrainzTracklist } from "../sources/musicbrainz";

vi.mock("../media/palette", () => ({
  extractPaletteFromImage: vi
    .fn()
    .mockResolvedValue(["#112233", "#445566", "#778899", "#aabbcc", "#ddeeff", "#010203"]),
}));

vi.mock("../media/artwork-url", () => ({
  createExportableArtworkUrl: vi.fn().mockResolvedValue({
    ok: true,
    artworkUrl: "blob:search-front-exportable",
  }),
}));

vi.mock("../sources/musicbrainz", () => ({
  fetchMusicBrainzTracklist: vi.fn().mockResolvedValue(["Feel the Love", "Fire"]),
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
  paramsDisplayLabel: vi.fn((params) => {
    if (params.artist && params.title) return `${params.artist} - ${params.title}`;
    return params.title || params.artist || "";
  }),
}));

vi.mock("../sources/cover-art", () => ({
  findCoverArt: vi.fn().mockResolvedValue({
    artworkUrl: "https://example.com/fallback-front.jpg",
    artworkSource: "cover-art-archive",
  }),
}));

describe("App flow", () => {
  it("searches, selects a result, uses search artwork, updates swatches, and allows manual title override", async () => {
    const wrapper = mount(App);

    expect(wrapper.findAllComponents(Card).length).toBeGreaterThanOrEqual(4);
    expect(wrapper.findComponent(Alert).exists()).toBe(false);
    expect(wrapper.findAllComponents(Button).length).toBeGreaterThanOrEqual(2);

    await wrapper.find('[data-test="artist-input"]').setValue("kanye");
    await wrapper.find('[data-test="title-input"]').setValue("kids see ghosts");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    await wrapper.find('[data-test="result-0"]').trigger("click");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.findComponent(Alert).exists()).toBe(true);
    expect(wrapper.text()).toContain("Kids See Ghosts");
    expect(fetchMusicBrainzTracklist).toHaveBeenCalledWith("rg-1");
    expect(wrapper.find('[data-test="tracklist-input"]').element).toHaveProperty(
      "value",
      "Feel the Love\nFire",
    );
    expect(wrapper.text()).toContain("1) Feel the Love");
    expect(createExportableArtworkUrl).toHaveBeenCalledWith("https://example.com/search-front.jpg");
    expect(wrapper.find(".poster-art").attributes("src")).toBe("blob:search-front-exportable");
    expect(findCoverArt).not.toHaveBeenCalled();
    expect(
      wrapper.findAll<HTMLInputElement>('input[type="color"]').map((input) => input.element.value),
    ).toEqual(["#112233", "#445566", "#778899", "#aabbcc", "#ddeeff", "#010203"]);

    // The editor title input is the second [data-test="title-input"] after the search title.
    const editorTitleInput = wrapper.findAll('[data-test="title-input"]')[1];
    expect(editorTitleInput.exists()).toBe(true);
    await editorTitleInput.setValue("My Custom Poster Title");

    expect(wrapper.text()).toContain("My Custom Poster Title");
  });

  it("persists the tracklist visibility preference between drafts", async () => {
    const wrapper = mount(App);

    const showTracklistCheckbox = wrapper.find('[data-test="show-tracklist-input"]');
    expect((showTracklistCheckbox.element as HTMLInputElement).checked).toBe(true);

    await showTracklistCheckbox.setValue(false);
    expect(window.localStorage.getItem("album-poster-generator:show-tracklist")).toBe("false");

    await wrapper.findComponent(Button).trigger("click");
    expect(
      (wrapper.find('[data-test="show-tracklist-input"]').element as HTMLInputElement).checked,
    ).toBe(false);
  });
});
