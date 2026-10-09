import { describe, it, expect } from 'vitest';
import { eventDelay, CHAR_MS, READ_PAUSE_MS } from './pacing';

describe('eventDelay', () => {
  it('uses the event duration when the message types out in time', () => {
    expect(eventDelay('useMove', 'Go!', 1)).toBe(900);
  });
  it('waits for a long message to finish typing plus a reading pause', () => {
    const msg = 'Enemy CHARIZARD used FLAMETHROWER!';
    expect(eventDelay('useMove', msg, 1)).toBe(msg.length * CHAR_MS + READ_PAUSE_MS);
  });
  it('scales with speed', () => {
    const msg = 'Enemy CHARIZARD used FLAMETHROWER!';
    expect(eventDelay('useMove', msg, 4)).toBe((msg.length * CHAR_MS + READ_PAUSE_MS) / 4);
  });
});
