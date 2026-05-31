# Album Editor Tab Refactor - Design

**Date:** 2026-06-01
**Status:** Ready for review

## Goal
Split the AlbumEditor into collapsible tab sections for better organization and easier future additions.

## Tab Structure

| Tab | Fields | Purpose |
|-----|--------|---------|
| **Info** | Title, Artist, Release date, Metadata line | Core album metadata |
| **Tracklist** | Tracklist textarea, Show checkbox, Columns, Size | Tracklist configuration |
| **Artwork** | Artwork URL input, File upload input | Cover artwork management |
| **Typography** | Font dropdown | Font selection |
| **Colors** | Show swatches, Swatch shape, 6 color pickers | Palette colors |
| **Layout** | Empty placeholder | Future: border radius, poster style, etc. |

## Design Decisions

### 1. Component Architecture
- Create `AlbumEditorTab.vue` - Reusable collapsible tab component
- Keep `AlbumEditor.vue` as the parent composing tabs
- Each tab group renders inside `<AlbumEditorTab>` with appropriate title

### 2. Tab Behavior
- All tabs **independently collapsible** (not mutually exclusive)
- Chevron indicator shows expand/collapse state
- Smooth CSS transition for content reveal
- Tab state managed via boolean refs in AlbumEditor

### 3. Data Flow
- **No changes to current pattern**: Uses existing `emit("patch", ...)`
- `AlbumEditorTab` is presentational, receives `modelValue` for open state
- Parent controls all tab open/close logic

### 4. Props/Emits for AlbumEditorTab
```ts
interface AlbumEditorTabProps {
  title: string
  open: boolean
}

interface AlbumEditorTabEmits {
  'update:open': [open: boolean]
}

// defineModel pattern (Vue 3.4+)
const open = defineModel<boolean>({ default: true })
```

## Component Map

```
AlbumEditor.vue
└── AlbumEditorTab.vue (x6, one per section)
    ├── Info fields (title, artist, etc.)
    ├── Tracklist fields (textarea, selects, checkbox)
    ├── Artwork fields (url input, file input)
    ├── Typography field (font select)
    ├── Color fields (swatch shape, color inputs)
    └── Layout (empty placeholder slot)
```

## No Open Questions
All aspects confirmed by user.