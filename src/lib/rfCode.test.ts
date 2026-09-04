import { describe, it, expect, vi, beforeEach } from 'vitest';

// rfCode imports @/lib/db, which builds a Pool at import time. The generator
// never touches it; uniqueRFCode does, so the mock stands in for the DB.
const query = vi.fn();
vi.mock('@/lib/db', () => ({ pool: { query: (...args: unknown[]) => query(...args) } }));

const { generateRFCode, uniqueRFCode } = await import('./rfCode');

/** No row means the code is free; a row means it is taken. */
const free = () => ({ rows: [] });
const taken = () => ({ rows: [{ 1: 1 }] });

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

describe('uniqueRFCode', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('returns the first code when it is free', async () => {
    query.mockResolvedValue(free());
    expect(await uniqueRFCode()).toMatch(/^RF-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('retries past a taken code', async () => {
    query.mockResolvedValueOnce(taken()).mockResolvedValueOnce(free());
    await expect(uniqueRFCode()).resolves.toMatch(/^RF-/);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('checks the code it is about to return', async () => {
    query.mockResolvedValue(free());
    const code = await uniqueRFCode();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('rfCode'), [code]);
  });

  // Ten collisions in a row means something is wrong; failing loudly beats
  // handing back a duplicate rfCode, which is UNIQUE in the schema.
  it('throws after 10 collisions', async () => {
    query.mockResolvedValue(taken());
    await expect(uniqueRFCode()).rejects.toThrow(/could not generate a unique rf code/i);
    expect(query).toHaveBeenCalledTimes(10);
  });

  it('succeeds on the tenth attempt', async () => {
    for (let i = 0; i < 9; i++) query.mockResolvedValueOnce(taken());
    query.mockResolvedValueOnce(free());
    await expect(uniqueRFCode()).resolves.toMatch(/^RF-/);
    expect(query).toHaveBeenCalledTimes(10);
  });
});
