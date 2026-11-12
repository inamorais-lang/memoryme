import { describe, expect, it } from '@jest/globals';

import { cropWindow, SHARE_ASPECT } from '@/components/TranslationCanvas';

describe('cropWindow (every picture is 4:5)', () => {
  it('keeps a 4:5 picture whole', () => {
    expect(cropWindow(SHARE_ASPECT)).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  });

  it('trims the sides of a wide picture around the head', () => {
    const c = cropWindow(4 / 3, [0.6, 0.2, 0.2, 0.3]);
    expect(c.h).toBe(1);
    expect(c.w).toBeCloseTo(0.6);
    // The head (0.6..0.8) stays inside the window.
    expect(c.x).toBeLessThanOrEqual(0.6);
    expect(c.x + c.w).toBeGreaterThanOrEqual(0.8);
  });

  it('trims the top and bottom of a tall picture, never past the edges', () => {
    const c = cropWindow(9 / 16, [0.3, 0.02, 0.4, 0.2]);
    expect(c.w).toBe(1);
    expect(c.h).toBeCloseTo((9 / 16) / SHARE_ASPECT);
    expect(c.y).toBe(0);
  });
});
