# Album search thumbnails and local cache design

## Goal

Improve album search results by showing cover thumbnails immediately and avoiding repeated external API calls for data that changes rarely.

## Scope

- Add small artwork thumbnails beside album search results.
- Cache normalized, enriched search results in browser `localStorage` for 90 days.
- Use cached artwork from search results immediately when an album is selected.
- Keep the app browser-only with no backend and no API secrets.

Out of scope:

- Cache management UI.
- IndexedDB storage.
- Background refresh.
- Manual cache clearing inside the app.

## Architecture

Search remains initiated by `AlbumSearch.vue`. The source layer will expose a cached search path that:

1. Normalizes the query.
2. Checks `localStorage` for a valid cache entry keyed by the normalized query.
3. Returns cached enriched results when the entry is younger than 90 days.
4. Otherwise calls MusicBrainz, enriches each result with Cover Art Archive artwork when available, stores the enriched list, and returns it.

MusicBrainz remains the authority for album metadata. Cover Art Archive remains best-effort enrichment. A cover-art failure for one result must not fail the entire search.

The existing `AlbumDraftInput` shape can carry the selected artwork through `artworkUrl` and `artworkSource`, so selecting a result should merge artwork immediately without requiring a second cover-art lookup. The app can still fall back to `findCoverArt(sourceId)` when selected search data has no artwork.

## Data model

Each cached entry stores:

- cache schema version,
- normalized query,
- `cachedAt` timestamp in milliseconds,
- enriched `AlbumDraftInput[]` results.

Cache key format:

```text
album-poster-generator:album-search:v1:<normalized-query>
```

Expiration:

- TTL is 90 days.
- Missing, malformed, wrong-version, or expired entries are ignored.
- Failed fresh searches should not overwrite a valid cache entry.

## UI behavior

Search results become compact rows:

- left: square thumbnail, using the result `artworkUrl` when present,
- right: title, artist, and release date,
- fallback: muted placeholder block when no thumbnail exists.

The row remains a button and keeps keyboard/mouse behavior intact. Image loading should not block result interaction. Use empty alt text for decorative thumbnails because the title and artist are already visible in text.

## Error handling

- Blank queries return no results and do not fetch.
- MusicBrainz non-OK responses keep the existing readable error behavior.
- Cover Art Archive non-OK or network failures during enrichment produce a result without artwork rather than failing the search.
- Bad cache JSON, unsupported schema, or expired entries are treated as cache misses.
- `localStorage` access failures are non-fatal, so private browsing or storage quota issues do not break search.

## Testing

Add or update tests for:

- cache hit returns stored results and skips network,
- expired cache fetches fresh data,
- malformed cache is ignored,
- enriched results include artwork when Cover Art Archive returns front art,
- cover-art enrichment failure still returns metadata-only results,
- app flow selecting a result can populate artwork from search data immediately.

## Implementation notes

Prefer small source-layer helpers over moving cache logic into the component. Keep component changes limited to rendering thumbnails and consuming the same search API. Avoid new dependencies.
