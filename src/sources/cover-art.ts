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

export async function findCoverArt(
  releaseGroupId: string,
  fetcher: Fetcher = fetch,
): Promise<AlbumDraftInput> {
  const id = releaseGroupId.trim();

  if (!id) {
    return { artworkUrl: "", artworkSource: "remote" };
  }

  const response = await fetcher(
    `${musicBrainzProxyBaseUrl()}/release-group/${encodeURIComponent(id)}/cover`,
    acceptJsonInit,
  );

  if (response.status === 404) {
    return { artworkUrl: "", artworkSource: "remote" };
  }

  if (!response.ok) {
    throw new Error(`Cover art lookup failed with status ${response.status}`);
  }

  const data = (await response.json()) as CoverArtResponse;
  const artworkUrl = data.thumbnails?.large ?? data.artworkUrl ?? "";

  return {
    artworkUrl,
    artworkSource: artworkUrl ? "cover-art-archive" : "remote",
  };
}

function musicBrainzProxyBaseUrl(): string {
  return (import.meta.env.VITE_MB_PROXY_URL || defaultProxyBaseUrl).replace(/\/+$/, "");
}
