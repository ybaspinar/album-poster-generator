export type ExportPresetId =
  | "a4-portrait"
  | "a3-portrait"
  | "poster-12x18"
  | "poster-50x70cm"
  | "poster-40x60cm"
  | "poster-30x40cm"
  | "square";

export interface ExportPreset {
  id: ExportPresetId;
  label: string;
  widthIn: number;
  heightIn: number;
  widthPx: number;
  heightPx: number;
  dpi: number;
  filenameSuffix: string;
}

export const exportPresets: ExportPreset[] = [
  {
    id: "a4-portrait",
    label: "A4 Portrait",
    widthIn: 8.27,
    heightIn: 11.69,
    widthPx: 2480,
    heightPx: 3508,
    dpi: 300,
    filenameSuffix: "a4",
  },
  {
    id: "a3-portrait",
    label: "A3 Portrait",
    widthIn: 11.69,
    heightIn: 16.54,
    widthPx: 3508,
    heightPx: 4961,
    dpi: 300,
    filenameSuffix: "a3",
  },
  {
    id: "poster-12x18",
    label: "12×18 Poster",
    widthIn: 12,
    heightIn: 18,
    widthPx: 3600,
    heightPx: 5400,
    dpi: 300,
    filenameSuffix: "12x18",
  },
  {
    id: "poster-50x70cm",
    label: "50×70 cm Poster",
    widthIn: 19.69,
    heightIn: 27.56,
    widthPx: 5906,
    heightPx: 8268,
    dpi: 300,
    filenameSuffix: "50x70cm",
  },
  {
    id: "poster-40x60cm",
    label: "40×60 cm Poster",
    widthIn: 15.75,
    heightIn: 23.62,
    widthPx: 4724,
    heightPx: 7087,
    dpi: 300,
    filenameSuffix: "40x60cm",
  },
  {
    id: "poster-30x40cm",
    label: "30×40 cm Poster",
    widthIn: 11.81,
    heightIn: 15.75,
    widthPx: 3543,
    heightPx: 4724,
    dpi: 300,
    filenameSuffix: "30x40cm",
  },
  {
    id: "square",
    label: "Square Poster",
    widthIn: 12,
    heightIn: 12,
    widthPx: 3600,
    heightPx: 3600,
    dpi: 300,
    filenameSuffix: "square",
  },
];

export function getExportPreset(id: ExportPresetId): ExportPreset {
  const preset = exportPresets.find((item) => item.id === id);
  if (!preset) throw new Error(`Unknown export preset: ${id}`);
  return preset;
}

export function createExportFilename(artist: string, title: string, preset: ExportPreset): string {
  const base = [artist, title, preset.filenameSuffix].map(slugify).filter(Boolean).join("-");
  return `${base || "album-poster"}.png`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
