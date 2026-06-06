import { extractColors } from "extract-colors";
import { defaultPalette } from "../domain/album";

const cache = new Map<string, string[]>();

export async function extractPaletteFromImage(url: string, maxColors = 6): Promise<string[]> {
  const cached = cache.get(url);
  if (cached) {
    return cached;
  }

  try {
    const colors = await extractColors(url, {
      pixels: 96 * 96,
      distance: 0.2,
    });

    // Extract hex values and ensure we have up to maxColors
    let hexColors = colors.map((c) => c.hex).slice(0, maxColors);

    // Fill remaining slots with default palette colors
    while (hexColors.length < maxColors && hexColors.length < defaultPalette.length) {
      const remainingDefault = defaultPalette[hexColors.length];
      if (remainingDefault && !hexColors.includes(remainingDefault)) {
        hexColors.push(remainingDefault);
      }
    }

    const result = hexColors.slice(0, maxColors);
    cache.set(url, result);
    return result;
  } catch {
    // Fall back to default palette on error
    return [...defaultPalette];
  }
}
