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

export interface MusicBrainzSearchParams {
  artist?: string;
  title?: string;
  year?: string;
  type?: "album" | "ep" | "single" | "other" | "";
}

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

interface MusicBrainzReleaseListItem {
  id?: string;
  title?: string;
  date?: string;
  country?: string;
  media?: MusicBrainzMedium[];
}

interface MusicBrainzReleaseListResponse {
  releases?: MusicBrainzReleaseListItem[];
}

interface MusicBrainzTrack {
  title?: string;
}

interface MusicBrainzMedium {
  format?: string;
  tracks?: MusicBrainzTrack[];
}

interface CoverArtImage {
  front?: boolean;
  image?: string;
  thumbnails?: {
    large?: string;
  };
}

interface CoverArtResponse {
  images?: CoverArtImage[];
}

export interface MusicBrainzEdition {
  id: string;
  title: string;
  releaseDate: string;
  country: string;
  formats: string[];
  trackCount: number;
  artworkUrl?: string;
}

interface MusicBrainzReleaseDetailResponse {
  media?: MusicBrainzMedium[];
}

interface SearchMusicBrainzAlbumsOptions {
  fetcher?: Fetcher;
  storage?: StorageLike;
  now?: () => number;
}

const musicBrainzBaseUrl = "https://musicbrainz.org/ws/2/release-group";
const musicBrainzReleaseBaseUrl = "https://musicbrainz.org/ws/2/release";
const searchLimit = 12;

export function normalizeSearchParams(params: MusicBrainzSearchParams): string {
  const parts: string[] = [];
  const artist = params.artist?.trim().toLowerCase() ?? "";
  const title = params.title?.trim().toLowerCase() ?? "";
  const year = params.year?.trim() ?? "";
  const type = params.type?.trim().toLowerCase() ?? "";

  if (artist) parts.push(`a:${artist}`);
  if (title) parts.push(`t:${title}`);
  if (year) parts.push(`y:${year}`);
  if (type) parts.push(`ty:${type}`);

  return parts.join("|");
}

export function paramsDisplayLabel(params: MusicBrainzSearchParams): string {
  const artist = params.artist?.trim() ?? "";
  const title = params.title?.trim() ?? "";

  if (artist && title) return `${artist} - ${title}`;
  return title || artist || "";
}

export async function searchMusicBrainzAlbums(
  query: string | MusicBrainzSearchParams,
  options: SearchMusicBrainzAlbumsOptions = {},
): Promise<AlbumDraftInput[]> {
  const normalizedQuery =
    typeof query === "string"
      ? normalizeAlbumSearchCacheQuery(query)
      : normalizeSearchParams(query);

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

  const results = await fetchMusicBrainzAlbums(
    normalizedQuery,
    fetcher,
    typeof query === "string" ? undefined : query,
  );
  const enrichedResults = await enrichAlbumsWithCoverArt(results, fetcher);
  writeCachedAlbumSearchResults(normalizedQuery, enrichedResults, storage, now);

  return enrichedResults;
}

export async function fetchMusicBrainzEditions(
  releaseGroupId: string,
  fetcher: Fetcher = fetch,
): Promise<MusicBrainzEdition[]> {
  const id = releaseGroupId.trim();

  if (!id) {
    return [];
  }

  const url = `${musicBrainzReleaseBaseUrl}?release-group=${encodeURIComponent(id)}&inc=media&fmt=json&limit=25`;
  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as MusicBrainzReleaseListResponse;
  const releases = data.releases ?? [];

  // Fetch cover art for each release
  const editions = await Promise.all(
    releases.map(async (release) => {
      const baseEdition = normalizeEdition(release)[0];
      if (!baseEdition) return null;

      const artworkUrl = release.id ? await fetchReleaseCoverArt(release.id, fetcher) : undefined;
      return { ...baseEdition, artworkUrl: artworkUrl || undefined } as MusicBrainzEdition;
    }),
  );

  return editions.filter((edition): edition is MusicBrainzEdition => edition !== null);
}

