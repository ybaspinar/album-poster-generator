interface CreateExportableArtworkUrlOptions {
  fetcher?: typeof fetch;
}

interface ExportableArtworkUrlSuccess {
  ok: true;
  artworkUrl: string;
}

interface ExportableArtworkUrlFailure {
  ok: false;
  artworkUrl: string;
  message: string;
}

export type ExportableArtworkUrlResult = ExportableArtworkUrlSuccess | ExportableArtworkUrlFailure;

export const blockedArtworkDownloadMessage =
  "Artwork preview loaded, but the image server blocks browser download. Upload the artwork manually for PNG export.";

const imageCache = new Map<string, string>();

function blobToDataUrl(blob: Blob): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
  return promise;
}

export async function createExportableArtworkUrl(
  artworkUrl: string,
  options: CreateExportableArtworkUrlOptions = {},
): Promise<ExportableArtworkUrlResult> {
  if (!isHttpUrl(artworkUrl)) {
    return { ok: true, artworkUrl };
  }

  const normalizedArtworkUrl = normalizeArtworkUrl(artworkUrl);

  // Proxy URLs are served by our backend with CORS and edge caching.
  // Skip redundant client-side download + data URL conversion.
  if (isProxyImageUrl(normalizedArtworkUrl)) {
    return { ok: true, artworkUrl: normalizedArtworkUrl };
  }

  const cached = imageCache.get(normalizedArtworkUrl);
  if (cached) {
    return { ok: true, artworkUrl: cached };
  }

  const fetcher = options.fetcher ?? fetch;

  try {
    const response = await fetcher(normalizedArtworkUrl, {
      mode: "cors",
      credentials: "omit",
    });

    if (!response.ok) {
      return {
        ok: false,
        artworkUrl: normalizedArtworkUrl,
        message: blockedArtworkDownloadMessage,
      };
    }
    const dataUrl = await blobToDataUrl(await response.blob());
    imageCache.set(normalizedArtworkUrl, dataUrl);
    return { ok: true, artworkUrl: dataUrl };
  } catch {
    return {
      ok: false,
      artworkUrl: normalizedArtworkUrl,
      message: blockedArtworkDownloadMessage,
    };
  }
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function isProxyImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname === "/image" && parsed.searchParams.has("url");
  } catch {
    return false;
  }
}

function normalizeArtworkUrl(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}
