import { toPng } from "html-to-image";
import type { ExportPreset } from "./presets";

export async function exportElementAsPng(
  element: HTMLElement,
  preset: ExportPreset,
  filename: string,
): Promise<void> {
  const sourceRect = element.getBoundingClientRect();
  const sourceWidth = element.offsetWidth || sourceRect.width || preset.widthPx;
  const sourceHeight = element.offsetHeight || sourceRect.height || preset.heightPx;
  const dataUrl = await toPng(element, {
    cacheBust: false,
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
