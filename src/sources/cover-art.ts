import type { AlbumDraftInput } from "../domain/album";

type Fetcher = typeof fetch;

interface CoverArtResponse {
  artworkUrl?: string;
  thumbnails?: {
    large?: string;
    small?: string;
  };
}

const defaultProxyBaseUrl = "https://mb-proxy.ybaspinar.dev";
const acceptJsonInit = { headers: { Accept: "application/json" } } as const;

const cache = new Map<string, AlbumDraftInput>();

export async function findCoverArt(
  releaseGroupId: string,
  fetcher: Fetcher = fetch,
): Promise<AlbumDraftInput> {
  const id = releaseGroupId.trim();

  if (!id) {
    return { artworkUrl: "", artworkSource: "remote" };
  }

  const cached = cache.get(id);
  if (cached) {
    return cached;
  }

  const response = await fetcher(
    `${musicBrainzProxyBaseUrl()}/release-group/${encodeURIComponent(id)}/cover`,
    acceptJsonInit,
  );

  if (response.status === 404) {
    const result: AlbumDraftInput = { artworkUrl: "", artworkSource: "remote" };
    cache.set(id, result);
    return result;
  }

  if (!response.ok) {
    throw new Error(`Cover art lookup failed with status ${response.status}`);
  }

  const data = (await response.json()) as CoverArtResponse;
  const artworkUrl = data.thumbnails?.large ?? data.artworkUrl ?? "";

  const result: AlbumDraftInput = {
    artworkUrl,
    artworkSource: artworkUrl ? "cover-art-archive" : "remote",
  };
  cache.set(id, result);
  return result;
}

function musicBrainzProxyBaseUrl(): string {
  return (import.meta.env.VITE_MB_PROXY_URL || defaultProxyBaseUrl).replace(/\/+$/, "");
}
