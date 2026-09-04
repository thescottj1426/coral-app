import { describe, it, expect } from 'vitest';
import { coralIdentityGradient } from './theme';

const GRADIENT = /^linear-gradient\(135deg, oklch\(0\.76 0\.11 (\d+)\), oklch\(0\.5 0\.13 (\d+)\)\)$/;

describe('coralIdentityGradient', () => {
  it('produces the expected gradient shape', () => {
    expect(coralIdentityGradient('RF-ABCD')).toMatch(GRADIENT);
  });

  // The tile stands in for a photo, so a coral must not change appearance
  // between renders.
  it('is deterministic for the same code', () => {
    expect(coralIdentityGradient('RF-ABCD')).toBe(coralIdentityGradient('RF-ABCD'));
  });

  it('uses the same hue in both stops', () => {
    const [, first, second] = GRADIENT.exec(coralIdentityGradient('RF-WXYZ'))!;
    expect(first).toBe(second);
  });

  it('keeps the hue within 0-359', () => {
    for (const code of ['RF-ABCD', 'RF-2345', 'RF-ZZZZ', 'RF-JKMN', '']) {
      const [, hue] = GRADIENT.exec(coralIdentityGradient(code))!;
      expect(Number(hue)).toBeGreaterThanOrEqual(0);
      expect(Number(hue)).toBeLessThan(360);
    }
  });

  it('generally differs between codes', () => {
    const codes = ['RF-ABCD', 'RF-EFGH', 'RF-JKMN', 'RF-PQRS', 'RF-TUVW'];
    const unique = new Set(codes.map(coralIdentityGradient));
    expect(unique.size).toBeGreaterThan(1);
  });

  it('handles an empty code without throwing', () => {
    expect(coralIdentityGradient('')).toMatch(GRADIENT);
  });
});
