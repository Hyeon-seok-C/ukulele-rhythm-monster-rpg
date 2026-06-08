/**
 * @param {HTMLImageElement} img
 * @param {{ sheetWidth: number, sheetHeight: number, chromaKey: { r: number, g: number, b: number } }} sheet
 * @param {number} [threshold]
 */
export function chromaKeySpriteSheet(img, sheet, threshold = 95) {
  const { sheetWidth, sheetHeight, chromaKey } = sheet;
  const canvas = document.createElement('canvas');
  canvas.width = sheetWidth;
  canvas.height = sheetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, sheetWidth, sheetHeight);
  const imageData = ctx.getImageData(0, 0, sheetWidth, sheetHeight);
  const { r: kr, g: kg, b: kb } = chromaKey;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const dist = Math.abs(r - kr) + Math.abs(g - kg) + Math.abs(b - kb);
    if (dist < threshold) imageData.data[i + 3] = 0;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * 단일 PNG 배경 제거 (2인 대결 상대 등)
 * @param {HTMLImageElement} img
 * @param {{ r: number, g: number, b: number }} chromaKey
 * @param {number} [threshold]
 */
export function chromaKeyImage(img, chromaKey, threshold = 85) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { r: kr, g: kg, b: kb } = chromaKey;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const dist = Math.abs(r - kr) + Math.abs(g - kg) + Math.abs(b - kb);
    if (dist < threshold) imageData.data[i + 3] = 0;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * @param {{ sheetWidth: number, sheetHeight: number, frameCount: number, displayHeight: number }} sheet
 */
export function getSpriteDisplaySize(sheet) {
  const frameW = sheet.sheetWidth / sheet.frameCount;
  const scale = sheet.displayHeight / sheet.sheetHeight;
  return {
    width: Math.round(frameW * scale),
    height: sheet.displayHeight,
  };
}

/**
 * @param {{ sheetWidth: number, sheetHeight: number, columns?: number, rows?: number, frameCount?: number, displayHeight: number }} sheet
 */
export function getGridSpriteDisplaySize(sheet) {
  const cols = sheet.columns ?? sheet.frameCount ?? 1;
  const rows = sheet.rows ?? 1;
  const frameW = sheet.sheetWidth / cols;
  const frameH = sheet.sheetHeight / rows;
  const scale = sheet.displayHeight / frameH;
  return {
    width: Math.round(frameW * scale),
    height: sheet.displayHeight,
  };
}

/**
 * @param {{ columns?: number, rows?: number, frameCount?: number }} sheet
 * @param {number} frameIndex
 */
export function gridFramePosition(sheet, frameIndex) {
  const cols = sheet.columns ?? sheet.frameCount ?? 1;
  const rows = sheet.rows ?? 1;
  return {
    col: frameIndex % cols,
    row: Math.floor(frameIndex / cols),
    cols,
    rows,
  };
}

/** @typedef {{ x: number, y: number, w: number, h: number }} SpriteRegion */

/**
 * @param {HTMLImageElement} img
 * @param {number} [sampleSize=12]
 */
export function imageHasTransparentBackground(img, sampleSize = 12) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.drawImage(img, 0, 0);
  const { width, height } = canvas;
  let transparent = 0;
  let total = 0;
  const step = Math.max(1, Math.floor(Math.min(width, height) / sampleSize));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (x === 0 || y === 0 || x >= width - step || y >= height - step) {
        total += 1;
        if (ctx.getImageData(x, y, 1, 1).data[3] < 16) transparent += 1;
      }
    }
  }
  return total > 0 && transparent / total > 0.35;
}

/**
 * 가장자리에서만 배경색을 투명 처리 (캐릭터 검은 옷/피부는 유지)
 * @param {HTMLImageElement} img
 * @param {number} width
 * @param {number} height
 * @param {number} [tolerance]
 */
export function removeBorderBackground(img, width, height, tolerance = 45) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const px = imageData.data;
  const w = width;
  const h = height;
  const visited = new Uint8Array(w * h);

  /** @param {number} x @param {number} y */
  function sample(x, y) {
    const i = (y * w + x) * 4;
    return [px[i], px[i + 1], px[i + 2]];
  }

  /** @param {number[]} a @param {number[]} b */
  function near(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < tolerance;
  }

  const bg = sample(0, 0);
  /** @type {[number, number][]} */
  const queue = [];

  for (let x = 0; x < w; x += 1) {
    queue.push([x, 0], [x, h - 1]);
  }
  for (let y = 0; y < h; y += 1) {
    queue.push([0, y], [w - 1, y]);
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const id = y * w + x;
    if (visited[id]) continue;
    if (!near(sample(x, y), bg)) continue;
    visited[id] = 1;
    px[id * 4 + 3] = 0;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * @param {SpriteRegion} region
 * @param {number} displayHeight
 */
export function getRegionDisplaySize(region, displayHeight) {
  const scale = displayHeight / region.h;
  return {
    width: Math.round(region.w * scale),
    height: displayHeight,
    scale,
  };
}

/**
 * @param {HTMLImageElement} img
 * @param {{ sheetWidth: number, sheetHeight: number, regions: Record<string, SpriteRegion> }} sheet
 * @param {string} stateKey
 * @param {number} displayHeight
 */
export function applyRegionFrame(img, sheet, stateKey, displayHeight) {
  const region = sheet.regions[stateKey] ?? sheet.regions.IDLE;
  const { width, height, scale } = getRegionDisplaySize(region, displayHeight);
  const viewport = img.parentElement;

  img.style.width = `${Math.round(sheet.sheetWidth * scale)}px`;
  img.style.height = `${Math.round(sheet.sheetHeight * scale)}px`;
  img.style.left = `${Math.round(-region.x * scale)}px`;
  img.style.top = `${Math.round(-region.y * scale)}px`;

  if (viewport) {
    viewport.style.width = `${width}px`;
    viewport.style.height = `${height}px`;
  }
}
