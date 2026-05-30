import { defaultPalette } from "../domain/album";

export function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function quantizePixelsToPalette(pixels: Uint8ClampedArray, maxColors = 6): string[] {
  const buckets = new Map<string, number>();

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;

    if (alpha < 128) {
      continue;
    }

    const red = quantizeChannel(pixels[index] ?? 0);
    const green = quantizeChannel(pixels[index + 1] ?? 0);
    const blue = quantizeChannel(pixels[index + 2] ?? 0);
    const color = rgbToHex(red, green, blue);
    buckets.set(color, (buckets.get(color) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color)
    .slice(0, maxColors);
}

export async function extractPaletteFromImage(url: string, maxColors = 6): Promise<string[]> {
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return cloneDefaultPalette();
  }

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

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Image could not be loaded for palette extraction.")),
    );
    image.src = url;
  });
}
