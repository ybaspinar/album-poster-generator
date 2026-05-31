# Browser-Only Artwork Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make remote artwork export-safe in the browser by converting CORS-readable artwork URLs into local Blob object URLs before PNG export.

**Architecture:** Keep the app browser-only. Add a small media helper that fetches an artwork URL, converts it to a Blob object URL, and returns a typed result. Wire App-level album selection and fallback cover-art lookup through that helper so the poster preview/export target uses Blob URLs when browser CORS allows them; manual uploads remain unchanged.

**Tech Stack:** Vue 3, VitePlus (`vp`), TypeScript, Vitest, Vue Test Utils, browser Fetch/Blob/Object URL APIs, existing `html-to-image` export library.

---

## File Structure

- Create `src/media/artwork-url.ts`
  - Responsibility: convert remote HTTP(S) artwork URLs into browser object URLs when possible.
  - Public API: `createExportableArtworkUrl(url, options)`.
- Create `src/media/artwork-url.test.ts`
  - Tests successful Blob URL conversion and CORS/download failure result.
- Modify `src/App.vue`
  - Use the helper after album selection and fallback cover art lookup.
  - Keep manual file upload object URLs untouched.
  - Show a clear status when remote artwork cannot be made export-safe.
- Modify `src/components/AppFlow.test.ts`
  - Mock the helper and verify selected remote artwork is replaced with an export-safe object URL.
- Keep current `src/components/PosterPreview.vue` CORS attribute and test.
  - This remains useful defense-in-depth, but Blob URLs become the main export path.

---

## Task 1: Add artwork URL localization helper

**Files:**

- Create: `src/media/artwork-url.ts`
- Create: `src/media/artwork-url.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `src/media/artwork-url.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createExportableArtworkUrl } from "./artwork-url";

describe("createExportableArtworkUrl", () => {
  it("downloads an HTTP artwork URL into an object URL", async () => {
    const blob = new Blob(["image"], { type: "image/jpeg" });
    const fetcher = vi.fn().mockResolvedValue(new Response(blob, { status: 200 }));
    const createObjectUrl = vi.fn().mockReturnValue("blob:exportable-artwork");

    await expect(
      createExportableArtworkUrl("https://example.com/cover.jpg", {
        fetcher,
        createObjectUrl,
      }),
    ).resolves.toEqual({
      ok: true,
      artworkUrl: "blob:exportable-artwork",
    });

    expect(fetcher).toHaveBeenCalledWith("https://example.com/cover.jpg", {
      mode: "cors",
      credentials: "omit",
    });
    expect(createObjectUrl).toHaveBeenCalledWith(blob);
  });

  it("returns the original URL with a message when the browser cannot download it", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      createExportableArtworkUrl("https://example.com/blocked.jpg", { fetcher }),
    ).resolves.toEqual({
      ok: false,
      artworkUrl: "https://example.com/blocked.jpg",
      message:
        "Artwork preview loaded, but the image server blocks browser download. Upload the artwork manually for PNG export.",
    });
  });

  it("leaves non-HTTP URLs unchanged", async () => {
    await expect(createExportableArtworkUrl("blob:manual-artwork")).resolves.toEqual({
      ok: true,
      artworkUrl: "blob:manual-artwork",
    });
  });
});
```

- [ ] **Step 2: Run helper tests and verify they fail**

Run:

```bash
vp test src/media/artwork-url.test.ts
```

Expected: FAIL because `src/media/artwork-url.ts` does not exist.

- [ ] **Step 3: Implement the minimal helper**

Create `src/media/artwork-url.ts`:

```ts
interface CreateExportableArtworkUrlOptions {
  fetcher?: typeof fetch;
  createObjectUrl?: (blob: Blob) => string;
}

interface ExportableArtworkUrlSuccess {
  ok: true;
  artworkUrl: string;
}

interface ExportableArtworkUrlFailure {
  ok: false;
  artworkUrl: string;
  message: string;
}

export type ExportableArtworkUrlResult = ExportableArtworkUrlSuccess | ExportableArtworkUrlFailure;

export const blockedArtworkDownloadMessage =
  "Artwork preview loaded, but the image server blocks browser download. Upload the artwork manually for PNG export.";

