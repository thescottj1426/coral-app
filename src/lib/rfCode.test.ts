import { describe, it, expect, vi } from 'vitest';

// rfCode imports @/lib/db, which builds a Pool at import time. Only the pure
// generator is under test here, so the pool never needs to be real.
vi.mock('@/lib/db', () => ({ pool: { query: vi.fn() } }));

const { generateRFCode } = await import('./rfCode');

describe('generateRFCode', () => {
  it('matches the RF-XXXX shape', () => {
    expect(generateRFCode()).toMatch(/^RF-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  });

  // The alphabet deliberately drops characters that are misread off a plug label.
  it('never emits ambiguous characters', () => {
    const codes = Array.from({ length: 2000 }, () => generateRFCode());
    const offenders = codes.filter((c) => /[01OIL]/.test(c.slice(3)));
    expect(offenders).toEqual([]);
  });

  it('always produces the full shape across many draws', () => {
    const bad = Array.from({ length: 2000 }, () => generateRFCode()).filter(
      (c) => !/^RF-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/.test(c)
    );
    expect(bad).toEqual([]);
  });

  it('varies between calls', () => {
    const unique = new Set(Array.from({ length: 200 }, () => generateRFCode()));
    expect(unique.size).toBeGreaterThan(1);
  });
});
