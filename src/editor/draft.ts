import { createAlbumDraft, type AlbumDraft, type AlbumDraftInput } from "../domain/album";

export function mergeFetchedAlbum(current: AlbumDraft, fetched: AlbumDraftInput): AlbumDraft {
  return createAlbumDraft({
    ...current,
    ...fetched,
    id: current.id,
    metadataLine: createPosterMetadataLine(
      fetched.releaseDate ?? current.releaseDate,
      fetched.artist ?? current.artist,
    ),
  });
}

export function applyDraftPatch(current: AlbumDraft, patch: AlbumDraftInput): AlbumDraft {
  return createAlbumDraft({
    ...current,
    ...patch,
    id: current.id,
  });
}

export function createPosterMetadataLine(releaseDate: string, artist: string): string {
  const parts = [];
  const formattedDate = formatReleaseDate(releaseDate);

  if (formattedDate) {
    parts.push(`Released: ${formattedDate}`);
  }

  if (artist.trim()) {
    parts.push(artist.trim());
  }

  return parts.join(" · ");
}

function formatReleaseDate(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const date = new Date(`${trimmed}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
