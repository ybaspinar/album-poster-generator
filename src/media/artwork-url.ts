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

export async function createExportableArtworkUrl(
  artworkUrl: string,
  options: CreateExportableArtworkUrlOptions = {},
): Promise<ExportableArtworkUrlResult> {
  if (!isHttpUrl(artworkUrl)) {
    return { ok: true, artworkUrl };
  }

  const normalizedArtworkUrl = normalizeArtworkUrl(artworkUrl);
  const fetcher = options.fetcher ?? fetch;
  const createObjectUrl = options.createObjectUrl ?? URL.createObjectURL.bind(URL);

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

    return { ok: true, artworkUrl: createObjectUrl(await response.blob()) };
  } catch {
    return { ok: false, artworkUrl: normalizedArtworkUrl, message: blockedArtworkDownloadMessage };
  }
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function normalizeArtworkUrl(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}
