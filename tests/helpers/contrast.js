/**
 * WCAG 2.1 Photometric Contrast and Relative Luminance Utilities
 */

/**
 * Parses a hex color string (#RGB, #RRGGBB).
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
export function parseHex(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculates relative luminance per WCAG 2.1 formula.
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {number}
 */
export function relativeLuminance({ r, g, b }) {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const c = val / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

/**
 * Blends a foreground color with alpha opacity over an opaque background color.
 * @param {{ r: number, g: number, b: number }} fg
 * @param {number} opacity (0 to 1)
 * @param {{ r: number, g: number, b: number }} bg
 * @returns {{ r: number, g: number, b: number }}
 */
export function blendWithOpacity(fg, opacity, bg) {
  const clampAlpha = Math.max(0, Math.min(1, opacity));
  return {
    r: Math.round(fg.r * clampAlpha + bg.r * (1 - clampAlpha)),
    g: Math.round(fg.g * clampAlpha + bg.g * (1 - clampAlpha)),
    b: Math.round(fg.b * clampAlpha + bg.b * (1 - clampAlpha)),
  };
}

/**
 * Computes the WCAG contrast ratio between two colors (order independent).
 * Formula: (L1 + 0.05) / (L2 + 0.05), where L1 >= L2.
 * @param {{ r: number, g: number, b: number } | string} color1
 * @param {{ r: number, g: number, b: number } | string} color2
 * @returns {number}
 */
export function contrastRatio(color1, color2) {
  const c1 = typeof color1 === 'string' ? parseHex(color1) : color1;
  const c2 = typeof color2 === 'string' ? parseHex(color2) : color2;
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculates contrast of a foreground color at given opacity against a background.
 * @param {string | { r: number, g: number, b: number }} fg
 * @param {number} opacity (0.0 to 1.0)
 * @param {string | { r: number, g: number, b: number }} bg
 * @returns {number}
 */
export function contrastAtOpacity(fg, opacity, bg = '#FFFFFF') {
  const fgRgb = typeof fg === 'string' ? parseHex(fg) : fg;
  const bgRgb = typeof bg === 'string' ? parseHex(bg) : bg;
  const blended = blendWithOpacity(fgRgb, opacity, bgRgb);
  return contrastRatio(blended, bgRgb);
}
