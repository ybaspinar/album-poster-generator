import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AlbumSearch from "./AlbumSearch.vue";

vi.mock("../sources/musicbrainz", () => ({
  searchMusicBrainzAlbums: vi.fn().mockResolvedValue([
    {
      title: "Vespertine",
      artist: "Björk",
      releaseDate: "2001-08-27",
      source: "musicbrainz",
      sourceId: "rg-vespertine",
      artworkUrl: "https://example.com/vespertine.jpg",
      artworkSource: "cover-art-archive",
    },
  ]),
}));

describe("AlbumSearch", () => {
  it("uses shadcn surfaces and emits the selected album result", async () => {
    const wrapper = mount(AlbumSearch);

    expect(wrapper.findComponent(Card).exists()).toBe(true);
    expect(wrapper.findComponent(Input).exists()).toBe(true);
    expect(wrapper.findAllComponents(Button).length).toBeGreaterThanOrEqual(1);

    await wrapper.find('[data-test="search-input"]').setValue("vespertine");
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
});
