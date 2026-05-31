import type { AlbumDraftInput } from "../domain/album";
import {
  getAlbumSearchStorage,
  normalizeAlbumSearchCacheQuery,
  readCachedAlbumSearchResults,
  type StorageLike,
  writeCachedAlbumSearchResults,
} from "./album-search-cache";
import { findCoverArt } from "./cover-art";

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

interface SearchMusicBrainzAlbumsOptions {
  fetcher?: Fetcher;
  storage?: StorageLike;
  now?: () => number;
}

const musicBrainzBaseUrl = "https://musicbrainz.org/ws/2/release-group";
const searchLimit = 12;

export async function searchMusicBrainzAlbums(
  query: string,
  options: SearchMusicBrainzAlbumsOptions = {},
): Promise<AlbumDraftInput[]> {
  const normalizedQuery = normalizeAlbumSearchCacheQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  const fetcher = options.fetcher ?? fetch;
  const storage = options.storage ?? getAlbumSearchStorage();
  const now = options.now?.() ?? Date.now();
  const cachedResults = readCachedAlbumSearchResults(normalizedQuery, storage, now);

  if (cachedResults) {
    return cachedResults;
  }

  const results = await fetchMusicBrainzAlbums(normalizedQuery, fetcher);
  const enrichedResults = await enrichAlbumsWithCoverArt(results, fetcher);
  writeCachedAlbumSearchResults(normalizedQuery, enrichedResults, storage, now);

  return enrichedResults;
}

function buildMusicBrainzQuery(normalizedQuery: string): string {
  const dashSplit = normalizedQuery.split(/\s+-\s+/);
  if (dashSplit.length === 2 && dashSplit[0].length > 0 && dashSplit[1].length > 0) {
    return `artist:"${dashSplit[0]}" AND releasegroup:"${dashSplit[1]}"`;
  }
  return normalizedQuery;
}

async function fetchMusicBrainzAlbums(
  normalizedQuery: string,
  fetcher: Fetcher,
): Promise<AlbumDraftInput[]> {
  const url = `${musicBrainzBaseUrl}?query=${encodeURIComponent(buildMusicBrainzQuery(normalizedQuery))}&fmt=json&limit=${searchLimit}`;

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

async function enrichAlbumsWithCoverArt(
  albums: AlbumDraftInput[],
  fetcher: Fetcher,
): Promise<AlbumDraftInput[]> {
  return Promise.all(
    albums.map(async (album) => {
      if (!album.sourceId) {
        return album;
      }

      try {
        const coverArt = await findCoverArt(album.sourceId, fetcher);

        if (!coverArt.artworkUrl) {
          return album;
        }

        return {
          ...album,
          artworkUrl: coverArt.artworkUrl,
          artworkSource: coverArt.artworkSource,
        };
      } catch {
        return album;
      }
    }),
  );
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
