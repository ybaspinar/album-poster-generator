# Album Poster Generator

Browser-only Vue SPA for creating print-ready album posters.

## Features

- Search album metadata through MusicBrainz.
- Fetch linked cover art when available.
- Override title, artist, release date, metadata line, artwork, and palette.
- Preview one polished reference-style poster template.
- Export PNG files for A4, A3, 12×18, and square print presets.

## Tooling

This project uses VitePlus with Vue 3, Vite, TypeScript, pnpm, Vitest, and Oxc-family checks.

## Commands

```bash
vp install
vp dev
vp test --run
vp build
vp check
```

## Notes

The MVP has no backend and stores no API secrets. External album data is treated as a helper; manual editing is always available.
