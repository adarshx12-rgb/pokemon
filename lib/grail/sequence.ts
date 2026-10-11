import { MESH_DEFAULT, type MeshShape } from './mesh';

/**
 * Scroll choreography for the home "grail" section. p runs 0→1 across the pinned scroll.
 * Pure (no DOM) so every stage boundary can be tested; GrailSequence applies the results.
 */
export const BOUNDS = { welcome: 0.04, toGrail: 0.24, grail: 0.3, turn: 0.74 } as const;
/** The flying card crossfades into the real Vault door card over [HANDOFF, 1]. */
export const HANDOFF = 0.98;

export type Stage = 'welcome' | 'toGrail' | 'grail' | 'turn' | 'doors';
export interface Rect { left: number; top: number; width: number; height: number }
export interface Pose { rx: number; ry: number; rz: number; skew: number; scale: number; x: number; y: number; opacity: number }

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0→1 as p goes a→b, clamped. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** Smooth velocity and acceleration at both ends, including when scrolling in reverse. */
export const easeInOut = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const easedSeg = (p: number, a: number, b: number) => easeInOut(seg(p, a, b));
const rad = (deg: number) => (deg * Math.PI) / 180;

export function stageAt(p: number): Stage {
  if (p < BOUNDS.welcome) return 'welcome';
  if (p < BOUNDS.toGrail) return 'toGrail';
  if (p < BOUNDS.grail) return 'grail';
  if (p < BOUNDS.turn) return 'turn';
  return 'doors';
}

/** Rotation about Y added on top of the resting tilt: one full eased turn. */
export function spinAngle(p: number): number {
  return 360 * easeInOut(seg(p, BOUNDS.grail, BOUNDS.turn));
}

