import { toBlob } from "html-to-image";
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

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
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
  const blob = await toBlob(element, {
    cacheBust: true,
    pixelRatio: 1,
    width: sourceWidth,
    height: sourceHeight,
    canvasWidth: preset.widthPx,
    canvasHeight: preset.heightPx,
  });

  if (!blob) {
    throw new Error("PNG export failed: canvas produced an empty image.");
  }

  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const onIOS = isIOS();
  if (onIOS) {
    link.target = "_blank";
  } else {
    link.download = filename;
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (onIOS) {
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } else {
    URL.revokeObjectURL(url);
  }
}
