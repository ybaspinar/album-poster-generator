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

export type TypographySection = "title" | "artist" | "metadata" | "tracklist";
export type TypographyWeight = 400 | 500 | 700 | 800 | 900;

export interface TypographyStyle {
  color: string;
  size: number;
  weight: TypographyWeight;
  italic: boolean;
  uppercase: boolean;
}

export type TypographySettings = Record<TypographySection, TypographyStyle>;
export type TypographyInput = Partial<Record<TypographySection, Partial<TypographyStyle>>>;

export const defaultTypography: TypographySettings = {
  title: {
    color: "#111111",
    size: 100,
    weight: 700,
    italic: false,
    uppercase: true,
  },
  artist: {
    color: "#111111",
    size: 100,
    weight: 400,
    italic: false,
    uppercase: true,
  },
  metadata: {
    color: "#111111",
    size: 100,
    weight: 400,
    italic: false,
    uppercase: true,
  },
  tracklist: {
    color: "#6f6a60",
    size: 100,
    weight: 400,
    italic: false,
    uppercase: true,
  },
};

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
  typography: TypographySettings;
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
  typography?: TypographyInput;
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
    typography: normalizeTypography(input.typography),
  };
}

function normalizeBackgroundBlurAmount(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return defaultBackgroundBlurAmount;
  return Math.min(24, Math.max(0, Math.round(value)));
}

function normalizeTypography(input: TypographyInput | undefined): TypographySettings {
  return {
    title: normalizeTypographyStyle(defaultTypography.title, input?.title),
    artist: normalizeTypographyStyle(defaultTypography.artist, input?.artist),
    metadata: normalizeTypographyStyle(defaultTypography.metadata, input?.metadata),
    tracklist: normalizeTypographyStyle(defaultTypography.tracklist, input?.tracklist),
  };
}

function normalizeTypographyStyle(
  defaults: TypographyStyle,
  input: Partial<TypographyStyle> | undefined,
): TypographyStyle {
  return {
    color: normalizeTypographyColor(input?.color, defaults.color),
    size: normalizeTypographySize(input?.size, defaults.size),
    weight: normalizeTypographyWeight(input?.weight, defaults.weight),
    italic: input?.italic ?? defaults.italic,
    uppercase: input?.uppercase ?? defaults.uppercase,
  };
}

function normalizeTypographyColor(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

function normalizeTypographySize(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(180, Math.max(60, Math.round(value)));
}

function normalizeTypographyWeight(
  value: number | undefined,
  fallback: TypographyWeight,
): TypographyWeight {
  if (value === 400 || value === 500 || value === 700 || value === 800 || value === 900) {
    return value;
  }
  return fallback;
}

function normalizePalette(palette: string[] | undefined): string[] {
  const values = palette?.filter((value) => /^#[0-9a-f]{6}$/i.test(value)) ?? [];
  return [...values, ...defaultPalette].slice(0, 6);
}

function normalizeTracklist(tracklist: string[] | undefined): string[] {
  return tracklist?.map(normalizeAlbumText).filter(Boolean) ?? [];
}