export async function fetchMusicBrainzTracklist(
  releaseGroupId: string,
  fetcher: Fetcher = fetch,
): Promise<string[]> {
  try {
    const releaseId = await fetchFirstReleaseId(releaseGroupId, fetcher);

    if (!releaseId) {
      return [];
    }

    return fetchMusicBrainzTracklistForRelease(releaseId, fetcher);
  } catch {
    return [];
  }
}

async function fetchFirstReleaseId(releaseGroupId: string, fetcher: Fetcher): Promise<string> {
  const url = `${musicBrainzReleaseBaseUrl}?release-group=${encodeURIComponent(releaseGroupId)}&fmt=json&limit=5`;
  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return "";
  }

  const data = (await response.json()) as MusicBrainzReleaseListResponse;
  return data.releases?.find((release) => release.id)?.id ?? "";
}

export async function fetchMusicBrainzTracklistForRelease(
  releaseId: string,
  fetcher: Fetcher = fetch,
): Promise<string[]> {
  const url = `${musicBrainzReleaseBaseUrl}/${encodeURIComponent(releaseId)}?inc=recordings&fmt=json`;
  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as MusicBrainzReleaseDetailResponse;
  return (data.media ?? []).flatMap((medium) =>
    (medium.tracks ?? [])
      .map((track) => track.title?.replace(/\s+/g, " ").trim())
      .filter((title): title is string => Boolean(title)),
  );
}

function buildMusicBrainzQuery(normalizedQuery: string, params?: MusicBrainzSearchParams): string {
  if (params) {
    const clauses: string[] = [];
    const artist = params.artist?.trim() ?? "";
    const title = params.title?.trim() ?? "";
    const year = params.year?.trim() ?? "";
    const type = params.type?.trim() ?? "";

    if (artist) clauses.push(`artist:"${artist}"`);
    if (title) clauses.push(`releasegroup:"${title}"`);
    if (year) clauses.push(`date:${year}`);
    if (type) clauses.push(`primarytype:${type.charAt(0).toUpperCase() + type.slice(1)}`);

    return clauses.join(" AND ");
  }

  // Legacy string query: detect "artist - album" shorthand
  const dashSplit = normalizedQuery.split(/\s+-\s+/);
  if (dashSplit.length === 2 && dashSplit[0].length > 0 && dashSplit[1].length > 0) {
    return `artist:"${dashSplit[0]}" AND releasegroup:"${dashSplit[1]}"`;
  }
  return normalizedQuery;
}

async function fetchMusicBrainzAlbums(
  normalizedQuery: string,
  fetcher: Fetcher,
  params?: MusicBrainzSearchParams,
): Promise<AlbumDraftInput[]> {
  const url = `${musicBrainzBaseUrl}?query=${encodeURIComponent(buildMusicBrainzQuery(normalizedQuery, params))}&fmt=json&limit=${searchLimit}`;

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

async function fetchReleaseCoverArt(releaseId: string, fetcher: Fetcher): Promise<string> {
  const response = await fetcher(
    `https://coverartarchive.org/release/${encodeURIComponent(releaseId)}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (response.status === 404 || !response.ok) {
    return "";
  }

  const data = (await response.json()) as CoverArtResponse;
  const images = data.images ?? [];
  const selected = images.find((image) => image.front) ?? images[0];
  return selected?.image ?? selected?.thumbnails?.large ?? "";
}

function normalizeEdition(release: MusicBrainzReleaseListItem): MusicBrainzEdition[] {
  if (!release.id || !release.title) {
    return [];
  }

  const formats = Array.from(
    new Set(
      (release.media ?? [])
        .map((medium) => medium.format?.trim())
        .filter((format): format is string => Boolean(format)),
    ),
  );
  const trackCount = (release.media ?? []).reduce(
    (total, medium) => total + (medium.tracks?.length ?? 0),
    0,
  );

  return [
    {
      id: release.id,
      title: release.title,
      releaseDate: release.date ?? "",
      country: release.country ?? "",
      formats,
      trackCount,
    },
  ];
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
