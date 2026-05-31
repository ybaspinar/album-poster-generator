# Editable Tracklist Design

## Goal

Add an editable tracklist to the album poster generator so posters can use the open caption space beneath the artist/release information.

## Product behavior

- The editor exposes a `Tracklist` textarea.
- Each non-blank textarea line becomes one track.
- The preview numbers tracks automatically as `1) Track title`, `2) Track title`, etc.
- Blank lines are ignored.
- If there are no tracks, the poster keeps the current layout and renders no tracklist block.

## Architecture

- Store tracks as `tracklist: string[]` on `AlbumDraft`.
- Normalize tracks in the domain layer when creating drafts.
- Keep textarea serialization local to `AlbumEditor`: `string[]` props become newline-separated text, and textarea updates emit a normalized `tracklist` patch.
- Keep poster numbering presentational in `PosterPreview`.

## Component map

- `src/domain/album.ts`: owns draft shape and tracklist normalization.
- `src/components/AlbumEditor.vue`: owns editable textarea UI and emits `tracklist` patches.
- `src/components/PosterPreview.vue`: owns poster rendering of the numbered list.
- `src/styles/globals.css`: owns poster tracklist layout and print-preview typography.

## Visual direction

The tracklist should feel like part of the existing restrained reference poster: compact, uppercase where appropriate, aligned with the left metadata column, and quieter than the artist name. It should use the caption whitespace without competing with the artwork or title.

## Testing

- Domain tests cover blank-line trimming and default empty tracklists.
- Editor tests cover textarea rendering and emitted normalized patches.
- Preview tests cover automatic numbering and no block when empty.