export async function createExportableArtworkUrl(
  artworkUrl: string,
  options: CreateExportableArtworkUrlOptions = {},
): Promise<ExportableArtworkUrlResult> {
  if (!isHttpUrl(artworkUrl)) {
    return { ok: true, artworkUrl };
  }

  const fetcher = options.fetcher ?? fetch;
  const createObjectUrl = options.createObjectUrl ?? URL.createObjectURL.bind(URL);

  try {
    const response = await fetcher(artworkUrl, {
      mode: "cors",
      credentials: "omit",
    });

    if (!response.ok) {
      return { ok: false, artworkUrl, message: blockedArtworkDownloadMessage };
    }

    return { ok: true, artworkUrl: createObjectUrl(await response.blob()) };
  } catch {
    return { ok: false, artworkUrl, message: blockedArtworkDownloadMessage };
  }
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
```

- [ ] **Step 4: Run helper tests and verify they pass**

Run:

```bash
vp test src/media/artwork-url.test.ts
```

Expected: PASS.

---

## Task 2: Wire export-safe artwork into App selection flow

**Files:**

- Modify: `src/App.vue`
- Modify: `src/components/AppFlow.test.ts`

- [ ] **Step 1: Write failing App flow expectation**

Modify `src/components/AppFlow.test.ts`:

Add this mock near the existing mocks:

```ts
vi.mock("../media/artwork-url", () => ({
  createExportableArtworkUrl: vi.fn().mockResolvedValue({
    ok: true,
    artworkUrl: "blob:search-front-exportable",
  }),
}));
```

Add this import:

```ts
import { createExportableArtworkUrl } from "../media/artwork-url";
```

Change the existing poster image assertion from:

```ts
expect(wrapper.find(".poster-art").attributes("src")).toBe("https://example.com/search-front.jpg");
```

to:

```ts
expect(createExportableArtworkUrl).toHaveBeenCalledWith("https://example.com/search-front.jpg");
expect(wrapper.find(".poster-art").attributes("src")).toBe("blob:search-front-exportable");
```

- [ ] **Step 2: Run App flow test and verify it fails**

Run:

```bash
vp test src/components/AppFlow.test.ts
```

Expected: FAIL because `App.vue` does not call `createExportableArtworkUrl` yet.

- [ ] **Step 3: Implement minimal App wiring**

In `src/App.vue`, add this import:

```ts
import { createExportableArtworkUrl } from "./media/artwork-url";
```

Add this helper function near `patchDraft`:

```ts
async function makeArtworkExportable(artworkUrl: string): Promise<string> {
  const result = await createExportableArtworkUrl(artworkUrl);

  if (!result.ok) {
    status.value = result.message;
  }

  return result.artworkUrl;
}
```

In `selectAlbum`, replace:

```ts
draft.value = mergeFetchedAlbum(draft.value, album);
status.value = "Album data loaded. You can override every field.";
```

with:

```ts
const exportableArtworkUrl = album.artworkUrl
  ? await makeArtworkExportable(album.artworkUrl)
  : album.artworkUrl;

draft.value = mergeFetchedAlbum(draft.value, {
  ...album,
  artworkUrl: exportableArtworkUrl,
});

if (exportableArtworkUrl === album.artworkUrl) {
  status.value = "Album data loaded. You can override every field.";
}
```

In the fallback cover-art block, replace:

```ts
draft.value = applyDraftPatch(draft.value, await findCoverArt(album.sourceId));
```

with:

```ts
const coverArt = await findCoverArt(album.sourceId);
const exportableArtworkUrl = coverArt.artworkUrl
  ? await makeArtworkExportable(coverArt.artworkUrl)
  : coverArt.artworkUrl;
draft.value = applyDraftPatch(draft.value, {
  ...coverArt,
  artworkUrl: exportableArtworkUrl,
});
```

- [ ] **Step 4: Run App flow test and verify it passes**

Run:

```bash
vp test src/components/AppFlow.test.ts
```

Expected: PASS.

---

## Task 3: Keep CORS attribute regression and run final verification

**Files:**

- Modify: `src/components/PosterPreview.vue`
- Modify: `src/components/PosterPreview.test.ts`

- [ ] **Step 1: Keep or add PosterPreview CORS regression**

Ensure `src/components/PosterPreview.vue` includes:

```vue
crossorigin="anonymous"
```

on the artwork `<img>`.

Ensure `src/components/PosterPreview.test.ts` includes:

```ts
it("loads remote artwork with anonymous CORS for PNG export", () => {
  const wrapper = mount(PosterPreview, {
    props: {
      draft: createAlbumDraft({
        artworkUrl: "https://example.com/cover.jpg",
      }),
    },
  });

  expect(wrapper.find("img").attributes("crossorigin")).toBe("anonymous");
});
```

- [ ] **Step 2: Run full verification**

Run:

```bash
vp check
vp test
vp build
```

Expected:

- `vp check` exits 0.
- `vp test` exits 0.
- `vp build` exits 0. Existing `@vueuse/core` Rolldown annotation warnings are acceptable if the exit code is 0.
