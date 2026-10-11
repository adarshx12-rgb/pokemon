/** Shape of the two indigo mesh walls. horizon is a fraction of the canvas height. */
export interface MeshShape { open: number; height: number; amp: number; horizon: number }

/** Resting shape, tuned at 1440×900 in the approved mockup. */
export const MESH_DEFAULT: MeshShape = { open: 0.36, height: 1500, amp: 1.6, horizon: 0.52 };
