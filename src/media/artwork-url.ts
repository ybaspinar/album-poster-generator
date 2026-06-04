interface CreateExportableArtworkUrlOptions {
  fetcher?: typeof fetch;
  createObjectUrl?: (blob: Blob) => string;
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

const cache = new Map<string, ExportableArtworkUrlResult>();

export async function createExportableArtworkUrl(
  artworkUrl: string,
  options: CreateExportableArtworkUrlOptions = {},
): Promise<ExportableArtworkUrlResult> {
  if (!isHttpUrl(artworkUrl)) {
    return { ok: true, artworkUrl };
  }

  const normalizedArtworkUrl = normalizeArtworkUrl(artworkUrl);

  const cached = cache.get(normalizedArtworkUrl);
  if (cached) {
    return cached;
  }

  const fetcher = options.fetcher ?? fetch;
  const createObjectUrl = options.createObjectUrl ?? URL.createObjectURL.bind(URL);

  try {
    const response = await fetcher(normalizedArtworkUrl, {
      mode: "cors",
      credentials: "omit",
    });

    if (!response.ok) {
      const result: ExportableArtworkUrlResult = {
        ok: false,
        artworkUrl: normalizedArtworkUrl,
        message: blockedArtworkDownloadMessage,
      };
      cache.set(normalizedArtworkUrl, result);
      return result;
    }

    const result: ExportableArtworkUrlResult = {
      ok: true,
      artworkUrl: createObjectUrl(await response.blob()),
    };
    cache.set(normalizedArtworkUrl, result);
    return result;
  } catch {
    const result: ExportableArtworkUrlResult = {
      ok: false,
      artworkUrl: normalizedArtworkUrl,
      message: blockedArtworkDownloadMessage,
    };
    cache.set(normalizedArtworkUrl, result);
    return result;
  }
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function normalizeArtworkUrl(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}
