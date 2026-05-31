import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PostHog production debugging", () => {
  it("publishes production source maps for readable PostHog stack traces", () => {
    const viteConfig = readFileSync("vite.config.ts", "utf8");

    expect(viteConfig).toContain("build:");
    expect(viteConfig).toContain("sourcemap: true");
  });

  it("configures explicit structured logs without console autocapture", () => {
    const main = readFileSync("src/main.ts", "utf8");

    expect(main).toContain("logs:");
    expect(main).toContain('serviceName: "album-poster-generator-web"');
    expect(main).toContain("environment: import.meta.env.MODE");
    expect(main).toContain("serviceVersion: import.meta.env.VITE_APP_VERSION || \"dev\"");
    expect(main).toContain('posthog.logger.info("app initialized"');
    expect(main).not.toContain("captureConsoleLogs: true");
  });
});