const REST = { rx: 10, ry: -24, rz: -5 };
/** Matches the .vaultCard tilt in grail.module.css. */
const DOOR_TILT = { rx: 0, ry: 14, rz: -2 };
const centre = (r: Rect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/** Pose of the flying card. home is its resting box and door the Vault door's card box, in the same coordinates. */
export function cardPose(p: number, home: Rect, door: Rect): Pose {
  const a = rad(spinAngle(p));
  const turn = Math.abs(Math.sin(a));
  const enter = easedSeg(p, BOUNDS.welcome + 0.04, BOUNDS.toGrail);
  const fly = easeInOut(seg(p, BOUNDS.turn, 1));
  const hc = centre(home);
  const dc = centre(door);
  return {
    rx: lerp(REST.rx - 8 * turn, DOOR_TILT.rx, fly),
    // Keep turning the same way into the door tilt (336° → 374°) instead of unwinding.
    ry: lerp(REST.ry + spinAngle(p), 360 + DOOR_TILT.ry, fly),
    rz: lerp(REST.rz + 10 * Math.sin(a / 2), DOOR_TILT.rz, fly),
    skew: -5 * Math.sin(a) * (1 - fly),
    scale: lerp(0.92, 1, enter) * lerp(1, door.width / home.width, fly),
    x: lerp(0, dc.x - hc.x, fly),
    y: lerp(0, dc.y - hc.y, fly),
    opacity: enter * (1 - easedSeg(p, HANDOFF, 1)),
  };
}

export function poseTransform(pose: Pose): string {
  return `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale}) rotateX(${pose.rx}deg) rotateZ(${pose.rz}deg) rotateY(${pose.ry}deg) skewY(${pose.skew}deg)`;
}

/** Light band across the card face: slides with the angle, brightest edge-on. */
export function glintStyle(p: number): { x: number; opacity: number } {
  const a = spinAngle(p);
  return { x: -60 + ((a % 180) / 180) * 120, opacity: 0.35 + 0.65 * Math.abs(Math.sin(rad(a))) };
}

export function welcomeStyle(p: number): { opacity: number; y: number } {
  // Clear the large outgoing letters before the incoming headline becomes readable.
  // The card continues appearing through this handoff, so the stage never goes empty.
  const out = easedSeg(p, BOUNDS.welcome, BOUNDS.toGrail - 0.08);
  return { opacity: 1 - out, y: lerp(0, -36, out) };
}

export function headlineStyle(p: number): { opacity: number; scale: number; y: number } {
  const enter = easedSeg(p, BOUNDS.welcome + 0.06, BOUNDS.toGrail);
  const t = easedSeg(p, BOUNDS.grail, BOUNDS.turn);
  const out = easedSeg(p, BOUNDS.turn, BOUNDS.turn + 0.1);
  return { opacity: enter * lerp(1, 0.2, t) * (1 - out), scale: lerp(1, 1.1, t), y: lerp(32, 0, enter) };
}

/** Meta lines, "GOLD STAR" copy, price and side label of the grail screen. */
export function grailCopyOpacity(p: number): number {
  return easedSeg(p, 0.14, BOUNDS.toGrail) * (1 - easedSeg(p, BOUNDS.grail, BOUNDS.grail + 0.06));
}

/** Dissolve captions around their boundaries instead of swapping them on a single frame. */
export function captionOpacity(p: number, index: number): number {
  const span = (BOUNDS.turn - BOUNDS.grail) / 3;
  const start = BOUNDS.grail + index * span;
  const end = start + span;
  const fade = 0.025;
  const enter = index === 0
    ? easedSeg(p, start, start + 0.06)
    : easedSeg(p, start - fade, start + fade);
  const exit = index === 2
    ? easedSeg(p, end - fade, end)
    : easedSeg(p, end - fade, end + fade);
  return enter * (1 - exit);
}

export function captionAt(p: number): -1 | 0 | 1 | 2 {
  if (stageAt(p) !== 'turn') return -1;
  return Math.min(2, Math.floor(seg(p, BOUNDS.grail, BOUNDS.turn) * 3)) as 0 | 1 | 2;
}

export function ruleStyle(p: number): { opacity: number; fill: number } {
  return {
    opacity: easedSeg(p, BOUNDS.grail, BOUNDS.grail + 0.03) * (1 - easedSeg(p, BOUNDS.turn, BOUNDS.turn + 0.04)),
    fill: seg(p, BOUNDS.grail, BOUNDS.turn),
  };
}

export function doorsStyle(p: number) {
  const title = easedSeg(p, 0.8, 0.92);
  return {
    titleOpacity: title,
    titleY: lerp(40, 0, title),
    showdownOpacity: easedSeg(p, 0.78, 0.9),
    showdownX: lerp(64, 0, easedSeg(p, 0.78, 0.95)),
    doorCardOpacity: easedSeg(p, HANDOFF, 1),
  };
}

/** 0–1 emission strength: a light dusting at rest, peaking while the card is edge-on and turning fast. */
export function glitterRate(p: number): number {
  switch (stageAt(p)) {
    case 'welcome': return 0;
    case 'toGrail': return 0.15 * seg(p, BOUNDS.welcome, BOUNDS.toGrail);
    case 'grail': return 0.15;
    case 'turn': {
      const t = seg(p, BOUNDS.grail, BOUNDS.turn);
      const speed = 1 - Math.abs(2 * t - 1); // easeInOut turns fastest mid-way
      const edge = Math.abs(Math.sin(rad(spinAngle(p))));
      return 0.15 + 0.85 * edge * (0.4 + 0.6 * speed);
    }
    default: return lerp(0.15, 0.05, seg(p, BOUNDS.turn, 1));
  }
}

const MESH_TURN: MeshShape = { open: 0.42, height: 1300, amp: 2.2, horizon: 0.5 };
const MESH_DOORS: MeshShape = { open: 0.62, height: 1100, amp: 1.2, horizon: 0.62 };

export function meshShape(p: number): MeshShape {
  const into = Math.sin(Math.PI * easedSeg(p, BOUNDS.grail, BOUNDS.turn)); // 0 → 1 → 0 across the turn
  const out = easeInOut(seg(p, BOUNDS.turn, 1));
  const mix = (k: keyof MeshShape) => lerp(lerp(MESH_DEFAULT[k], MESH_TURN[k], into), MESH_DOORS[k], out);
  return { open: mix('open'), height: mix('height'), amp: mix('amp'), horizon: mix('horizon') };
}

/** Strength of the gold light the card casts on nearby mesh dots. */
export function meshLightStrength(p: number): number {
  switch (stageAt(p)) {
    case 'welcome': return 0;
    case 'toGrail': return 0.5 * seg(p, BOUNDS.welcome, BOUNDS.toGrail);
    case 'grail': return 0.5;
    case 'turn': return 0.5 + 0.5 * Math.sin(Math.PI * seg(p, BOUNDS.grail, BOUNDS.turn));
    default: return lerp(0.5, 0.6, seg(p, BOUNDS.turn, 1));
  }
}
