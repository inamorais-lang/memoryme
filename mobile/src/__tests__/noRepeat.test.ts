import { describe, expect, it, jest } from '@jest/globals';

import { chooseFresh } from "@/features/draft/noRepeat";

jest.mock("@/lib/kv", () => ({
  kv: { getItem: jest.fn(), setItem: jest.fn() },
}));

describe("chooseFresh", () => {
  it("never repeats until every option was used", () => {
    const options = ["a", "b", "c", "d"];
    let used: string[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const r = chooseFresh(options, used);
      seen.add(r.pick!);
      used = r.used;
    }
    expect(seen.size).toBe(4);
  });

  it("starts again after all were used, without repeating the last one", () => {
    for (let i = 0; i < 20; i++) {
      const r = chooseFresh(["a", "b", "c"], ["a", "b", "c"]);
      expect(r.pick).not.toBe("c");
      expect(r.used).toEqual([r.pick]);
    }
  });

  it("ignores options that no longer exist and copes with one or none", () => {
    expect(chooseFresh(["a", "b"], ["x", "a"]).pick).toBe("b");
    expect(chooseFresh(["a"], ["a"]).pick).toBe("a");
    expect(chooseFresh([], ["a"]).pick).toBeUndefined();
  });
});
