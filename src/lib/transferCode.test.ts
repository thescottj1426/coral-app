import { describe, it, expect } from 'vitest';
import {
  generateTransferCode,
  normalizeTransferCode,
  hashTransferCode,
  looksLikeTransferCode,
} from './transferCode';

describe('generateTransferCode', () => {
  it('uses the REEF-XXXX-XXXX format with no ambiguous characters', () => {
    for (let i = 0; i < 500; i++) {
      expect(generateTransferCode()).toMatch(/^REEF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    }
  });

  it('does not repeat', () => {
    const codes = new Set(Array.from({ length: 1000 }, generateTransferCode));
    expect(codes.size).toBe(1000);
  });
});

describe('normalizeTransferCode', () => {
  it('accepts lowercase, spaces and missing dashes', () => {
    expect(normalizeTransferCode('reef-abcd-efgh')).toBe('REEF-ABCD-EFGH');
    expect(normalizeTransferCode(' REEF ABCD EFGH ')).toBe('REEF-ABCD-EFGH');
    expect(normalizeTransferCode('ABCDEFGH')).toBe('REEF-ABCD-EFGH');
  });

  it('rejects wrong lengths and ambiguous characters', () => {
    expect(normalizeTransferCode('REEF-ABC-EFGH')).toBeNull();
    expect(normalizeTransferCode('REEF-ABCD-EFG0')).toBeNull();
    expect(normalizeTransferCode('RF-ABCD')).toBeNull();
    expect(normalizeTransferCode('')).toBeNull();
  });
});

describe('hashTransferCode', () => {
  it('is stable and never the code itself', () => {
    expect(hashTransferCode('REEF-ABCD-EFGH')).toBe(hashTransferCode('REEF-ABCD-EFGH'));
    expect(hashTransferCode('REEF-ABCD-EFGH')).not.toContain('ABCD');
  });
});

describe('looksLikeTransferCode', () => {
  it('tells transfer codes from RF codes', () => {
    expect(looksLikeTransferCode('REEF-ABCD-EFGH')).toBe(true);
    expect(looksLikeTransferCode('reef')).toBe(true);
    expect(looksLikeTransferCode('RF-ABCD')).toBe(false);
  });
});
