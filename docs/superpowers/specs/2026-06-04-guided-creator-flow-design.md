# Guided Creator Flow - Design

**Date:** 2026-06-04
**Status:** Ready for review

## Goal

Replace the current dense editor-first layout with a simpler album creation journey, while keeping this app personal-share friendly rather than marketing-site oriented.

The app should open directly into creation. No hero section, no community content, no signup affordances, and no promotional landing page. The first screen should help a friend make a poster quickly.

## Reference Behavior

The useful reference flow pattern is:

1. Search for an album.
2. Pick a visual album result.
3. Pick a poster model.
4. Edit the poster with the preview visible and controls grouped behind top tabs.
5. Export.

The design borrows that journey structure, not the reference site's full landing page, community feed, account system, or Spotify-specific branding.

## Target Flow

### 1. Create Start

The app starts at the creator surface, not a hero page.

- Show a concise app title and helper line.
- Primary task is album search.
- Provide a secondary manual-start action for users who cannot find an album or want to design from a blank/default draft.
- Avoid a long intro, scrolling marketing sections, or social/community blocks.

### 2. Album Search

Replace the current form-card feeling with a focused search stage.

- Keep current MusicBrainz search behavior and fields, because artist/title/year/type improve result quality.
- Present it visually as one creation step rather than a utility form.
- Results should be artwork-first cards in a grid/list, not dense outline buttons.
- Selecting a result loads metadata and advances to model selection.
- If multiple MusicBrainz editions exist, keep the edition picker before model selection.

### 3. Poster Model Selection

After an album is loaded, show a model picker before exposing detailed controls.

Model cards map to existing capabilities:

| Model      | Initial settings                        | Purpose                         |
| ---------- | --------------------------------------- | ------------------------------- |
| Standard   | Current default poster layout           | Safe first choice               |
| Frame      | Current layout with framed artwork feel | Framed poster option            |
| Basic      | Simplified text/artwork emphasis        | Minimal poster                  |
| Full Cover | Artwork-forward layout/background       | Strong visual album-cover style |

Selecting a model applies a draft patch and advances to editing. The user can go back to choose a different model.

### 4. Editor Workspace

The editor should feel like a focused creation workspace, not the current full accordion stack.

- Preview stays visible during editing.
- Controls sit in a compact panel with top tabs.
- Back navigation returns to model selection or search.
- Use direct labels and short helper text.
- Keep all current editing capabilities, but reveal them by task.

Top tabs:

| Tab         | Fields                                                         |
| ----------- | -------------------------------------------------------------- |
| Information | Title, artist, release date, metadata line, artwork URL/upload |
| Tracklist   | Tracklist text, show tracklist, columns, tracklist size        |
| Style       | Font, typography, swatches, background, layout                 |
| Export      | Preset selection and PNG export action                         |

The old accordion grouping can be removed or internalized once all fields are reachable through the tabs.

### 5. Export

Export becomes part of the main journey.

- The Export tab contains preset selection and the export button.
- Status messages stay visible near the active workspace.
- Export still captures only `[data-export-poster]`.
- Current export filenames, presets, and PostHog events remain unchanged.

## State Model

Add a small flow state in `App.vue` or a focused child component:

```ts
type CreatorStep = "search" | "models" | "editor";
type EditorTab = "information" | "tracklist" | "style" | "export";
```

State transitions:

- Initial: `search`.
- Search result selected and album loaded: `models`.
- Edition selected, if needed: `models`.
- Manual start selected: `models` using the current/default draft.
- Model selected: `editor` with `information` tab active.
- Export tab selected: `editor` with `export` tab active.
- Back from editor: `models`.
- Back from models: `search`.

No validation gates should block navigation. Users can move forward with incomplete data because manual editing and export already handle incomplete drafts.

## Component Direction

Prefer targeted components over a large rewrite:

- `App.vue` owns overall flow, draft loading, export, and status.
- `AlbumSearch.vue` remains responsible for search state, but its result presentation changes to visual cards.
- Add a model picker component if it keeps `App.vue` smaller.
- Refactor `AlbumEditor.vue` from accordion sections into tabbed sections, or split tab content into small components if the file remains too large.
- `ExportPanel.vue` can be reused inside the Export tab.
- `PosterPreview.vue` remains unchanged unless spacing requires a wrapper adjustment.

## Non-Goals

- No marketing hero.
- No community gallery.
- No accounts or publish flow.
- No Spotify integration change.
- No new poster rendering engine.
- No change to export capture behavior.

## Testing

Add or update tests around behavior, not styling defaults:

- Initial app shows the creator/search stage, not the old dense editor stack.
- Search result selection advances to model selection after album data loads.
- Multiple-edition albums still show the edition picker before model selection.
- Selecting a model advances to editor and leaves preview visible.
- Editor tabs expose information, tracklist, style, and export controls.
- Export action still calls the existing export flow from the Export tab.

Existing domain, store, MusicBrainz, artwork, palette, and export tests should continue to pass without behavior changes.
