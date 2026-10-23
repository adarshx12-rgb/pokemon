const DARK = '#202020';
const LIGHT = '#ffffff';

const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const hex = (rgb: number[]) => `#${rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

function luminance(color: string): number {
  const [r, g, b] = channels(color).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two #rrggbb colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Text colour (dark on light backgrounds, white on dark) with the higher contrast. */
export function readableText(bg: string): string {
  return contrastRatio(bg, DARK) >= contrastRatio(bg, LIGHT) ? DARK : LIGHT;
}

/** Button colours reaching 4.5:1: the better text colour, with the background darkened if neither suffices. */
export function moveButtonColors(bg: string): { background: string; text: string } {
  const text = readableText(bg);
  let background = bg;
  for (let k = 0; contrastRatio(background, text) < 4.5 && k < 20; k++) {
    background = hex(channels(background).map(v => v * 0.92));
  }
  return { background, text };
}
