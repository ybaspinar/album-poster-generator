import { describe, expect, it, vi } from "vitest";
import { searchMusicBrainzAlbums } from "./musicbrainz";

describe("searchMusicBrainzAlbums", () => {
  it("normalizes release group search results", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          "release-groups": [
            {
              id: "rg-1",
              title: "Kids See Ghosts",
              "first-release-date": "2018-06-08",
              "primary-type": "Album",
              "artist-credit": [{ name: "Kanye West" }, { name: "Kid Cudi" }],
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(searchMusicBrainzAlbums("kids see ghosts", fetcher)).resolves.toEqual([
      {
        id: "rg-1",
        title: "Kids See Ghosts",
        artist: "Kanye West & Kid Cudi",
        releaseDate: "2018-06-08",
        source: "musicbrainz",
        sourceId: "rg-1",
      },
    ]);

    expect(fetcher).toHaveBeenCalledWith(
      "https://musicbrainz.org/ws/2/release-group?query=kids%20see%20ghosts&type=album&fmt=json&limit=8",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
  });

  it("returns an empty list for blank queries without fetching", async () => {
    const fetcher = vi.fn();

    await expect(searchMusicBrainzAlbums("  ", fetcher)).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("throws a readable error when MusicBrainz fails", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("rate limited", { status: 503 }));

    await expect(searchMusicBrainzAlbums("test", fetcher)).rejects.toThrow(
      "MusicBrainz search failed with status 503",
    );
  });
});
