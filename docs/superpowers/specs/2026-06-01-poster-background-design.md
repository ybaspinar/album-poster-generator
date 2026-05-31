# Poster Background Design

**Date:** 2026-06-01
**Status:** Ready for review

## Goal

Add a new **Background** accordion card with two independent controls:
1. **Background mode** — Default / Solid / Gradient / Artwork
2. **Frosted blur toggle** — applies a frosted overlay on top of any background mode

## Background Modes

| Mode | Behavior |
|------|----------|
| **Default** | Current design — solid `--paper` color, artwork in frame, caption on top. No extra UI. |
| **Solid** | Single color picker replaces `--paper` background. Artwork frame and caption unchanged. |
| **Gradient** | Two color pickers + direction dropdown (horizontal / vertical / radial). Replaces `--paper` background. |
| **Artwork** | Artwork fills the full poster as the background (no separate art frame). Caption sits on top with a white-to-transparent gradient strip at the bottom for readability. |

## Frosted Blur (Independent Toggle)

A single checkbox: **"Frosted overlay"**

- Applies a semi-transparent white blur layer (`backdrop-blur`) on top of the entire background
- Works with all 4 modes — even Default (solid paper with a frosted texture effect)
- Checkbox is always visible regardless of selected mode

## Data Model

### New types

```ts
export type PosterBackgroundMode = "default" | "solid" | "gradient" | "artwork";
export type GradientDirection = "horizontal" | "vertical" | "radial";
```

### AlbumDraft addition

```ts
export interface AlbumDraft {
  // ...existing fields
  backgroundMode: PosterBackgroundMode;
  backgroundSolidColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  backgroundGradientDirection: GradientDirection;
  backgroundBlur: boolean;
}
```

### Defaults

```ts
const defaultPosterBackgroundMode: PosterBackgroundMode = "default";
const defaultBackgroundSolidColor = "#1a1a2e";
const defaultBackgroundGradientFrom = "#1a1a2e";
const defaultBackgroundGradientTo = "#16213e";
const defaultBackgroundGradientDirection: GradientDirection = "vertical";
```

Draft creation defaults to `backgroundMode: "default"` and `backgroundBlur: false` — existing posters are unaffected.

## Persistence

Background settings are saved to `localStorage` as a single JSON blob under key `album-poster-generator:background`:

```json
{
  "mode": "gradient",
  "solidColor": "#1a1a2e",
  "gradientFrom": "#1a1a2e",
  "gradientTo": "#16213e",
  "gradientDirection": "vertical",
  "blur": false
}
```

- On draft creation, saved background is applied (user's last settings persist across sessions)
- On `patchDraft`, when any background-related field changes, the whole blob is written back
- Defaults are used when nothing is stored yet

## UI — New Background Card

New **Background** accordion card placed after Swatches, before Layout.

### When mode is Default:
- Select shows "Default"
- Only the "Frosted overlay" checkbox is visible below

### When mode is Solid:
- Color picker labeled "Background color"
- "Frosted overlay" checkbox

### When mode is Gradient:
- Two color pickers: "From" and "To"
- Direction dropdown: Horizontal / Vertical / Radial
- "Frosted overlay" checkbox

### When mode is Artwork:
- Brief helper text: "Album artwork fills the poster background"
- "Frosted overlay" checkbox
- Caption gets a white gradient strip overlay automatically for text readability

## CSS Strategy

Background styles are controlled through CSS custom properties set via inline `:style` on `.poster-page`:

- `--bg-solid` — solid color value (used when mode is Solid)
- `--bg-gradient-from`, `--bg-gradient-to`, `--bg-gradient-dir` — gradient values (used when mode is Gradient)
- `.poster-bg-frosted` — class that adds `backdrop-blur` overlay via `::before` pseudo-element

For **Artwork** mode:
- `.poster-bg-artwork` — class on `.poster-page`
- Background image set via inline style `background-image: url(...)`
- `.poster-caption::after` — white-to-transparent gradient strip at the bottom

## Component Map

```
PosterPreview.vue
└── .poster-page
    ├── :style binding for background colors/gradient/image
    ├── class "poster-bg-frosted" when blur is on
    └── .poster-caption
        └── ::after pseudo-element for artwork mode readability strip

AlbumEditor.vue → new Background card
├── Select: mode (Default / Solid / Gradient / Artwork)
├── Color picker(s): solid color or gradient from/to
├── Select: gradient direction
└── Checkbox: frosted overlay

domain/album.ts
└── New types + defaults, added to AlbumDraft / AlbumDraftInput

stores/album.ts
└── localStorage read/write for background settings (single JSON blob)
    └── Applied in createAlbumDraft and patchDraft
```

## Files to Modify

- `src/domain/album.ts` — Add background types, defaults, update `AlbumDraft` / `AlbumDraftInput` / `createAlbumDraft`
- `src/components/AlbumEditor.vue` — New Background accordion card
- `src/components/PosterPreview.vue` — Background rendering (colors, gradient, artwork mode, blur)
- `src/styles/globals.css` — Frosted blur overlay, artwork mode caption strip

## No Open Questions

All aspects confirmed by user.
