# Album Poster Generator Design

## Goal

Build a browser-only SPA for generating polished album posters suitable for printing. The app should feel fast and lightweight, with fetched album data as a starting point and manual overrides for anything the user wants to change.

## Technology

- Vue 3 + Vite + TypeScript.
- Use VitePlus for project/tooling setup.
- Use the latest viable toolchain versions at setup time, including Vite 8 and TypeScript 7 if available/usable in the environment.
- Use pnpm for package management.
- No backend in the MVP. The app must run entirely in the browser.

## Scope

MVP includes:

- Hybrid album creation:
  - Search/fetch album metadata where possible.
  - Start manually when lookup is not useful.
  - Upload custom artwork.
- Manual overrides for all fetched values:
  - album title,
  - artist,
  - release date,
  - artwork,
  - palette/swatches,
  - small metadata lines.
- One polished reference-style poster template:
  - large album art,
  - bold album title,
  - artist/metadata area,
  - divider line,
  - color swatches.
- Multiple export presets for print.
- PNG-first export.

Out of MVP:

- QR codes or Spotify-like scannable codes.
- Freeform drag-and-drop template editing.
- Multiple templates.
- Backend/proxy/API secrets.

## User Flow

1. User searches for an album or starts manually.
2. If searching, the app fetches metadata and artwork candidates from browser-accessible sources.
3. Selected or manually entered data becomes an editable poster draft.
4. User tweaks text, artwork, palette, and export preset.
5. Live preview updates from the draft.
6. User exports a print-ready PNG.

## Architecture

Keep the app split into small browser-only modules:

- **Album data layer**: normalized `AlbumDraft` model, MusicBrainz source adapter, artwork lookup helpers, and manual import/upload helpers.
- **Editor state**: one reactive draft. Fetched values populate defaults; user edits mutate the final poster data.
- **Poster template**: a component that renders the poster from the draft and has no API knowledge.
- **Preset system**: print size definitions such as A4, A3, 12×18 inch, square poster, and later custom sizes.
- **Export engine**: takes rendered poster state plus preset dimensions and produces a downloadable PNG.

Data flow:

```text
Search/manual input → normalized album draft → editable poster state → preview template → export preset → file download
```

## Metadata and Artwork Strategy

Use external sources as helpers, not hard dependencies.

- Use MusicBrainz first for browser-accessible album search and metadata. MusicBrainz does not need an API key.
- Prefer release-group/release identifiers when useful for artwork lookup.
- Try browser-accessible cover art sources linked to MusicBrainz.
- Last.fm and Apple Music artwork discovery can be added if CORS and no-secret access are practical.
- Do not embed private API keys in the SPA.
- If a source fails, keep the manual path available and show clear feedback.
- Manual upload always overrides remote artwork.
- Manual text fields always override fetched metadata.
- Palette extraction runs locally from the selected image, then the user can adjust swatches manually.

## Export Behavior

Initial presets:

- A4 portrait.
- A3 portrait.
- 12×18 inch poster.
- Square album poster.

Each preset should define:

- physical size,
- pixel dimensions at 300 DPI,
- aspect ratio,
- safe-area/bleed metadata where useful,
- default filename pattern, e.g. `artist-album-a4.png`.

PNG is the first supported export format because it is predictable for artwork-heavy posters. The export engine should not prevent adding PDF later.

Quality bar:

- Export should match the preview layout.
- Text should be sharp enough for print.
- Colors should stay close to preview.
- Layout should not shift between preview and export.

## Error Handling

- Metadata/artwork source failures are non-blocking.
- Show which source failed and keep manual editing available.
- Validate uploaded image type and size.
- Preserve the draft if export fails.
- If a preset is too heavy for the browser, suggest a smaller preset or lower output size.

## Testing

Test the regression-prone units:

- Source adapters normalize responses into `AlbumDraft`.
- Manual overrides beat fetched values.
- Image upload validation handles common valid/invalid files.
- Palette extraction handles common image formats.
- Preset dimensions are correct.
- Export receives the same poster state shown in preview.

Mock source adapters so editor and export tests do not depend on live APIs.

## Future Extensions

- PDF export.
- QR/link fields.
- More poster templates.
- Template editing controls.
- Additional artwork sources.
- Custom print sizes.
