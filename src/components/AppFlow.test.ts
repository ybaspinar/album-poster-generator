import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App.vue";
import { createExportableArtworkUrl } from "../media/artwork-url";
import { findCoverArt } from "../sources/cover-art";
import {
  fetchMusicBrainzEditions,
  fetchMusicBrainzTracklist,
  fetchMusicBrainzTracklistForRelease,
} from "../sources/musicbrainz";

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
  fetchMusicBrainzEditions: vi.fn().mockResolvedValue([]),
  fetchMusicBrainzTracklist: vi.fn().mockResolvedValue(["Feel the Love", "Fire"]),
  fetchMusicBrainzTracklistForRelease: vi.fn().mockResolvedValue(["Deluxe Song"]),
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

const mockedFetchMusicBrainzEditions = vi.mocked(fetchMusicBrainzEditions);
const mockedFetchMusicBrainzTracklistForRelease = vi.mocked(fetchMusicBrainzTracklistForRelease);

beforeEach(() => {
  setActivePinia(createPinia());
  mockedFetchMusicBrainzEditions.mockReset();
  mockedFetchMusicBrainzEditions.mockResolvedValue([]);
  mockedFetchMusicBrainzTracklistForRelease.mockReset();
  mockedFetchMusicBrainzTracklistForRelease.mockResolvedValue(["Deluxe Song"]);
});

describe("App flow", () => {
  it("searches, selects an album, chooses a model, edits details, and exports from the guided flow", async () => {
    const wrapper = mount(App);

    expect(wrapper.find('[data-test="creator-search-step"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="creator-models-step"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="creator-editor-step"]').exists()).toBe(false);
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
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.find('[data-test="creator-models-step"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Choose a poster model");
    expect(
      wrapper.find('[data-test="creator-models-step"] [data-test="preview-stage"]').exists(),
    ).toBe(false);
    expect(wrapper.findAll('[data-test="creator-models-step"] [data-export-poster]')).toHaveLength(
      4,
    );
    expect(
      wrapper.find('[data-test="poster-model-standard"]').find(".poster-art").attributes("src"),
    ).toBe("blob:search-front-exportable");
    expect(fetchMusicBrainzTracklist).toHaveBeenCalledWith("rg-1");
    expect(createExportableArtworkUrl).toHaveBeenCalledWith("https://example.com/search-front.jpg");
    expect(findCoverArt).not.toHaveBeenCalled();

    await wrapper.find('[data-test="poster-model-standard"]').trigger("click");
    await Promise.resolve();

    expect(wrapper.find('[data-test="creator-editor-step"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="preview-stage"]').exists()).toBe(true);
    expect(wrapper.findComponent(Alert).exists()).toBe(true);
    expect(wrapper.find('[data-test="tracklist-input"]').element).toHaveProperty(
      "value",
      "Feel the Love\nFire",
    );
    expect(wrapper.text()).toContain("1) Feel the Love");
    expect(wrapper.find(".poster-art").attributes("src")).toBe("blob:search-front-exportable");
    expect(
      wrapper
        .findAll<HTMLInputElement>('[data-test^="palette-input-"]')
        .map((input) => input.element.value),
    ).toEqual(["#112233", "#445566", "#778899", "#aabbcc", "#ddeeff", "#010203"]);

    const editorTitleInput = wrapper.find(
      '[data-test="creator-editor-step"] [data-test="title-input"]',
    );
    expect(editorTitleInput.exists()).toBe(true);
    await editorTitleInput.setValue("My Custom Poster Title");

    expect(wrapper.text()).toContain("My Custom Poster Title");
  });

  it("lets users start manually and choose a model without search", async () => {
    const wrapper = mount(App);

    await wrapper.find('[data-test="manual-start-button"]').trigger("click");
    expect(wrapper.find('[data-test="creator-models-step"]').exists()).toBe(true);

    await wrapper.find('[data-test="poster-model-basic"]').trigger("click");
    expect(wrapper.find('[data-test="creator-editor-step"]').exists()).toBe(true);
  });

  it("opens a shadcn edition picker when an album has multiple editions", async () => {
    mockedFetchMusicBrainzEditions.mockResolvedValueOnce([
      {
        id: "release-standard",
        title: "Red",
        releaseDate: "2012-10-22",
        country: "US",
        formats: ["CD"],
        trackCount: 16,
        artworkUrl: "https://example.com/standard-cover.jpg",
      },
      {
        id: "release-deluxe",
        title: "Red (Deluxe Edition)",
        releaseDate: "2012-10-22",
        country: "US",
        formats: ["CD", "Digital Media"],
        trackCount: 22,
        artworkUrl: "https://example.com/deluxe-cover.jpg",
      },
    ]);
    mockedFetchMusicBrainzTracklistForRelease.mockResolvedValueOnce([
      "State of Grace",
      "The Moment I Knew",
    ]);
    const wrapper = mount(App);

    await wrapper.find('[data-test="artist-input"]').setValue("taylor swift");
    await wrapper.find('[data-test="title-input"]').setValue("red");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    await wrapper.find('[data-test="result-0"]').trigger("click");
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.find('[data-test="edition-dialog"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Choose edition");
    expect(wrapper.text()).toContain("Red (Deluxe Edition)");
    expect(wrapper.find('[data-test="edition-release-deluxe"]').find("img").attributes("src")).toBe(
      "https://example.com/deluxe-cover.jpg",
    );

    await wrapper.find('[data-test="edition-release-deluxe"]').trigger("click");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockedFetchMusicBrainzTracklistForRelease).toHaveBeenCalledWith("release-deluxe");
    expect(wrapper.find('[data-test="edition-dialog"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="creator-models-step"]').exists()).toBe(true);

    await wrapper.find('[data-test="poster-model-standard"]').trigger("click");
    await Promise.resolve();

    expect(wrapper.find('[data-test="tracklist-input"]').element).toHaveProperty(
      "value",
      "State of Grace\nThe Moment I Knew",
    );
    expect(createExportableArtworkUrl).toHaveBeenCalledWith("https://example.com/deluxe-cover.jpg");
  });

  it("persists the tracklist visibility preference between drafts", async () => {
    const wrapper = mount(App);

    await wrapper.find('[data-test="manual-start-button"]').trigger("click");
    await wrapper.find('[data-test="poster-model-standard"]').trigger("click");

    const showTracklistCheckbox = wrapper.find('[data-test="show-tracklist-input"]');
    expect((showTracklistCheckbox.element as HTMLInputElement).checked).toBe(true);

    await showTracklistCheckbox.setValue(false);
    expect(window.localStorage.getItem("album-poster-generator:show-tracklist")).toBe("false");

    await wrapper.find('[data-test="editor-back-button"]').trigger("click");
    await wrapper.find('[data-test="poster-model-basic"]').trigger("click");

    expect(
      (wrapper.find('[data-test="show-tracklist-input"]').element as HTMLInputElement).checked,
    ).toBe(false);
  });
});
