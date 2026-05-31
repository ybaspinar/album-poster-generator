import { defaultPalette } from "../domain/album";

export function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function quantizePixelsToPalette(pixels: Uint8ClampedArray, maxColors = 6): string[] {
  const buckets = new Map<string, { count: number; saturation: number }>();

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;

    if (alpha < 128) {
      continue;
    }

    const red = quantizeChannel(pixels[index] ?? 0);
    const green = quantizeChannel(pixels[index + 1] ?? 0);
    const blue = quantizeChannel(pixels[index + 2] ?? 0);

    // Skip near-white colors (very light colors)
    if (isNearWhite(red, green, blue)) {
      continue;
    }

    const color = rgbToHex(red, green, blue);
    const sat = calculateSaturation(red, green, blue);
    const existing = buckets.get(color);
    buckets.set(color, {
      count: (existing?.count ?? 0) + 1,
      saturation: Math.max(existing?.saturation ?? 0, sat),
    });
  }

  // Sort by saturation first (more vibrant colors), then randomize within groups
  const sorted = [...buckets.entries()].sort((a, b) => {
    const satDiff = b[1].saturation - a[1].saturation;
    if (satDiff !== 0) return satDiff;
    return b[1].count - a[1].count;
  });

  // Apply some randomness - shuffle colors within saturation bands
  const colors = sorted.map(([color]) => color);
  return selectWithVariety(colors, maxColors);
}

export async function extractPaletteFromImage(url: string, maxColors = 6): Promise<string[]> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return cloneDefaultPalette();
  }

  const image = await loadImage(url);
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  context.drawImage(image, 0, 0, size, size);

  const palette = quantizePixelsToPalette(context.getImageData(0, 0, size, size).data, maxColors);
  return palette.length > 0 ? palette : cloneDefaultPalette();
}

function quantizeChannel(value: number): number {
  return clampChannel(Math.round(value / 4) * 4);
}

function cloneDefaultPalette(): string[] {
  return [...defaultPalette];
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, value));
}

// Skip colors that are too light (near-white) to avoid extracting paper/white backgrounds
function isNearWhite(red: number, green: number, blue: number): boolean {
  const lightness = (Math.max(red, green, blue) + Math.min(red, green, blue)) / 2;
  // Skip if lightness is above ~85% (values >= 215)
  return lightness >= 215;
}

// Calculate saturation for a color (0-255 scale)
function calculateSaturation(red: number, green: number, blue: number): number {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  if (max === 0) return 0;
  return max - min;
}

// Select colors with some randomness within saturation groups to ensure variety
function selectWithVariety(colors: string[], maxColors: number): string[] {
  if (colors.length <= maxColors) {
    return colors;
  }

  // Group colors by saturation level
  const highSat = colors.filter(() => Math.random() > 0.3).slice(0, Math.min(3, maxColors));
  const remainingCount = maxColors - highSat.length;

  // Fill remaining slots from lower saturation colors
  const result = [...highSat];
  for (const color of colors) {
    if (result.length >= maxColors) break;
    if (!result.includes(color)) {
      result.push(color);
    }
  }

  // If still not enough, just take the top colors
  while (result.length < maxColors && result.length < colors.length) {
    const next = colors[result.length];
    if (!result.includes(next)) result.push(next);
    else break;
  }

  return result.slice(0, maxColors);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Only set crossOrigin for HTTP URLs, not blob URLs
    if (url.startsWith("http")) {
      image.crossOrigin = "anonymous";
    }
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Image could not be loaded for palette extraction.")),
    );
    image.src = url;
  });
}