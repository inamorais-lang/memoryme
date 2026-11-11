import { describe, expect, it } from '@jest/globals';

import { bestSpot, overlap, trailDots, type Box } from '@/components/balloonLayout';

const W = 360;
const H = 480;
const bubble = { w: 245, h: 90 };
const corners = (m = 10): Box[] => [
  { x: m, y: m, ...bubble },
  { x: W - bubble.w - m, y: m, ...bubble },
  { x: W - bubble.w - m, y: H - bubble.h - m, ...bubble },
  { x: m, y: H - bubble.h - m, ...bubble },
];

describe('bestSpot', () => {
  it('keeps the balloon off a head at the top', () => {
    const head: Box = { x: 100, y: 20, w: 160, h: 160 };
    const i = bestSpot(corners(), head);
    expect(i === 2 || i === 3).toBe(true);
    expect(overlap(corners()[i], head)).toBe(0);
  });

  it('prefers the corner farthest from a head on one side', () => {
    const head: Box = { x: 230, y: 120, w: 120, h: 120 };
    expect(bestSpot(corners(), head)).toBe(3);
  });

  it('keeps the first corner (top-left) when the head is low and centred', () => {
    expect(bestSpot(corners(), { x: 130, y: 260, w: 100, h: 100 })).toBe(0);
  });
});

describe('trailDots', () => {
  const head: Box = { x: 140, y: 200, w: 120, h: 120 };
  const top: Box = { x: 10, y: 10, ...bubble };

  it('draws 3 dots, biggest first, all outside the head', () => {
    const dots = trailDots(top, head, [20, 13, 8], 1);
    expect(dots.map((d) => d.size)).toEqual([20, 13, 8]);
    for (const d of dots) {
      const r = d.size / 2;
      const dot = { x: d.cx - r, y: d.cy - r, w: d.size, h: d.size };
      expect(overlap(dot, head)).toBe(0);
    }
  });

  it('shrinks the dots when there is little room', () => {
    const near: Box = { x: 10, y: 115, ...bubble };
    const dots = trailDots(near, { x: 140, y: 250, w: 120, h: 120 }, [20, 13, 8], 1);
    expect(dots.length).toBe(3);
    expect(dots[0].size).toBeLessThan(20);
  });

  it('draws no dots when the balloon sits on the face', () => {
    expect(trailDots({ x: 120, y: 220, ...bubble }, head, [20, 13, 8], 1)).toEqual([]);
  });
});
