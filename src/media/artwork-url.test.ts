import { describe, expect, it, vi } from "vitest";
import { createExportableArtworkUrl } from "./artwork-url";

describe("createExportableArtworkUrl", () => {
  it("downloads an HTTP artwork URL and converts it to an inline data URL", async () => {
    const blob = new Blob(["image"], { type: "image/jpeg" });
    const fetcher = vi.fn().mockResolvedValue(new Response(blob, { status: 200 }));

    const result = await createExportableArtworkUrl("https://example.com/cover.jpg", {
      fetcher,
    });

    expect(result.ok).toBe(true);
    expect(result.artworkUrl).toMatch(/^data:/);
    expect(fetcher).toHaveBeenCalledWith("https://example.com/cover.jpg", {
      mode: "cors",
      credentials: "omit",
    });
  });

  it("upgrades HTTP artwork URLs to HTTPS before downloading", async () => {
    const blob = new Blob(["image"], { type: "image/jpeg" });
    const fetcher = vi.fn().mockResolvedValue(new Response(blob, { status: 200 }));

    const result = await createExportableArtworkUrl("http://dn721907.ca.archive.org/cover.jpg", {
      fetcher,
    });

    expect(result.ok).toBe(true);
    expect(result.artworkUrl).toMatch(/^data:/);
    expect(fetcher).toHaveBeenCalledWith("https://dn721907.ca.archive.org/cover.jpg", {
      mode: "cors",
      credentials: "omit",
    });
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

  it("caches successful downloads and skips re-fetching the same URL", async () => {
    const blob = new Blob(["image"], { type: "image/jpeg" });
    const fetcher = vi.fn().mockResolvedValue(new Response(blob, { status: 200 }));

    const first = await createExportableArtworkUrl("https://example.com/cache.jpg", {
      fetcher,
    });
    expect(first.ok).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);

    const second = await createExportableArtworkUrl("https://example.com/cache.jpg", {
      fetcher,
    });
    expect(second).toEqual(first);
    expect(fetcher).toHaveBeenCalledTimes(1); // not called again
  });

  it("leaves non-HTTP URLs unchanged", async () => {
    await expect(createExportableArtworkUrl("blob:manual-artwork")).resolves.toEqual({
      ok: true,
      artworkUrl: "blob:manual-artwork",
    });
  });
});
