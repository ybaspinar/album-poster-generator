export type AlbumSource = "manual" | "musicbrainz";
export type ArtworkSource = "manual" | "cover-art-archive" | "remote";
export type PosterFont =
  | "gotham"
  | "inter"
  | "system"
  | "Roboto"
  | "Open Sans"
  | "Lato"
  | "Montserrat"
  | "Poppins"
  | "Raleway"
  | "Noto Sans"
  | "Source Sans Pro"
  | "Nunito"
  | "Oswald"
  | "Ubuntu"
  | "Work Sans"
  | "Rubik"
  | "IBM Plex Sans"
  | "Karla"
  | "Space Grotesk"
  | "Bebas Neue"
  | "Teko"
  | "Playfair Display"
  | "Merriweather"
  | "Lora"
  | "Crimson Text"
  | "Cormorant Garamond"
  | "Zilla Slab"
  | "Permanent Marker"
  | "Pacifico"
  | "Dancing Script"
  | "Courgette"
  | "Bangers"
  | "Anton";

export const posterFontOptions: PosterFont[] = [
  // Built-in fonts
  "gotham",
  "inter",
  "system",
  // Sans-serif Google Fonts
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Noto Sans",
  "Source Sans Pro",
  "Nunito",
  "Oswald",
  "Ubuntu",
  "Work Sans",
  "Rubik",
  "IBM Plex Sans",
  "Karla",
  "Space Grotesk",
  "Bebas Neue",
  "Teko",
  // Serif Google Fonts
  "Playfair Display",
  "Merriweather",
  "Lora",
  "Crimson Text",
  "Cormorant Garamond",
  "Zilla Slab",
  // Display/Decorative Google Fonts
  "Permanent Marker",
  "Pacifico",
  "Dancing Script",
  "Courgette",
  "Bangers",
  "Anton",
];
export const defaultPosterFont: PosterFont = "gotham";

export interface AlbumDraft {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  metadataLine: string;
  artworkUrl: string;
  artworkSource: ArtworkSource;
  palette: string[];
  tracklist: string[];
  showTracklist: boolean;
  source: AlbumSource;
  sourceId: string;
  font: PosterFont;
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
  tracklist?: string[];
  showTracklist?: boolean;
  source?: AlbumSource;
  sourceId?: string;
  font?: PosterFont;
}

export const defaultPalette = ["#f28c28", "#c02465", "#f4a35d", "#a98cbd", "#21889b", "#17245c"];

export function normalizeAlbumText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function createEmptyAlbumDraft(): AlbumDraft {
  return createAlbumDraft();
}

export function createAlbumDraft(input: AlbumDraftInput = {}): AlbumDraft {
  return {
    id: input.id ?? `draft-${crypto.randomUUID()}`,
    title: normalizeAlbumText(input.title ?? ""),
    artist: normalizeAlbumText(input.artist ?? ""),
    releaseDate: normalizeAlbumText(input.releaseDate ?? ""),
    metadataLine: normalizeAlbumText(input.metadataLine ?? ""),
    artworkUrl: input.artworkUrl ?? "",
    artworkSource: input.artworkSource ?? "manual",
    palette: normalizePalette(input.palette),
    tracklist: normalizeTracklist(input.tracklist),
    showTracklist: input.showTracklist ?? true,
    source: input.source ?? "manual",
    sourceId: input.sourceId ?? "",
    font: input.font ?? defaultPosterFont,
  };
}

function normalizePalette(palette: string[] | undefined): string[] {
  const values = palette?.filter((value) => /^#[0-9a-f]{6}$/i.test(value)) ?? [];
  return [...values, ...defaultPalette].slice(0, 6);
}

function normalizeTracklist(tracklist: string[] | undefined): string[] {
  return tracklist?.map(normalizeAlbumText).filter(Boolean) ?? [];
}
