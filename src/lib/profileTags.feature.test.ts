import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testPool, truncateAll } from '@/test/db';
import { seedUser, seedCoral, linkLineage, resetSequence } from '@/test/factories';

vi.mock('@/lib/db', async () => ({ pool: (await import('@/test/db')).testPool }));

const { getProfileTags } = await import('./profileTags');

beforeEach(async () => {
  await truncateAll();
  resetSequence();
});

afterAll(async () => {
  await testPool.end();
});

describe('getProfileTags', () => {
  it('makes every account a pilot before the launch date is set', async () => {
    const u = await seedUser();
    expect(await getProfileTags(u.id)).toEqual(['pilot']);
  });

  it('awards First Frag after a redeemed transfer code', async () => {
    const farm = await seedUser({ id: 'farm' });
    const buyer = await seedUser({ id: 'buyer' });
    const coral = await seedCoral({ ownerId: buyer.id });
    await testPool.query(
      `INSERT INTO public."TransferCode" (id, "coralId", "createdById", "codeHash", "expiresAt", "redeemedById", "redeemedAt")
       VALUES ('t1', $1, $2, 'hash', NOW() + INTERVAL '30 days', $3, NOW())`,
      [coral.id, farm.id, buyer.id]
    );
    expect(await getProfileTags(buyer.id)).toContain('first_frag');
    expect(await getProfileTags(farm.id)).not.toContain('first_frag');
  });

  it('awards Family Founder at 10 descendants, counting grandchildren', async () => {
    const farm = await seedUser({ id: 'farm' });
    const mother = await seedCoral({ ownerId: farm.id });
    let parent = mother.id;
    for (let i = 0; i < 9; i++) {
      const frag = await seedCoral({ ownerId: null });
      await linkLineage(parent, frag.id);
      if (i % 3 === 0) parent = frag.id;
    }
    expect(await getProfileTags(farm.id)).not.toContain('family_founder');

    const tenth = await seedCoral({ ownerId: null });
    await linkLineage(mother.id, tenth.id);
    expect(await getProfileTags(farm.id)).toContain('family_founder');
  });
});
