# MusicBrainz Tracklist Autofill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Autofill poster tracklists from MusicBrainz and let users persist whether tracklists are shown on posters.

**Architecture:** Keep track data in `AlbumDraft.tracklist` and visibility in `AlbumDraft.showTracklist`. Fetch tracklists only after selecting a release group, then merge the result into the draft. Persist only the visibility preference in localStorage from `App.vue`.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest, Vue Test Utils, VitePlus (`vp test --run`, `vp check`).

---

## File Structure

- Modify `src/domain/album.ts` and `src/domain/album.test.ts` for `showTracklist` draft state.
- Modify `src/components/AlbumEditor.vue` and test for the checkbox patch.
- Modify `src/components/PosterPreview.vue` and test for hidden tracklists.
- Modify `src/sources/musicbrainz.ts` and test for release/tracklist API calls.
- Modify `src/App.vue` and `src/components/AppFlow.test.ts` for selected-album autofill and persisted preference.

## Tasks

1. Write failing draft/editor/preview tests for `showTracklist`.
2. Implement minimal `showTracklist` draft state, editor checkbox, and preview condition.
3. Write failing MusicBrainz tests for release-group tracklist lookup.
4. Implement release-group -> release -> media tracks lookup with best-effort fallback.
5. Write failing App flow test proving selected albums autofill tracks.
6. Implement selected-album enrichment and localStorage preference persistence.
7. Run `vp check` and `vp test --run`.
