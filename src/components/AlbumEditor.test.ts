import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createAlbumDraft } from "../domain/album";
import AlbumEditor from "./AlbumEditor.vue";

describe("AlbumEditor", () => {
  it("uses shadcn inputs and emits field and palette patches", async () => {
    const wrapper = mount(AlbumEditor, {
      props: {
        draft: createAlbumDraft({
          title: "Original Title",
          palette: ["#111111", "#222222", "#333333", "#444444", "#555555", "#666666"],
        }),
      },
    });

    expect(wrapper.findComponent(Card).exists()).toBe(true);
    expect(wrapper.findAllComponents(Input).length).toBeGreaterThanOrEqual(7);

    await wrapper.find('[data-test="title-input"]').setValue("Updated Title");
    expect(wrapper.emitted("patch")?.[0]).toEqual([{ title: "Updated Title" }]);

    const tracklistTextarea = wrapper.find('[data-test="tracklist-input"]');
    expect(tracklistTextarea.exists()).toBe(true);
    expect((tracklistTextarea.element as HTMLTextAreaElement).value).toBe("");

    const showTracklistCheckbox = wrapper.find('[data-test="show-tracklist-input"]');
    expect(showTracklistCheckbox.exists()).toBe(true);
    expect((showTracklistCheckbox.element as HTMLInputElement).checked).toBe(true);
    expect(wrapper.find("button#poster-tracklist-columns").exists()).toBe(true);
    expect(wrapper.find("button#poster-tracklist-size").exists()).toBe(true);

    await showTracklistCheckbox.setValue(false);
    expect(wrapper.emitted("patch")?.[1]).toEqual([{ showTracklist: false }]);

    await tracklistTextarea.setValue("Foo\n\n  Xox  \nLast Song");
    expect(wrapper.emitted("patch")?.[2]).toEqual([{ tracklist: ["Foo", "Xox", "Last Song"] }]);

    await wrapper.find('[data-test="palette-input-0"]').setValue("#abcdef");
    expect(wrapper.emitted("patch")?.[3]).toEqual([
      { palette: ["#abcdef", "#222222", "#333333", "#444444", "#555555", "#666666"] },
    ]);

    const showSwatchesCheckbox = wrapper.find('[data-test="show-swatches-input"]');
    expect(showSwatchesCheckbox.exists()).toBe(true);
    expect((showSwatchesCheckbox.element as HTMLInputElement).checked).toBe(true);

    await showSwatchesCheckbox.setValue(false);
    expect(wrapper.emitted("patch")?.[4]).toEqual([{ showSwatches: false }]);

    expect(wrapper.find("button#poster-swatch-shape").exists()).toBe(true);

    // Verify font select and Google font selector components exist
    expect(wrapper.find("button#poster-font").exists()).toBe(true);
    expect(wrapper.vm.draft.font).toBe("gotham");
  });

  it("lets users adjust the background blur level", async () => {
    const wrapper = mount(AlbumEditor, {
      props: {
        draft: createAlbumDraft({ backgroundBlurAmount: 6 }),
      },
    });
    const blurInput = wrapper.find('[data-test="background-blur-amount-input"]');

    expect(blurInput.exists()).toBe(true);
    expect((blurInput.element as HTMLInputElement).value).toBe("6");

    await blurInput.setValue("3");

    expect(wrapper.emitted("patch")?.[0]).toEqual([{ backgroundBlurAmount: 3 }]);
  });

  it("lets users customize title typography", async () => {
    const wrapper = mount(AlbumEditor, {
      props: {
        draft: createAlbumDraft(),
      },
    });

    await wrapper.find('[data-test="typography-title-color-input"]').setValue("#ff0000");
    expect(wrapper.emitted("patch")?.[0]).toEqual([
      {
        typography: expect.objectContaining({
          title: expect.objectContaining({ color: "#ff0000" }),
        }),
      },
    ]);

    await wrapper.find('[data-test="typography-title-size-input"]').setValue("64");
    expect(wrapper.emitted("patch")?.[1]).toEqual([
      {
        typography: expect.objectContaining({
          title: expect.objectContaining({ size: 64 }),
        }),
      },
    ]);
  });
});
