/// <reference types="node" />

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("brand tokens", () => {
  it("maps shadcn theme variables to Yusuf's ink-slate palette", () => {
    const css = readFileSync("src/styles/globals.css", "utf8");

    expect(css).toContain("--brand-bg: #0f1419");
    expect(css).toContain("--brand-panel: #151b22");
    expect(css).toContain("--brand-accent: #8fb4d8");
    expect(css).toContain("radial-gradient(circle at 20% 0%, rgb(143 180 216 / 10%)");
  });
});
