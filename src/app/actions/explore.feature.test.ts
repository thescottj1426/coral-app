import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testPool, truncateAll } from '@/test/db';
import { seedUser, seedCoral, linkLineage, resetSequence } from '@/test/factories';

vi.mock('@/lib/db', async () => ({ pool: (await import('@/test/db')).testPool }));

const { getExploreSpecimens } = await import('./explore');

let owner: Awaited<ReturnType<typeof seedUser>>;
let other: Awaited<ReturnType<typeof seedUser>>;

beforeEach(async () => {
  await truncateAll();
  resetSequence();
  owner = await seedUser({ id: 'owner' });
  other = await seedUser({ id: 'other' });
});

afterAll(async () => {
  await testPool.end();
});

const codes = async () => (await getExploreSpecimens()).map((s) => s.rfCode);

describe('getExploreSpecimens', () => {
  it('lists a coral with an owner', async () => {
    await seedCoral({ ownerId: owner.id, rfCode: 'RF-ROOT' });
    expect(await codes()).toContain('RF-ROOT');
  });

  it('omits an unclaimed frag, which has no owner to show', async () => {
    const parent = await seedCoral({ ownerId: owner.id, rfCode: 'RF-PAR' });
    const frag = await seedCoral({ ownerId: null, rfCode: 'RF-UNCL' });
    await linkLineage(parent.id, frag.id);

    expect(await codes()).not.toContain('RF-UNCL');
  });

  // The duplicate this was reported for: a kept frag carries the parent's name,
  // so Explore showed "HomeKicker" twice — the frag's card being the emptier.
  it('omits a frag the owner kept from their own coral', async () => {
    const parent = await seedCoral({ ownerId: owner.id, rfCode: 'RF-MOTHER' });
    const kept = await seedCoral({ ownerId: owner.id, rfCode: 'RF-KEPT' });
    await linkLineage(parent.id, kept.id);

    const listed = await codes();
    expect(listed).toContain('RF-MOTHER');
    expect(listed).not.toContain('RF-KEPT');
  });

  // A frag claimed from someone else is a real acquisition into a new
  // collection, not a duplicate of anything that collection already shows.
  it('keeps a frag claimed from another keeper', async () => {
    const parent = await seedCoral({ ownerId: owner.id, rfCode: 'RF-SOURCE' });
    const claimed = await seedCoral({ ownerId: other.id, rfCode: 'RF-CLAIMED' });
    await linkLineage(parent.id, claimed.id);

    const listed = await codes();
    expect(listed).toContain('RF-SOURCE');
    expect(listed).toContain('RF-CLAIMED');
  });

  it('still lists a frag of a frag when the owner differs at each step', async () => {
    const root = await seedCoral({ ownerId: owner.id, rfCode: 'RF-A' });
    const mid = await seedCoral({ ownerId: other.id, rfCode: 'RF-B' });
    const tip = await seedCoral({ ownerId: owner.id, rfCode: 'RF-C' });
    await linkLineage(root.id, mid.id);
    await linkLineage(mid.id, tip.id);

    const listed = await codes();
    expect(listed).toEqual(expect.arrayContaining(['RF-A', 'RF-B', 'RF-C']));
  });
});
