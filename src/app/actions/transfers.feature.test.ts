import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testPool, truncateAll } from '@/test/db';
import { seedUser, seedCoral, linkLineage, resetSequence } from '@/test/factories';

const currentUser = vi.fn();
vi.mock('@/lib/getCurrentUser', () => ({ getCurrentUser: () => currentUser() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', async () => ({ pool: (await import('@/test/db')).testPool }));

const { createTransferCodes, cancelTransferCode, lookupTransferCode, redeemTransferCode } =
  await import('./transfers');

let farm: Awaited<ReturnType<typeof seedUser>>;
let buyer: Awaited<ReturnType<typeof seedUser>>;
let stranger: Awaited<ReturnType<typeof seedUser>>;

beforeEach(async () => {
  await truncateAll();
  resetSequence();
  farm = await seedUser({ id: 'farm' });
  buyer = await seedUser({ id: 'buyer' });
  stranger = await seedUser({ id: 'stranger' });
  currentUser.mockResolvedValue(farm);
});

afterAll(async () => {
  await testPool.end();
});

async function issue(coralId: string) {
  currentUser.mockResolvedValue(farm);
  const res = await createTransferCodes([coralId]);
  if ('error' in res) throw new Error(res.error);
  return res[0].code;
}

const ownerOf = async (coralId: string) =>
  (await testPool.query('SELECT "ownerId" FROM public."Coral" WHERE id = $1', [coralId])).rows[0].ownerId;

describe('createTransferCodes', () => {
  it('issues a code for an owned coral and stores only its hash', async () => {
    const coral = await seedCoral({ ownerId: farm.id });
    const code = await issue(coral.id);

    expect(code).toMatch(/^REEF-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const { rows } = await testPool.query('SELECT "codeHash" FROM public."TransferCode"');
    expect(rows).toHaveLength(1);
    expect(rows[0].codeHash).not.toContain(code.slice(5, 9));
  });

  it('issues codes for unclaimed frags cut from your coral', async () => {
    const mother = await seedCoral({ ownerId: farm.id });
    const frag = await seedCoral({ ownerId: null });
    await linkLineage(mother.id, frag.id);
    expect(await issue(frag.id)).toMatch(/^REEF-/);
  });

  it('refuses corals you do not own', async () => {
    const coral = await seedCoral({ ownerId: farm.id });
    currentUser.mockResolvedValue(stranger);
    expect(await createTransferCodes([coral.id])).toHaveProperty('error');
  });

  it('replaces the previous open code', async () => {
    const coral = await seedCoral({ ownerId: farm.id });
    const first = await issue(coral.id);
    await issue(coral.id);

    currentUser.mockResolvedValue(buyer);
    expect((await redeemTransferCode(first)) as { error: string }).toHaveProperty('error');
  });
});

describe('redeemTransferCode', () => {
  it('moves ownership and records ACQUIRED in one go', async () => {
    const coral = await seedCoral({ ownerId: farm.id });
    const code = await issue(coral.id);

    currentUser.mockResolvedValue(buyer);
    const res = await redeemTransferCode(code.toLowerCase());
    expect(res).not.toHaveProperty('error');
    expect(await ownerOf(coral.id)).toBe(buyer.id);

    const { rows } = await testPool.query(
      'SELECT "eventType", "userId", source FROM public."CoralOwnershipEvent" WHERE "coralId" = $1',
      [coral.id]
    );
    expect(rows).toEqual([{ eventType: 'ACQUIRED', userId: buyer.id, source: 'transfer_code' }]);
  });

  it('redeems only once', async () => {
    const coral = await seedCoral({ ownerId: farm.id });
    const code = await issue(coral.id);

    currentUser.mockResolvedValue(buyer);
    await redeemTransferCode(code);
    currentUser.mockResolvedValue(stranger);
    expect(((await redeemTransferCode(code)) as { error: string }).error).toMatch(/already been used/i);
    expect(await ownerOf(coral.id)).toBe(buyer.id);
  });

  it('refuses an expired code', async () => {
    const coral = await seedCoral({ ownerId: farm.id });
    const code = await issue(coral.id);
    await testPool.query(`UPDATE public."TransferCode" SET "expiresAt" = NOW() - INTERVAL '1 day'`);

    currentUser.mockResolvedValue(buyer);
    expect(((await redeemTransferCode(code)) as { error: string }).error).toMatch(/expired/i);
    expect(await ownerOf(coral.id)).toBe(farm.id);
  });

  it('refuses a cancelled code', async () => {
    const coral = await seedCoral({ ownerId: farm.id });
    const code = await issue(coral.id);
    await cancelTransferCode(coral.id);

    currentUser.mockResolvedValue(buyer);
    expect(((await redeemTransferCode(code)) as { error: string }).error).toMatch(/cancelled/i);
  });

  it('refuses a wrong code and changes nothing', async () => {
    const coral = await seedCoral({ ownerId: farm.id });
    await issue(coral.id);

    currentUser.mockResolvedValue(buyer);
    expect(await redeemTransferCode('REEF-AAAA-AAAA')).toHaveProperty('error');
    expect(await ownerOf(coral.id)).toBe(farm.id);
  });

  it('locks out after repeated wrong codes', async () => {
    currentUser.mockResolvedValue(buyer);
    for (let i = 0; i < 10; i++) await redeemTransferCode('REEF-AAAA-AAAA');

    const coral = await seedCoral({ ownerId: farm.id });
    const code = await issue(coral.id);
    currentUser.mockResolvedValue(buyer);
    expect(((await redeemTransferCode(code)) as { error: string }).error).toMatch(/too many/i);
  });
});

describe('lookupTransferCode', () => {
  it('previews the coral without changing ownership', async () => {
    const coral = await seedCoral({ ownerId: farm.id, name: 'Homewrecker' });
    const code = await issue(coral.id);

    currentUser.mockResolvedValue(buyer);
    expect(await lookupTransferCode(code)).toMatchObject({ coralId: coral.id, name: 'Homewrecker', fromUsername: 'farm' });
    expect(await ownerOf(coral.id)).toBe(farm.id);
  });
});
