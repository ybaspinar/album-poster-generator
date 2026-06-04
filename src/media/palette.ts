import { extractColors } from "extract-colors";
import { defaultPalette } from "../domain/album";

export async function extractPaletteFromImage(url: string, maxColors = 6): Promise<string[]> {
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
      if (!hexColors.includes(remainingDefault)) {
        hexColors.push(remainingDefault);
      }
    }

    return hexColors.slice(0, maxColors);
  } catch {
    // Fall back to default palette on error
    return [...defaultPalette];
  }
}
