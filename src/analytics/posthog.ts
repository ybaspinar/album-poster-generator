import posthog from "posthog-js";

type PostHogProperties = Record<string, unknown>;

interface PostHogRuntime {
  appVersion?: string;
  host?: string;
  hostname?: string;
  mode: string;
  projectToken?: string;
}

let postHogEnabled = false;

export function shouldEnablePostHog(
  runtime: Pick<PostHogRuntime, "hostname" | "mode" | "projectToken">,
): boolean {
  return (
    Boolean(runtime.projectToken) &&
    runtime.mode === "production" &&
    !isLocalHostname(runtime.hostname ?? "")
  );
}

export function initPostHog(runtime: PostHogRuntime): boolean {
  postHogEnabled = shouldEnablePostHog(runtime);

  if (!postHogEnabled || !runtime.projectToken) {
    return false;
  }

  posthog.init(runtime.projectToken, {
    api_host: runtime.host || "https://eu.i.posthog.com",
    defaults: "2026-01-30",
    logs: {
      serviceName: "album-poster-generator-web",
      environment: runtime.mode,
      serviceVersion: runtime.appVersion || "dev",
    },
  });

  posthog.logger.info("app initialized", {
    service: "album-poster-generator",
  });

  return true;
}

export function capturePostHogEvent(eventName: string, properties?: PostHogProperties): void {
  if (!postHogEnabled) {
    return;
  }

  posthog.capture(eventName, properties);
}

export function capturePostHogException(error: unknown, properties?: PostHogProperties): void {
  if (!postHogEnabled) {
    return;
  }

  posthog.captureException(error, properties);
}

function isLocalHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();

  if (
    !normalizedHostname ||
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname === "::1" ||
    normalizedHostname === "0.0.0.0" ||
    normalizedHostname.endsWith(".local") ||
    normalizedHostname.startsWith("127.") ||
    normalizedHostname.startsWith("10.") ||
    normalizedHostname.startsWith("192.168.")
  ) {
    return true;
  }

  const private172Match = /^172\.(\d{1,2})\./.exec(normalizedHostname);
  if (!private172Match) {
    return false;
  }

  const secondOctet = Number(private172Match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}
