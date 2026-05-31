import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import ExportPanel from "./ExportPanel.vue";

describe("ExportPanel", () => {
  it("uses shadcn controls and emits preset/export actions", async () => {
    const wrapper = mount(ExportPanel, {
      props: {
        selectedPresetId: "a4-portrait",
        exporting: false,
      },
      global: {
        stubs: {
          SelectContent: true,
          SelectGroup: true,
          SelectItem: true,
          SelectTrigger: true,
          SelectValue: true,
        },
      },
    });

    const select = wrapper.findComponent(Select);
    expect(select.exists()).toBe(true);

    select.vm.$emit("update:modelValue", "a3-portrait");
    expect(wrapper.emitted("selectPreset")?.[0]).toEqual(["a3-portrait"]);

    const buttons = wrapper.findAllComponents(Button);
    expect(buttons).toHaveLength(1);

    await buttons[0].trigger("click");
    expect(wrapper.emitted("exportPoster")).toHaveLength(1);
  });
});
