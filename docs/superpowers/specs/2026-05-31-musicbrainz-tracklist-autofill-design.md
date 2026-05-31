# MusicBrainz Tracklist Autofill Design

## Goal

Autofill poster tracklists from MusicBrainz when album data is selected, while keeping manual editing and a persistent visibility toggle.

## Behavior

- Selecting a MusicBrainz album attempts to fetch a representative release for the release group and read its track titles.
- If tracks are found, the editor textarea is filled automatically.
- If the tracklist lookup fails or returns no tracks, album selection still succeeds and the user can type tracks manually.
- The editor includes a checked-by-default “Show on poster” checkbox next to the tracklist controls.
- The checkbox controls preview/export visibility only. Track text remains in the draft when hidden.
- The checkbox preference is saved in localStorage and reused for future sessions and manual drafts.

## Architecture

- `AlbumDraft` gains `showTracklist: boolean` with default `true`.
- `App.vue` owns persisted visibility preference because it is app/session state, not remote album metadata.
- `musicbrainz.ts` exposes a tracklist fetch helper for release groups and reuses the existing injected `fetcher` pattern for tests.
- `selectAlbum` enriches the selected album with a tracklist before merging it into the draft.
- `PosterPreview` renders tracks only when `draft.showTracklist && draft.tracklist.length`.

## Tests

- Domain tests cover the default visibility flag.
- Editor tests cover checkbox patch emission.
- Preview tests cover hidden tracklists.
- MusicBrainz tests cover release lookup, track extraction, and no-track fallback.
- App flow tests cover selecting a result and seeing auto-filled tracks.
