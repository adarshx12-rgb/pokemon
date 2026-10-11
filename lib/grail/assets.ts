/** The home page's 3D card faces, built by scripts/build-grail-assets.ts from design-assets/grail/. */
export const GRAIL_FACES = {
  front: '/grail/rayquaza-front-1200.webp',
  back: '/grail/rayquaza-back-1200.webp',
} as const;

/** Pixel size of both faces (official scan ratio 2988×4096). */
export const FACE_SIZE = { width: 1200, height: 1645 } as const;
