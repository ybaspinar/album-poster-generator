import type { AlbumDraftInput } from "../domain/album";

type Fetcher = typeof fetch;

interface MusicBrainzArtistCredit {
  name?: string;
}

interface MusicBrainzReleaseGroup {
  id?: string;
  title?: string;
  "first-release-date"?: string;
  "artist-credit"?: MusicBrainzArtistCredit[];
}

interface MusicBrainzReleaseGroupResponse {
  "release-groups"?: MusicBrainzReleaseGroup[];
}

const musicBrainzBaseUrl = "https://musicbrainz.org/ws/2/release-group";

export async function searchMusicBrainzAlbums(
  query: string,
  fetcher: Fetcher = fetch,
): Promise<AlbumDraftInput[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const url = `${musicBrainzBaseUrl}?query=${encodeURIComponent(normalizedQuery)}&type=album&fmt=json&limit=8`;

  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz search failed with status ${response.status}`);
  }

  const data = (await response.json()) as MusicBrainzReleaseGroupResponse;
  return (data["release-groups"] ?? []).flatMap(normalizeReleaseGroup);
}

function normalizeReleaseGroup(group: MusicBrainzReleaseGroup): AlbumDraftInput[] {
  if (!group.id || !group.title) {
    return [];
  }

  return [
    {
      id: group.id,
      title: group.title,
      artist: normalizeArtistCredit(group["artist-credit"] ?? []),
      releaseDate: group["first-release-date"] ?? "",
      source: "musicbrainz",
      sourceId: group.id,
    },
  ];
}

function normalizeArtistCredit(credits: MusicBrainzArtistCredit[]): string {
  const names = credits
    .map((credit) => credit.name?.trim())
    .filter((name): name is string => Boolean(name));
  return names.join(" & ");
}
