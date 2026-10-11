import { describe, expect, it } from 'vitest';
import { MESH_DEFAULT } from './mesh';
import { grailStore, resetGrailStore } from './store';

describe('resetGrailStore', () => {
  it('returns the mesh to its default and stops the glitter', () => {
    Object.assign(grailStore.mesh, { open: 0.62, height: 1100 });
    grailStore.light = { x: 1, y: 2, r: 3, strength: 1 };
    grailStore.glitter.rate = 0.9;
    grailStore.glitter.emitter = { x: 0, y: 0, w: 1, h: 1, dir: 1 };
    resetGrailStore();
    expect(grailStore.mesh).toEqual(MESH_DEFAULT);
    expect(grailStore.light).toBeNull();
    expect(grailStore.glitter).toEqual({ rate: 0, emitter: null });
  });
  it('never hands out the shared default object itself', () => {
    resetGrailStore();
    expect(grailStore.mesh).not.toBe(MESH_DEFAULT);
  });
});
