import { toPng } from "html-to-image";
import type { ExportPreset } from "./presets";

export async function exportElementAsPng(
  element: HTMLElement,
  preset: ExportPreset,
  filename: string,
): Promise<void> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 1,
    width: preset.widthPx,
    height: preset.heightPx,
    style: {
      width: `${preset.widthPx}px`,
      height: `${preset.heightPx}px`,
    },
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
