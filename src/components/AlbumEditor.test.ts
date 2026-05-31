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

    await wrapper.find('[data-test="palette-input-0"]').setValue("#abcdef");
    expect(wrapper.emitted("patch")?.[1]).toEqual([
      { palette: ["#abcdef", "#222222", "#333333", "#444444", "#555555", "#666666"] },
    ]);

    // Verify font select and Google font selector components exist
    expect(wrapper.find("button#poster-font").exists()).toBe(true);
    expect(wrapper.vm.draft.font).toBe("gotham");
  });
});
