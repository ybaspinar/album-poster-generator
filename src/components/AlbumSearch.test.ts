import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AlbumSearch from "./AlbumSearch.vue";

vi.mock("../sources/musicbrainz", () => ({
  searchMusicBrainzAlbums: vi.fn().mockImplementation(async (params) => {
    const artist = params?.artist?.toLowerCase() ?? "";
    const title = params?.title?.toLowerCase() ?? "";

    if (artist.includes("björk") || title.includes("vespertine")) {
      return [
        {
          title: "Vespertine",
          artist: "Björk",
          releaseDate: "2001-08-27",
          source: "musicbrainz",
          sourceId: "rg-vespertine",
          artworkUrl: "https://example.com/vespertine.jpg",
          artworkSource: "cover-art-archive",
        },
      ];
    }
    if (artist.includes("kanye") || title.includes("kid")) {
      return [
        {
          title: "Kids See Ghosts",
          artist: "Kanye West & Kid Cudi",
          releaseDate: "2018-06-08",
          source: "musicbrainz",
          sourceId: "rg-kids",
          artworkUrl: "https://example.com/kids.jpg",
          artworkSource: "cover-art-archive",
        },
      ];
    }
    return [];
  }),
  paramsDisplayLabel: vi.fn((params) => {
    if (params.artist && params.title) return `${params.artist} - ${params.title}`;
    return params.title || params.artist || "";
  }),
}));

vi.mock("../sources/search-recent", () => ({
  readRecentSearches: vi.fn().mockReturnValue(["vespertine", "kids see ghosts"]),
  addRecentSearch: vi.fn(),
}));

describe("AlbumSearch", () => {
  it("uses shadcn surfaces and emits the selected album result", async () => {
    const wrapper = mount(AlbumSearch);

    expect(wrapper.findComponent(Card).exists()).toBe(true);
    expect(wrapper.findAllComponents(Input).length).toBeGreaterThanOrEqual(3);
    expect(wrapper.findAllComponents(Button).length).toBeGreaterThanOrEqual(1);

    await wrapper.find('[data-test="artist-input"]').setValue("Björk");
    await wrapper.find('[data-test="title-input"]').setValue("Vespertine");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.findAllComponents(Button).length).toBeGreaterThanOrEqual(2);

    await wrapper.find('[data-test="result-0"]').trigger("click");

    expect(wrapper.emitted("select")?.[0]?.[0]).toMatchObject({
      title: "Vespertine",
      artist: "Björk",
      sourceId: "rg-vespertine",
    });
  });

  it("searches by artist only", async () => {
    const wrapper = mount(AlbumSearch);

    await wrapper.find('[data-test="artist-input"]').setValue("Kanye");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.find('[data-test="result-0"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Kids See Ghosts");
  });

  it("searches by title only", async () => {
    const wrapper = mount(AlbumSearch);

    await wrapper.find('[data-test="title-input"]').setValue("Vespertine");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.find('[data-test="result-0"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Vespertine");
  });

  it("shows recent searches on artist input focus when all fields are empty", async () => {
    const wrapper = mount(AlbumSearch);
    const input = wrapper.find('[data-test="artist-input"]');

    await input.trigger("focus");
    await Promise.resolve();

    expect(wrapper.text()).toContain("Recent");
    expect(wrapper.text()).toContain("vespertine");
    expect(wrapper.text()).toContain("kids see ghosts");
  });

  it("selects a recent search on click", async () => {
    const wrapper = mount(AlbumSearch);
    const input = wrapper.find('[data-test="artist-input"]');

    await input.trigger("focus");
    await Promise.resolve();

    const recentButtons = wrapper.findAll("button").filter((b) => b.text() === "vespertine");
    expect(recentButtons.length).toBeGreaterThan(0);

    await recentButtons[0].trigger("mousedown");
    await Promise.resolve();
    await Promise.resolve();

    expect((wrapper.find('[data-test="title-input"]').element as HTMLInputElement).value).toBe(
      "vespertine",
    );
    expect(wrapper.find('[data-test="result-0"]').exists()).toBe(true);
  });

  it("clears all fields when clear button is clicked", async () => {
    const wrapper = mount(AlbumSearch);

    await wrapper.find('[data-test="artist-input"]').setValue("Björk");
    await wrapper.find('[data-test="title-input"]').setValue("Vespertine");
    await wrapper.find('[data-test="year-input"]').setValue("2001");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.find('[data-test="result-0"]').exists()).toBe(true);

    const clearButton = wrapper
      .findAll("button")
      .find((b) => b.text().toLowerCase().includes("clear"));
    expect(clearButton?.exists()).toBe(true);

    await clearButton?.trigger("click");
    await Promise.resolve();

    expect((wrapper.find('[data-test="artist-input"]').element as HTMLInputElement).value).toBe("");
    expect((wrapper.find('[data-test="title-input"]').element as HTMLInputElement).value).toBe("");
    expect((wrapper.find('[data-test="year-input"]').element as HTMLInputElement).value).toBe("");
    expect(wrapper.find('[data-test="result-0"]').exists()).toBe(false);
  });

  it("navigates results with arrow keys and selects with enter", async () => {
    const wrapper = mount(AlbumSearch);

    await wrapper.find('[data-test="artist-input"]').setValue("Kanye");
    await wrapper.find('[data-test="search-form"]').trigger("submit");
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.find('[data-test="result-0"]').exists()).toBe(true);

    await wrapper.find('[data-test="artist-input"]').trigger("keydown", { key: "ArrowDown" });
    await wrapper.find('[data-test="artist-input"]').trigger("keydown", { key: "Enter" });
    await Promise.resolve();

    expect(wrapper.emitted("select")?.[0]?.[0]).toMatchObject({
      title: "Kids See Ghosts",
    });
  });
});
