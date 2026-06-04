import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  capturePostHogEvent,
  capturePostHogException,
  initPostHog,
  shouldEnablePostHog,
} from "./posthog";

const postHogMocks = vi.hoisted(() => ({
  capture: vi.fn(),
  captureException: vi.fn(),
  init: vi.fn(),
  loggerInfo: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: {
    capture: postHogMocks.capture,
    captureException: postHogMocks.captureException,
    init: postHogMocks.init,
    logger: {
      info: postHogMocks.loggerInfo,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  initPostHog({
    appVersion: "dev",
    host: "https://eu.i.posthog.com",
    hostname: "localhost",
    mode: "development",
    projectToken: "",
  });
});

describe("PostHog local suppression", () => {
  it("disables PostHog without a project token", () => {
    expect(
      shouldEnablePostHog({
        hostname: "album.example.com",
        mode: "production",
        projectToken: "",
      }),
    ).toBe(false);
  });

  it("disables PostHog for local development hosts even with a token", () => {
    for (const hostname of [
      "localhost",
      "127.0.0.1",
      "127.12.0.3",
      "::1",
      "0.0.0.0",
      "album.local",
    ]) {
      expect(
        shouldEnablePostHog({
          hostname,
          mode: "production",
          projectToken: "phc_test",
        }),
      ).toBe(false);
    }
  });

  it("allows PostHog for private network IPs when token and mode are production", () => {
    for (const hostname of ["192.168.1.20", "10.0.0.4", "172.20.1.5"]) {
      expect(
        shouldEnablePostHog({
          hostname,
          mode: "production",
          projectToken: "phc_test",
        }),
      ).toBe(true);
    }
  });

  it("does not initialize, log, capture events, or capture exceptions when disabled", () => {
    const enabled = initPostHog({
      appVersion: "dev",
      host: "https://eu.i.posthog.com",
      hostname: "localhost",
      mode: "development",
      projectToken: "phc_test",
    });

    capturePostHogEvent("album_selected", { album_title: "Starboy" });
    capturePostHogException(new Error("local failure"), { preset_id: "square" });

    expect(enabled).toBe(false);
    expect(postHogMocks.init).not.toHaveBeenCalled();
    expect(postHogMocks.loggerInfo).not.toHaveBeenCalled();
    expect(postHogMocks.capture).not.toHaveBeenCalled();
    expect(postHogMocks.captureException).not.toHaveBeenCalled();
  });

  it("initializes and allows events for production non-local hosts", () => {
    const enabled = initPostHog({
      appVersion: "1.2.3",
      host: "https://eu.i.posthog.com",
      hostname: "album.example.com",
      mode: "production",
      projectToken: "phc_live",
    });

    capturePostHogEvent("album_selected", { album_title: "Starboy" });
    capturePostHogException(new Error("prod failure"), { preset_id: "square" });

    expect(enabled).toBe(true);
    expect(postHogMocks.init).toHaveBeenCalledWith("phc_live", {
      api_host: "https://eu.i.posthog.com",
      defaults: "2026-01-30",
      logs: {
        environment: "production",
        serviceName: "album-poster-generator-web",
        serviceVersion: "1.2.3",
      },
    });
    expect(postHogMocks.loggerInfo).toHaveBeenCalledWith("app initialized", {
      service: "album-poster-generator",
    });
    expect(postHogMocks.capture).toHaveBeenCalledWith("album_selected", {
      album_title: "Starboy",
    });
    expect(postHogMocks.captureException).toHaveBeenCalledWith(expect.any(Error), {
      preset_id: "square",
    });
  });
});
