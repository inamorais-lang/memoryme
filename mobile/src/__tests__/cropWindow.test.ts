import { describe, expect, it } from '@jest/globals';

import { cropWindow, SHARE_ASPECT } from '@/components/TranslationCanvas';

describe('cropWindow (every picture is 2:3)', () => {
  it('keeps a 2:3 picture whole', () => {
    expect(cropWindow(SHARE_ASPECT)).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  });

  it('trims the sides of a wide picture around the head', () => {
    const c = cropWindow(4 / 3, [0.6, 0.2, 0.2, 0.3]);
    expect(c.h).toBe(1);
    expect(c.w).toBeCloseTo(0.5);
    // The head (0.6..0.8) stays inside the window.
    expect(c.x).toBeLessThanOrEqual(0.6);
    expect(c.x + c.w).toBeGreaterThanOrEqual(0.8);
  });

  it('keeps the top of a tall picture (room for the balloon) and trims below the head', () => {
    const c = cropWindow(9 / 16, [0.3, 0.3, 0.4, 0.25]);
    expect(c.w).toBe(1);
    expect(c.h).toBeCloseTo((9 / 16) / SHARE_ASPECT);
    expect(c.y).toBe(0);
  });

  it('moves down only as much as needed when the head is low', () => {
    const c = cropWindow(9 / 16, [0.3, 0.75, 0.4, 0.2]);
    // The head (0.75..0.95) stays inside the window.
    expect(c.y + c.h).toBeGreaterThanOrEqual(0.95);
  });
});
