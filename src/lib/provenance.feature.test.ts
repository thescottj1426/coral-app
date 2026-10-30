import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testPool, truncateAll } from '@/test/db';
import { seedUser, seedCoral, linkLineage, resetSequence } from '@/test/factories';

vi.mock('@/lib/db', async () => ({ pool: (await import('@/test/db')).testPool }));

const { getFamily, getProvenance } = await import('./provenance');

beforeEach(async () => {
  await truncateAll();
  resetSequence();
});

afterAll(async () => {
  await testPool.end();
});

describe('getFamily', () => {
  it('counts every living descendant and its keepers from the root down', async () => {
    const farm = await seedUser({ id: 'farm' });
    const a = await seedUser({ id: 'alice' });
    const b = await seedUser({ id: 'bob' });

    const mother = await seedCoral({ ownerId: farm.id, name: 'Mother' });
    const f1 = await seedCoral({ ownerId: a.id });
    const f2 = await seedCoral({ ownerId: b.id });
    const f1a = await seedCoral({ ownerId: b.id });
    const dead = await seedCoral({ ownerId: a.id, status: 'LOST' });
    const unclaimed = await seedCoral({ ownerId: null });
    await linkLineage(mother.id, f1.id);
    await linkLineage(mother.id, f2.id);
    await linkLineage(f1.id, f1a.id);
    await linkLineage(f1.id, dead.id);
    await linkLineage(mother.id, unclaimed.id);

    // Asked from a grandchild, it still answers for the whole colony.
    const family = await getFamily(f1a.id);
    expect(family?.root).toMatchObject({ id: mother.id, ownerUsername: 'farm', ownerVerified: true });
    expect(family?.pieces).toBe(5);
    expect(family?.keepers).toEqual([
      { username: 'bob', pieces: 2 },
      { username: 'alice', pieces: 1 },
      { username: 'farm', pieces: 1 },
    ]);
  });
});

describe('getProvenance', () => {
  it('falls back to the created date for corals with no events', async () => {
    const u = await seedUser({ id: 'keeper' });
    const coral = await seedCoral({ ownerId: u.id });
    const entries = await getProvenance({ id: coral.id, createdAt: '2026-01-01T00:00:00Z', ownerUsername: 'keeper' });
    expect(entries).toEqual([
      { date: '2026-01-01T00:00:00Z', kind: 'added', username: 'keeper', fromRfCode: null, notes: null },
    ]);
  });

  it('lists a cut and a transfer in order', async () => {
    const farm = await seedUser({ id: 'farm' });
    const buyer = await seedUser({ id: 'buyer' });
    const coral = await seedCoral({ ownerId: buyer.id });
    await testPool.query(
      `INSERT INTO public."CoralOwnershipEvent" (id, "coralId", "eventType", "userId", date, source)
       VALUES ('e1', $1, 'FRAGGED', $2, NOW() - INTERVAL '2 days', 'RF-MOM1'),
              ('e2', $1, 'ACQUIRED', $3, NOW(), 'transfer_code')`,
      [coral.id, farm.id, buyer.id]
    );
    const entries = await getProvenance({ id: coral.id, createdAt: new Date().toISOString(), ownerUsername: 'buyer' });
    expect(entries.map((e) => [e.kind, e.username, e.fromRfCode])).toEqual([
      ['cut', 'farm', 'RF-MOM1'],
      ['transferred', 'buyer', null],
    ]);
  });
});
