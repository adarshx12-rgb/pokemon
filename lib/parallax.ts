/** The layer must be at least this many viewport-heights tall, so it always has room to drift. */
const MIN_HEIGHT_RATIO = 1.3;

/** Size of a fixed background layer showing an image of the given aspect (height / width). */
export function layerSize(viewportW: number, viewportH: number, aspect: number) {
  const width = Math.max(viewportW, (viewportH * MIN_HEIGHT_RATIO) / aspect);
  return { width, height: width * aspect };
}

/**
 * Vertical offset (px, ≤ 0) of the background layer for the current scroll position.
 * It moves at up to `maxFactor` of the scroll speed, slowing on long pages so the
 * layer's bottom edge reaches the viewport bottom exactly at the end of the page.
 */
export function parallaxOffset({ scrollY, docH, viewportH, layerH, maxFactor }: {
  scrollY: number; docH: number; viewportH: number; layerH: number; maxFactor: number;
}): number {
  const scrollable = docH - viewportH;
  const travel = layerH - viewportH;
  if (scrollable <= 0 || travel <= 0) return 0;
  const factor = Math.min(maxFactor, travel / scrollable);
  const offset = Math.min(travel, Math.max(0, scrollY) * factor);
  return offset === 0 ? 0 : -offset;
}
