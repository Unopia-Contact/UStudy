export interface CoverCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getCoverCrop(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number): CoverCrop {
  if ([sourceWidth, sourceHeight, targetWidth, targetHeight].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error('Invalid background image dimensions');
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;
  if (sourceRatio > targetRatio) {
    const width = sourceHeight * targetRatio;
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight };
  }

  const height = sourceWidth / targetRatio;
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height };
}

export async function prepareBackgroundForExport(image: HTMLImageElement, width: number, height: number): Promise<string> {
  if (!image.complete) await image.decode();
  const crop = getCoverCrop(image.naturalWidth, image.naturalHeight, width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}
