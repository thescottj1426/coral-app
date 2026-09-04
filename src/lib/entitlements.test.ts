import { describe, it, expect } from 'vitest';
import { specimenCapFor, FREE_SPECIMEN_CAP, type PlanContext } from './entitlements';

const user = (over: Partial<PlanContext> = {}): PlanContext => ({
  id: 'u1',
  plan: 'FREE',
  capExempt: false,
  ...over,
});

describe('specimenCapFor', () => {
  it('caps a free, non-exempt user', () => {
    expect(specimenCapFor(user())).toBe(FREE_SPECIMEN_CAP);
  });

  it('does not cap a COLLECTOR', () => {
    expect(specimenCapFor(user({ plan: 'COLLECTOR' }))).toBeNull();
  });

  it('does not cap an exempt user', () => {
    expect(specimenCapFor(user({ capExempt: true }))).toBeNull();
  });

  it('does not cap an exempt COLLECTOR', () => {
    expect(specimenCapFor(user({ plan: 'COLLECTOR', capExempt: true }))).toBeNull();
  });

  // Infinity does not survive the RSC boundary — unlimited must be null.
  it('signals unlimited as null, never Infinity', () => {
    const unlimited = specimenCapFor(user({ plan: 'COLLECTOR' }));
    expect(unlimited).toBeNull();
    expect(unlimited).not.toBe(Infinity);
  });
});

// Not covered: the `FREE_CAP_ENABLED_AT === null` branch (cap disabled entirely).
// It reads a module-level const that specimenCapFor closes over, so no argument
// can reach it and mocking the export would only assert against the mock.
// Covering it honestly would mean making the flag a parameter — a source change
// deliberately out of scope here.
