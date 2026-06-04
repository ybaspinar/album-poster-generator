import { applyDraftPatch } from "../editor/draft";
import type { AlbumDraft, AlbumDraftInput, PosterLayout } from "./album";

export type PosterModelId = "clean" | "cover" | "atmosphere" | "darkroom";

export interface PosterModel {
  id: PosterModelId;
  label: string;
  description: string;
  layout: PosterLayout;
  patch: AlbumDraftInput;
}

export const posterModels: PosterModel[] = [
  {
    id: "clean",
    label: "Clean",
    description: "Balanced, modern poster. Artwork, tracklist, palette — everything in its place.",
    layout: "medium",
    patch: {
      layout: "medium",
      backgroundMode: "default",
      font: "inter",
      showTracklist: true,
      showSwatches: true,
      swatchShape: "square",
      typography: {
        title: { color: "#111111", size: 46, weight: 800, uppercase: true },
        artist: { color: "#333333", size: 16, weight: 500, uppercase: true },
        metadata: { color: "#555555", size: 12, weight: 400, uppercase: true },
        tracklist: { color: "#444444", size: 11, weight: 400, uppercase: true },
      },
    },
  },
  {
    id: "cover",
    label: "Cover",
    description: "The artwork is the poster. Light text sits over expansive cover art.",
    layout: "edge-to-edge",
    patch: {
      layout: "edge-to-edge",
      backgroundMode: "artwork",
      backgroundBlur: true,
      backgroundBlurAmount: 8,
      font: "Oswald",
      showTracklist: false,
      showSwatches: false,
      typography: {
        title: { color: "#ffffff", size: 40, weight: 700, uppercase: true },
        artist: { color: "#f0f0f0", size: 14, weight: 500, uppercase: true },
        metadata: { color: "#cccccc", size: 11, weight: 400, uppercase: true },
        tracklist: { color: "#dddddd", size: 10, weight: 400, uppercase: true },
      },
    },
  },
  {
    id: "atmosphere",
    label: "Atmosphere",
    description: "Artwork fills the background behind generous spacing and elegant serif type.",
    layout: "large",
    patch: {
      layout: "large",
      backgroundMode: "artwork",
      backgroundBlur: true,
      backgroundBlurAmount: 18,
      font: "Playfair Display",
      showTracklist: true,
      showSwatches: true,
      swatchShape: "circle",
      typography: {
        title: { color: "#0a0a0a", size: 54, weight: 900, uppercase: true },
        artist: { color: "#1a1a1a", size: 18, weight: 700, uppercase: true },
        metadata: { color: "#333333", size: 13, weight: 400, uppercase: true },
        tracklist: { color: "#2a2a2a", size: 11, weight: 400, uppercase: true },
      },
    },
  },
  {
    id: "darkroom",
    label: "Darkroom",
    description: "High-contrast gallery look. Dark backdrop, white type, bold energy.",
    layout: "medium",
    patch: {
      layout: "medium",
      backgroundMode: "solid",
      backgroundSolidColor: "#0d0d0d",
      font: "Space Grotesk",
      showTracklist: true,
      showSwatches: true,
      swatchShape: "circle",
      typography: {
        title: { color: "#ffffff", size: 50, weight: 900, uppercase: true },
        artist: { color: "#d4d4d4", size: 16, weight: 600, uppercase: true },
        metadata: { color: "#a0a0a0", size: 12, weight: 400, uppercase: true },
        tracklist: { color: "#c0c0c0", size: 10, weight: 400, uppercase: true },
      },
    },
  },
];

export function getPosterModel(id: string): PosterModel {
  return posterModels.find((model) => model.id === id) ?? posterModels[0];
}

export function applyPosterModel(draft: AlbumDraft, modelId: string): AlbumDraft {
  return applyDraftPatch(draft, getPosterModel(modelId).patch);
}
