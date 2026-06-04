import { applyDraftPatch } from "../editor/draft";
import type { AlbumDraft, AlbumDraftInput, PosterLayout } from "./album";

export type PosterModelId = "standard" | "frame" | "basic" | "full-cover";

export interface PosterModel {
  id: PosterModelId;
  label: string;
  description: string;
  layout: PosterLayout;
  patch: AlbumDraftInput;
}

export const posterModels: PosterModel[] = [
  {
    id: "standard",
    label: "Standard",
    description: "Balanced artwork, title, metadata, tracklist, and palette.",
    layout: "medium",
    patch: {
      layout: "medium",
      backgroundMode: "default",
      showTracklist: true,
      showSwatches: true,
      swatchShape: "square",
      typography: {
        title: { size: 48, weight: 700, uppercase: true },
        artist: { size: 16, weight: 400, uppercase: true },
        metadata: { size: 13, weight: 400, uppercase: true },
        tracklist: { size: 11, weight: 400, uppercase: true },
      },
    },
  },
  {
    id: "frame",
    label: "Frame",
    description: "A cleaner framed look with generous poster margins.",
    layout: "large",
    patch: {
      layout: "large",
      backgroundMode: "solid",
      backgroundSolidColor: "#f6f1e8",
      showTracklist: true,
      showSwatches: true,
      typography: {
        title: { size: 44, weight: 800, uppercase: true },
        artist: { size: 15, weight: 500, uppercase: true },
      },
    },
  },
  {
    id: "basic",
    label: "Basic",
    description: "Minimal artwork and type for quick clean posters.",
    layout: "small",
    patch: {
      layout: "small",
      backgroundMode: "default",
      showTracklist: false,
      showSwatches: false,
      typography: {
        title: { size: 42, weight: 700, uppercase: false },
        artist: { size: 18, weight: 500, uppercase: false },
      },
    },
  },
  {
    id: "full-cover",
    label: "Full Cover",
    description: "Artwork-forward poster with the cover driving the surface.",
    layout: "edge-to-edge",
    patch: {
      layout: "edge-to-edge",
      backgroundMode: "artwork",
      backgroundBlur: true,
      backgroundBlurAmount: 12,
      showTracklist: true,
      showSwatches: false,
      typography: {
        title: { size: 52, weight: 900, uppercase: true },
        artist: { size: 18, weight: 700, uppercase: true },
        tracklist: { size: 10, weight: 500, uppercase: true },
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
