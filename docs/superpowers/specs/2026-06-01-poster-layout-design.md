# Poster Layout Design

**Date:** 2026-06-01
**Status:** Ready for review

## Goal

Add a layout selector to the Layout accordion section that controls internal spacing of the poster. Four presets: Small, Medium (default), Large, Edge to Edge.

## Layout Presets

Each preset controls only the outer padding of the poster. Internal element spacing (rule, meta row, tracklist margins, etc.) stays exactly the same — only the outer frame changes.

| Option           | `.poster-page` padding        | `.poster-caption` padding                   | Behavior                                                           |
| ---------------- | ----------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| **Small**        | `3% 4%`                       | unchanged (current)                         | Tighter outer frame                                                |
| **Medium**       | `5.5% 7.5%` (current default) | unchanged (current)                         | The current look                                                   |
| **Large**        | `7% 10%`                      | unchanged (current)                         | More breathing room                                                |
| **Edge to Edge** | `0`                           | `0 3% 3%` (overrides current `padding-top`) | Artwork bleeds to edges, caption has small left/right/bottom inset |

Key nuance for Edge to Edge: the artwork fills the full poster surface edge-to-edge (no outer padding at all). The caption section (title, artist, meta, tracklist) gets its own left/right/bottom padding of `3%` so info doesn't touch the border. Internal element spacing within the caption stays the same as every other layout — only the outer frame changes.

## Data Model

### New type

```ts
export type PosterLayout = "small" | "medium" | "large" | "edge-to-edge";
```

### AlbumDraft addition

```ts
export interface AlbumDraft {
  // ...existing fields
  layout: PosterLayout;
}
```

### Defaults

```ts
const defaultPosterLayout: PosterLayout = "medium";
```

Draft creation defaults to `"medium"` — existing posters are unaffected.

## Persistence

Layout preference is saved to `localStorage` (key: `album-poster-generator:layout`) via the Pinia store, following the same pattern as `showTracklist`. On load, the saved preference is applied; on change, it's written back.

## UI

- Layout accordion replaces the empty placeholder card
- `<Select>` dropdown with 4 options: Small, Medium, Large, Edge to Edge
- Medium is the default; no "unset" state — every poster always has a layout

## CSS Strategy

Layout is controlled through CSS classes on `.poster-page`. Internal element margins (`.poster-rule`, `.poster-tracklist`, `.poster-meta-row`, etc.) are **never overridden** — only the outer padding changes.

- `.poster-page` — base class keeps Medium padding as default (`5.5% 7.5%`)
- `.poster-layout-small` — overrides padding to `3% 4%`
- `.poster-layout-medium` — same as base, no extra class needed
- `.poster-layout-large` — overrides padding to `7% 10%`
- `.poster-layout-edge-to-edge` — overrides padding to `0`, and applies `.poster-caption` padding `0 3% 3%` (small inset for info)

## Component Map

```
PosterPreview.vue
└── .poster-page
    └── class bound to draft.layout → layout CSS class

AlbumEditor.vue → Layout card
└── Select component with 4 layout options
    └── emits patch: { layout: PosterLayout }

domain/album.ts
└── New PosterLayout type, defaultPosterLayout constant
    └── Added to AlbumDraft / AlbumDraftInput

stores/album.ts
└── localStorage read/write for layout preference
    └── Applied in createAlbumDraft and patchDraft
```

## Files to Modify

- `src/domain/album.ts` — Add `PosterLayout` type, `defaultPosterLayout`, update `AlbumDraft` / `AlbumDraftInput` / `createAlbumDraft`
- `src/stores/album.ts` — Add `layout` localStorage key, read on init, write on patch
- `src/components/AlbumEditor.vue` — Layout card Select dropdown replacing placeholder
- `src/components/PosterPreview.vue` — Bind layout class to `.poster-page`
- `src/styles/globals.css` — Add layout CSS classes (small, large, edge-to-edge; medium is the base)

## No Open Questions

All aspects confirmed by user.
