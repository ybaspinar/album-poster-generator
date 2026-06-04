import { toPng } from "html-to-image";
import type { ExportPreset } from "./presets";

async function preloadImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      const { promise, resolve } = Promise.withResolvers<void>();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      return promise;
    }),
  );
}

export async function exportElementAsPng(
  element: HTMLElement,
  preset: ExportPreset,
  filename: string,
): Promise<void> {
  await preloadImages(element);

  const sourceRect = element.getBoundingClientRect();
  const sourceWidth = element.offsetWidth || sourceRect.width || preset.widthPx;
  const sourceHeight = element.offsetHeight || sourceRect.height || preset.heightPx;
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 1,
    width: sourceWidth,
    height: sourceHeight,
    canvasWidth: preset.widthPx,
    canvasHeight: preset.heightPx,
  });

  downloadDataUrl(dataUrl, filename);
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
