import { describe, it, expect, vi, beforeEach } from 'vitest';

const query = vi.fn();
vi.mock('@/lib/db', () => ({ pool: { query: (...args: unknown[]) => query(...args) } }));

import {
  specimenCapFor,
  checkSpecimenCap,
  FREE_SPECIMEN_CAP,
  type PlanContext,
} from './entitlements';

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

describe('checkSpecimenCap', () => {
  beforeEach(() => {
    query.mockReset();
  });

  const aliveCount = (n: number) => query.mockResolvedValue({ rows: [{ n }] });

  it('allows a free user below the cap', async () => {
    aliveCount(FREE_SPECIMEN_CAP - 1);
    expect(await checkSpecimenCap(user())).toEqual({ ok: true });
  });

  it('blocks a free user at the cap', async () => {
    aliveCount(FREE_SPECIMEN_CAP);
    const res = await checkSpecimenCap(user());
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.error).toContain(String(FREE_SPECIMEN_CAP));
  });

  it('blocks a free user above the cap', async () => {
    aliveCount(FREE_SPECIMEN_CAP + 10);
    expect((await checkSpecimenCap(user())).ok).toBe(false);
  });

  // An uncapped user should never pay for the COUNT query.
  it('short-circuits for a COLLECTOR without querying', async () => {
    expect(await checkSpecimenCap(user({ plan: 'COLLECTOR' }))).toEqual({ ok: true });
    expect(query).not.toHaveBeenCalled();
  });

  it('short-circuits for an exempt user without querying', async () => {
    expect(await checkSpecimenCap(user({ capExempt: true }))).toEqual({ ok: true });
    expect(query).not.toHaveBeenCalled();
  });

  it('counts only the requesting user', async () => {
    aliveCount(0);
    await checkSpecimenCap(user({ id: 'user-42' }));
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ownerId'), ['user-42']);
  });

  // Lost/sold corals stay in the lineage but must not consume a slot.
  it('counts only ALIVE corals', async () => {
    aliveCount(0);
    await checkSpecimenCap(user());
    expect(query.mock.calls[0][0]).toContain("status = 'ALIVE'");
  });
});

// Not covered: the `FREE_CAP_ENABLED_AT === null` branch (cap disabled entirely).
// It reads a module-level const that specimenCapFor closes over, so no argument
// can reach it and mocking the export would only assert against the mock.
// Covering it honestly would mean making the flag a parameter — a source change
// deliberately out of scope here.
