import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testPool, truncateAll, TEST_DATABASE_URL } from './db';
import { assertDisposableDatabase } from './guard';
import { seedUser, seedCoral, resetSequence } from './factories';

describe('feature harness', () => {
  beforeEach(async () => {
    await truncateAll();
    resetSequence();
  });

  afterAll(async () => {
    await testPool.end();
  });

  // CI cuts a fresh branch per run, so the endpoint cannot be pinned. What
  // matters is that the guard let this connection through — every protected
  // endpoint would have thrown before any test ran.
  it('is pointed at a database the guard accepts', () => {
    expect(assertDisposableDatabase(TEST_DATABASE_URL)).toBe(TEST_DATABASE_URL);
  });

  it('starts each test with empty owned tables', async () => {
    const { rows } = await testPool.query<{ n: string }>(
      'SELECT (SELECT COUNT(*) FROM public."Coral")::text AS n'
    );
    expect(rows[0].n).toBe('0');
  });

  it('seeds a user and a coral', async () => {
    const owner = await seedUser();
    const coral = await seedCoral({ ownerId: owner.id, name: 'Smoke' });

    const { rows } = await testPool.query<{ name: string; ownerId: string }>(
      'SELECT name, "ownerId" FROM public."Coral" WHERE id = $1',
      [coral.id]
    );
    expect(rows[0]).toEqual({ name: 'Smoke', ownerId: owner.id });
  });

  it('has the CoralOwnershipEvent table the audit trail needs', async () => {
    const { rows } = await testPool.query<{ t: string | null }>(
      `SELECT to_regclass('public."CoralOwnershipEvent"')::text AS t`
    );
    expect(rows[0].t).not.toBeNull();
  });
});
