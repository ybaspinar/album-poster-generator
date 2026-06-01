export type AlbumSource = "manual" | "musicbrainz";
export type ArtworkSource = "manual" | "cover-art-archive" | "remote";
export type SwatchShape = "square" | "circle";
export type TracklistColumns = "1" | "2" | "3";
export type TracklistSize = "small" | "medium" | "large";
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

export type PosterLayout = "small" | "medium" | "large" | "edge-to-edge";

export const defaultPosterLayout: PosterLayout = "medium";

export const posterLayoutOptions: PosterLayout[] = ["small", "medium", "large", "edge-to-edge"];

export type PosterBackgroundMode = "default" | "solid" | "gradient" | "artwork";
export type GradientDirection = "horizontal" | "vertical" | "radial";

export const defaultPosterBackgroundMode: PosterBackgroundMode = "default";
export const defaultBackgroundSolidColor = "#1a1a2e";
export const defaultBackgroundGradientFrom = "#1a1a2e";
export const defaultBackgroundGradientTo = "#16213e";
export const defaultBackgroundGradientDirection: GradientDirection = "vertical";
export const defaultBackgroundBlurAmount = 10;

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
  tracklistColumns: TracklistColumns;
  tracklistSize: TracklistSize;
  showSwatches: boolean;
  swatchShape: SwatchShape;
  source: AlbumSource;
  sourceId: string;
  font: PosterFont;
  layout: PosterLayout;
  backgroundMode: PosterBackgroundMode;
  backgroundSolidColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  backgroundGradientDirection: GradientDirection;
  backgroundBlur: boolean;
  backgroundBlurAmount: number;
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
  tracklistColumns?: TracklistColumns;
  tracklistSize?: TracklistSize;
  showSwatches?: boolean;
  swatchShape?: SwatchShape;
  source?: AlbumSource;
  sourceId?: string;
  font?: PosterFont;
  layout?: PosterLayout;
  backgroundMode?: PosterBackgroundMode;
  backgroundSolidColor?: string;
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?: GradientDirection;
  backgroundBlur?: boolean;
  backgroundBlurAmount?: number;
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
    tracklistColumns: input.tracklistColumns ?? "3",
    tracklistSize: input.tracklistSize ?? "medium",
    showSwatches: input.showSwatches ?? true,
    swatchShape: input.swatchShape ?? "square",
    source: input.source ?? "manual",
    sourceId: input.sourceId ?? "",
    font: input.font ?? defaultPosterFont,
    layout: input.layout ?? defaultPosterLayout,
    backgroundMode: input.backgroundMode ?? defaultPosterBackgroundMode,
    backgroundSolidColor: input.backgroundSolidColor ?? defaultBackgroundSolidColor,
    backgroundGradientFrom: input.backgroundGradientFrom ?? defaultBackgroundGradientFrom,
    backgroundGradientTo: input.backgroundGradientTo ?? defaultBackgroundGradientTo,
    backgroundGradientDirection:
      input.backgroundGradientDirection ?? defaultBackgroundGradientDirection,
    backgroundBlur: input.backgroundBlur ?? false,
    backgroundBlurAmount: normalizeBackgroundBlurAmount(input.backgroundBlurAmount),
  };
}

function normalizeBackgroundBlurAmount(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return defaultBackgroundBlurAmount;
  return Math.min(24, Math.max(0, Math.round(value)));
}

function normalizePalette(palette: string[] | undefined): string[] {
  const values = palette?.filter((value) => /^#[0-9a-f]{6}$/i.test(value)) ?? [];
  return [...values, ...defaultPalette].slice(0, 6);
}

function normalizeTracklist(tracklist: string[] | undefined): string[] {
  return tracklist?.map(normalizeAlbumText).filter(Boolean) ?? [];
}
