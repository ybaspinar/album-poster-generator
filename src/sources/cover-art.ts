import type { AlbumDraftInput } from "../domain/album";

type Fetcher = typeof fetch;

interface CoverArtImage {
  front?: boolean;
  image?: string;
  thumbnails?: {
    large?: string;
    small?: string;
  };
}

interface CoverArtResponse {
  images?: CoverArtImage[];
}

export async function findCoverArt(
  releaseGroupId: string,
  fetcher: Fetcher = fetch,
): Promise<AlbumDraftInput> {
  const id = releaseGroupId.trim();

  if (!id) {
    return { artworkUrl: "", artworkSource: "remote" };
  }

  const response = await fetcher(
    `https://coverartarchive.org/release-group/${encodeURIComponent(id)}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (response.status === 404) {
    return { artworkUrl: "", artworkSource: "remote" };
  }

  if (!response.ok) {
    throw new Error(`Cover art lookup failed with status ${response.status}`);
  }

  const data = (await response.json()) as CoverArtResponse;
  const images = data.images ?? [];
  const selected = images.find((image) => image.front) ?? images[0];
  const artworkUrl = selected?.thumbnails?.large ?? selected?.image ?? "";

  return {
    artworkUrl,
    artworkSource: artworkUrl ? "cover-art-archive" : "remote",
  };
}
