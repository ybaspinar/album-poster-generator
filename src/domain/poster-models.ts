import { applyDraftPatch } from "../editor/draft";
import type { AlbumDraft, AlbumDraftInput, PosterLayout } from "./album";

export type PosterModelId = "clean" | "atmosphere";

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
];

function getPosterModel(id: string): PosterModel {
  return posterModels.find((model) => model.id === id)!;
}

export function applyPosterModel(draft: AlbumDraft, modelId: string): AlbumDraft {
  return applyDraftPatch(draft, getPosterModel(modelId).patch);
}
