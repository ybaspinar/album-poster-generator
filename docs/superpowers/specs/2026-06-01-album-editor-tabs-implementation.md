# Implementation Plan - Album Editor Tab Refactor

## Summary
Split AlbumEditor.vue into 6 independently collapsible tab sections to improve organization and extensibility.

## Changes Required

### 1. Create AlbumEditorTab.vue component
- Create new `src/components/AlbumEditorTab.vue`
- Use `defineModel` for open/close state
- Add chevron icon that rotates based on open state
- Apply CSS transition for smooth expand/collapse
- Accept `title` prop for tab header

### 2. Refactor AlbumEditor.vue
- Add 6 boolean refs for tab open states (all default to `true`)
- Wrap each field group in `<AlbumEditorTab>`
- Move existing field markup into appropriate tabs
- Add empty placeholder content for Layout tab

### 3. Update tests
- Verify all existing functionality still works
- Add tests for tab open/close behavior
- Update ARIA/accessibility attributes

## Implementation Steps

1. **Step 1**: Create `src/components/AlbumEditorTab.vue`
   - Basic collapsible container with title slot
   - Chevron rotation CSS
   - Transition styling
   - Props: `title`, `modelValue` for open state

2. **Step 2**: Refactor `src/components/AlbumEditor.vue`
   - Add refs: `tabInfoOpen`, `tabTracklistOpen`, etc.
   - Wrap Info fields in `<AlbumEditorTab title="Info">`
   - Wrap Tracklist fields in `<AlbumEditorTab title="Tracklist">`
   - Wrap Artwork fields in `<AlbumEditorTab title="Artwork">`
   - Wrap Font field in `<AlbumEditorTab title="Typography">`
   - Wrap Palette fields in `<AlbumEditorTab title="Colors">`
   - Add empty `<AlbumEditorTab title="Layout">` placeholder

3. **Step 3**: Update `src/components/AlbumEditor.test.ts`
   - Add test for tab collapse/expand
   - Verify all fields still accessible
   - Check chevron icon rotates on click

4. **Step 4**: Final verification
   - Run `vp check` and `vp test`
   - Verify no regressions

## Files to Modify
- `src/components/AlbumEditorTab.vue` (NEW)
- `src/components/AlbumEditor.vue` (MODIFY)
- `src/components/AlbumEditor.test.ts` (MODIFY)