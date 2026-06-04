import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PostHog production debugging", () => {
  it("publishes production source maps for readable PostHog stack traces", () => {
    const viteConfig = readFileSync("vite.config.ts", "utf8");

    expect(viteConfig).toContain("build:");
    expect(viteConfig).toContain("sourcemap: true");
  });

  it("configures explicit structured logs without console autocapture", () => {
    const analytics = readFileSync("src/analytics/posthog.ts", "utf8");
    const main = readFileSync("src/main.ts", "utf8");

    expect(analytics).toContain("logs:");
    expect(analytics).toContain('serviceName: "album-poster-generator-web"');
    expect(analytics).toContain("environment: runtime.mode");
    expect(analytics).toContain('serviceVersion: runtime.appVersion || "dev"');
    expect(analytics).toContain('posthog.logger.info("app initialized"');
    expect(analytics).not.toContain("captureConsoleLogs: true");
    expect(main).toContain("hostname: window.location.hostname");
    expect(main).toContain("initPostHog({");
  });
});
