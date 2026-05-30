export type AlbumSource = 'manual' | 'musicbrainz';
export type ArtworkSource = 'manual' | 'cover-art-archive' | 'remote';

export interface AlbumDraft {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  metadataLine: string;
  artworkUrl: string;
  artworkSource: ArtworkSource;
  palette: string[];
  source: AlbumSource;
  sourceId: string;
}

export interface AlbumDraftInput {
  id?: string;
  title?: string;
  artist?: string;
  releaseDate?: string;
  metadataLine?: string;
  artworkUrl?: string;
  artworkSource?: ArtworkSource;
  palette?: string[];
  source?: AlbumSource;
  sourceId?: string;
}

export const defaultPalette = ['#f28c28', '#c02465', '#f4a35d', '#a98cbd', '#21889b', '#17245c'];

export function normalizeAlbumText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function createEmptyAlbumDraft(): AlbumDraft {
  return createAlbumDraft();
}

export function createAlbumDraft(input: AlbumDraftInput = {}): AlbumDraft {
  return {
    id: input.id ?? `draft-${crypto.randomUUID()}`,
    title: normalizeAlbumText(input.title ?? ''),
    artist: normalizeAlbumText(input.artist ?? ''),
    releaseDate: normalizeAlbumText(input.releaseDate ?? ''),
    metadataLine: normalizeAlbumText(input.metadataLine ?? ''),
    artworkUrl: input.artworkUrl ?? '',
    artworkSource: input.artworkSource ?? 'manual',
    palette: normalizePalette(input.palette),
    source: input.source ?? 'manual',
    sourceId: input.sourceId ?? '',
  };
}

function normalizePalette(palette: string[] | undefined): string[] {
  const values = palette?.filter((value) => /^#[0-9a-f]{6}$/i.test(value)) ?? [];
  return [...values, ...defaultPalette].slice(0, 6);
}
