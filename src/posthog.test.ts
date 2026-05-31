import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PostHog production debugging", () => {
  it("publishes production source maps for readable PostHog stack traces", () => {
    const viteConfig = readFileSync("vite.config.ts", "utf8");

    expect(viteConfig).toContain("build:");
    expect(viteConfig).toContain("sourcemap: true");
  });
});
