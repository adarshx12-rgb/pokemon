import { MESH_DEFAULT, type MeshLight, type MeshShape } from './mesh';
import type { Emitter } from './particles';

/**
 * Per-frame state written by GrailSequence and read by MeshBackground and GlitterCanvas in their
 * animation loops. A plain mutable object on purpose: it changes every frame and must not re-render React.
 */
export const grailStore = {
  mesh: { ...MESH_DEFAULT } as MeshShape,
  light: null as MeshLight | null,
  glitter: { rate: 0, emitter: null as Emitter | null },
};

/** Called when the home sequence unmounts, so other pages get the resting mesh and no glitter. */
export function resetGrailStore(): void {
  Object.assign(grailStore.mesh, MESH_DEFAULT);
  grailStore.light = null;
  grailStore.glitter.rate = 0;
  grailStore.glitter.emitter = null;
}
