import type { AlbumDraftInput } from "../domain/album";
import {
  getAlbumSearchStorage,
  normalizeAlbumSearchCacheQuery,
  readCachedAlbumSearchResults,
  type StorageLike,
  writeCachedAlbumSearchResults,
} from "./album-search-cache";

type Fetcher = typeof fetch;

export interface MusicBrainzSearchParams {
  artist?: string;
  title?: string;
  year?: string;
  type?: "album" | "ep" | "single" | "other" | "";
}

interface ProxyAlbumSearchResult {
  id?: string;
  title?: string;
  artist?: string;
  releaseDate?: string;
  primaryType?: string;
  artworkUrl?: string;
  artworkSource?: string;
}

interface ProxyCoverArtResponse {
  artworkUrl?: string;
  thumbnails?: {
    large?: string;
    small?: string;
  };
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

interface SearchMusicBrainzAlbumsOptions {
  fetcher?: Fetcher;
  storage?: StorageLike;
  now?: () => number;
}

const defaultProxyBaseUrl = "https://mb-proxy.ybaspinar.dev";
const acceptJsonInit = { headers: { Accept: "application/json" } } as const;

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
    fetcher,
    typeof query === "string" ? stringQueryToSearchParams(normalizedQuery) : query,
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

  try {
    const editions = await fetchMusicBrainzEditionsRaw(id, fetcher);
    return Promise.all(
      editions.map(async (edition) => {
        const artworkUrl = await fetchCoverArt(
          `release/${encodeURIComponent(edition.id)}/cover`,
          fetcher,
        );
        return artworkUrl ? { ...edition, artworkUrl } : edition;
      }),
    );
  } catch {
    return [];
  }
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

export async function fetchMusicBrainzTracklistForRelease(
  releaseId: string,
  fetcher: Fetcher = fetch,
): Promise<string[]> {
  const id = releaseId.trim();
  if (!id) return [];

  const response = await fetcher(
    proxyUrl(`release/${encodeURIComponent(id)}/tracklist`),
    acceptJsonInit,
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data.filter((track): track is string => typeof track === "string");
}

function stringQueryToSearchParams(normalizedQuery: string): MusicBrainzSearchParams {
  const dashSplit = normalizedQuery.split(/\s+-\s+/);
  if (dashSplit.length === 2 && dashSplit[0]!.length > 0 && dashSplit[1]!.length > 0) {
    return { artist: dashSplit[0], title: dashSplit[1] };
  }
  return { title: normalizedQuery };
}

async function fetchMusicBrainzAlbums(
  fetcher: Fetcher,
  params: MusicBrainzSearchParams,
): Promise<AlbumDraftInput[]> {
  const searchParams = new URLSearchParams();
  const artist = params.artist?.trim() ?? "";
  const title = params.title?.trim() ?? "";
  const year = params.year?.trim() ?? "";
  const type = params.type?.trim() ?? "";

  if (artist) searchParams.set("artist", artist);
  if (title) searchParams.set("album", title);
  if (year) searchParams.set("year", year);
  if (type) searchParams.set("type", type);

  const response = await fetcher(proxyUrl(`search?${searchParams.toString()}`), acceptJsonInit);

  if (!response.ok) {
    throw new Error(`MusicBrainz search failed with status ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data.flatMap(normalizeProxySearchResult);
}

async function enrichAlbumsWithCoverArt(
  albums: AlbumDraftInput[],
  fetcher: Fetcher,
): Promise<AlbumDraftInput[]> {
  return Promise.all(
    albums.map(async (album) => {
      if (!album.sourceId || album.artworkUrl) {
        return album;
      }

      try {
        const artworkUrl = await fetchCoverArt(
          `release-group/${encodeURIComponent(album.sourceId)}/cover`,
          fetcher,
        );

        if (!artworkUrl) {
          return album;
        }

        return {
          ...album,
          artworkUrl,
          artworkSource: "cover-art-archive",
        };
      } catch {
        return album;
      }
    }),
  );
}

async function fetchMusicBrainzEditionsRaw(
  releaseGroupId: string,
  fetcher: Fetcher,
): Promise<MusicBrainzEdition[]> {
  const response = await fetcher(
    proxyUrl(`release-group/${encodeURIComponent(releaseGroupId)}/editions`),
    acceptJsonInit,
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data.flatMap(normalizeProxyEdition);
}

async function fetchFirstReleaseId(releaseGroupId: string, fetcher: Fetcher): Promise<string> {
  const id = releaseGroupId.trim();
  if (!id) return "";

  const editions = await fetchMusicBrainzEditionsRaw(id, fetcher);
  return editions.find((edition) => edition.id)?.id ?? "";
}

async function fetchCoverArt(path: string, fetcher: Fetcher): Promise<string> {
  const response = await fetcher(proxyUrl(path), acceptJsonInit);
  if (response.status === 404 || !response.ok) return "";

  const data = (await response.json()) as ProxyCoverArtResponse;
  return data.artworkUrl ?? data.thumbnails?.large ?? "";
}

function normalizeProxySearchResult(result: unknown): AlbumDraftInput[] {
  if (!result || typeof result !== "object") return [];
  const album = result as ProxyAlbumSearchResult;
  if (!album.id || !album.title) return [];

  return [
    {
      id: album.id,
      title: album.title,
      artist: album.artist ?? "",
      releaseDate: album.releaseDate ?? "",
      source: "musicbrainz",
      sourceId: album.id,
      ...(album.artworkUrl
        ? {
            artworkUrl: album.artworkUrl,
            artworkSource:
              album.artworkSource === "cover-art-archive" ? "cover-art-archive" : "remote",
          }
        : {}),
    },
  ];
}

function normalizeProxyEdition(edition: unknown): MusicBrainzEdition[] {
  if (!edition || typeof edition !== "object") return [];
  const item = edition as Partial<MusicBrainzEdition>;
  if (!item.id || !item.title) return [];

  return [
    {
      id: item.id,
      title: item.title,
      releaseDate: item.releaseDate ?? "",
      country: item.country ?? "",
      formats: Array.isArray(item.formats) ? item.formats : [],
      trackCount: typeof item.trackCount === "number" ? item.trackCount : 0,
      ...(item.artworkUrl ? { artworkUrl: item.artworkUrl } : {}),
    },
  ];
}

function proxyUrl(path: string): string {
  return `${musicBrainzProxyBaseUrl()}/${path}`;
}

function musicBrainzProxyBaseUrl(): string {
  return (import.meta.env.VITE_MB_PROXY_URL || defaultProxyBaseUrl).replace(/\/+$/, "");
}
