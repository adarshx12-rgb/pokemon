import { describe, expect, it } from 'vitest';
import { MESH_DEFAULT } from './mesh';
import {
  BOUNDS, HANDOFF, captionAt, cardPose, doorsStyle, glitterRate, grailCopyOpacity, headlineStyle,
  meshShape, poseTransform, spinAngle, stageAt, welcomeStyle, type Rect,
} from './sequence';

const home: Rect = { left: 565, top: 268, width: 310, height: 425 };
const door: Rect = { left: 490, top: 205, width: 270, height: 370 };
const mod360 = (a: number) => ((a % 360) + 360) % 360;
const samples = (from: number, to: number, n = 400) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);

describe('stageAt', () => {
  it('splits progress at the spec boundaries', () => {
    expect(stageAt(0)).toBe('welcome');
    expect(stageAt(BOUNDS.welcome)).toBe('toGrail');
    expect(stageAt(0.25)).toBe('grail');
    expect(stageAt(0.5)).toBe('turn');
    expect(stageAt(BOUNDS.turn)).toBe('doors');
    expect(stageAt(1)).toBe('doors');
  });
});

describe('spinAngle', () => {
  it('is 0 before the turn, 360 after it, and never goes backwards', () => {
    expect(spinAngle(0.25)).toBe(0);
    expect(spinAngle(0.8)).toBe(360);
    const angles = samples(BOUNDS.grail, BOUNDS.turn).map(spinAngle);
    angles.slice(1).forEach((a, i) => expect(a).toBeGreaterThanOrEqual(angles[i]));
  });
});

describe('cardPose', () => {
  it('is hidden on the welcome screen', () => {
    expect(cardPose(0, home, door).opacity).toBe(0);
  });
  it('rests at its home tilt on the grail screen', () => {
    const pose = cardPose(0.25, home, door);
    expect(pose).toMatchObject({ rx: 10, ry: -24, rz: -5, x: 0, y: 0, scale: 1, opacity: 1 });
    expect(pose.skew).toBeCloseTo(0);
  });
  it('lands on the Vault door at p = 1, at the door tilt and size', () => {
    const pose = cardPose(1, home, door);
    expect(pose.x).toBeCloseTo(door.left + door.width / 2 - (home.left + home.width / 2));
    expect(pose.y).toBeCloseTo(door.top + door.height / 2 - (home.top + home.height / 2));
    expect(pose.scale).toBeCloseTo(door.width / home.width);
    expect(mod360(pose.ry)).toBeCloseTo(14);
    expect(pose.rz).toBeCloseTo(-2);
    expect(pose.rx).toBeCloseTo(0);
  });
  it('hands off to the door card over the last 2% with no gap or double image', () => {
    for (const p of samples(HANDOFF, 1, 20)) {
      expect(cardPose(p, home, door).opacity + doorsStyle(p).doorCardOpacity).toBeCloseTo(1);
    }
    expect(cardPose(1, home, door).opacity).toBe(0);
    expect(doorsStyle(1).doorCardOpacity).toBe(1);
  });
});

describe('poseTransform', () => {
  it('translates, scales, then rotates X, Z, Y and skews, in that order', () => {
    expect(poseTransform({ rx: 1, ry: 2, rz: 3, skew: 4, scale: 0.5, x: 6, y: 7, opacity: 1 }))
      .toBe('translate3d(6px, 7px, 0) scale(0.5) rotateX(1deg) rotateZ(3deg) rotateY(2deg) skewY(4deg)');
  });
});

describe('glitterRate', () => {
  it('is zero on the welcome screen and never above 1', () => {
    expect(glitterRate(0)).toBe(0);
    for (const p of samples(0, 1)) expect(glitterRate(p)).toBeLessThanOrEqual(1);
  });
  it('peaks while the card is edge-on, not face-on', () => {
    const turn = samples(BOUNDS.grail, BOUNDS.turn);
    const peak = turn.reduce((best, p) => (glitterRate(p) > glitterRate(best) ? p : best));
    const angle = mod360(spinAngle(peak));
    expect(Math.min(Math.abs(angle - 90), Math.abs(angle - 270))).toBeLessThan(25);
    const backFaceOn = turn.find(p => spinAngle(p) >= 180)!;
    expect(glitterRate(backFaceOn)).toBeLessThan(glitterRate(peak) / 2);
  });
});

describe('captions and copy', () => {
  it('shows captions 0, 1, 2 in order through the turn only', () => {
    expect(captionAt(0.25)).toBe(-1);
    expect(captionAt(0.31)).toBe(0);
    expect(captionAt(0.52)).toBe(1);
    expect(captionAt(0.73)).toBe(2);
    expect(captionAt(0.8)).toBe(-1);
  });
  it('fades the welcome out and the headline in, then the headline out at the doors', () => {
    expect(welcomeStyle(0).opacity).toBe(1);
    expect(welcomeStyle(BOUNDS.toGrail).opacity).toBe(0);
    expect(headlineStyle(0).opacity).toBe(0);
    expect(headlineStyle(0.25).opacity).toBe(1);
    expect(headlineStyle(0.9).opacity).toBe(0);
  });
  it('shows the grail copy only on the grail screen', () => {
    expect(grailCopyOpacity(0)).toBe(0);
    expect(grailCopyOpacity(0.25)).toBe(1);
    expect(grailCopyOpacity(0.5)).toBe(0);
  });
});

describe('meshShape', () => {
  it('starts at the default shape and ends pulled back to the edges', () => {
    expect(meshShape(0)).toEqual(MESH_DEFAULT);
    expect(meshShape(1).open).toBeCloseTo(0.62);
  });
});
