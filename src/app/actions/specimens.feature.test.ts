import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testPool, truncateAll } from '@/test/db';
import { seedUser, seedCoral, resetSequence } from '@/test/factories';

const currentUser = vi.fn();
vi.mock('@/lib/getCurrentUser', () => ({ getCurrentUser: () => currentUser() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', async () => ({ pool: (await import('@/test/db')).testPool }));

const sendEmail = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/email', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }));

const { createSpecimen, updateSpecimen, deleteSpecimen, restoreSpecimen, getPublicSpecimen, addSpecimenPhoto } =
  await import('./specimens');
const { getChildren } = await import('./lineage');

let owner: Awaited<ReturnType<typeof seedUser>>;
let other: Awaited<ReturnType<typeof seedUser>>;

beforeEach(async () => {
  await truncateAll();
  resetSequence();
  sendEmail.mockClear();
  owner = await seedUser({ id: 'owner' });
  other = await seedUser({ id: 'other' });
  currentUser.mockResolvedValue(owner);
});

afterAll(async () => {
  await testPool.end();
});

const coralRow = async (id: string) => {
  const { rows } = await testPool.query(
    `SELECT name, species, category, "rfCode", "ownerId", "identityHue", stage,
            "acquiredStage", status, "statusAt", "statusNote"
       FROM public."Coral" WHERE id = $1`,
    [id]
  );
  return rows[0];
};

describe('createSpecimen', () => {
  const base = { name: 'Jason Fox', category: 'SPS' };

  it('creates a coral owned by the caller with an rf code', async () => {
    const res = await createSpecimen(base);
    expect(res).not.toHaveProperty('error');

    const row = await coralRow((res as { id: string }).id);
    expect(row.ownerId).toBe(owner.id);
    expect(row.rfCode).toMatch(/^RF-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it('assigns a hue inside the colour wheel', async () => {
    const res = await createSpecimen(base);
    const row = await coralRow((res as { id: string }).id);
    expect(row.identityHue).toBeGreaterThanOrEqual(0);
    expect(row.identityHue).toBeLessThan(360);
  });

  it('defaults acquiredStage to the given stage', async () => {
    const res = await createSpecimen({ ...base, stage: 'COLONY' });
    const row = await coralRow((res as { id: string }).id);
    expect(row.stage).toBe('COLONY');
    expect(row.acquiredStage).toBe('COLONY');
  });

  it('keeps an explicit acquiredStage distinct from the current stage', async () => {
    const res = await createSpecimen({ ...base, stage: 'COLONY', acquiredStage: 'FRAG' });
    const row = await coralRow((res as { id: string }).id);
    expect(row.stage).toBe('COLONY');
    expect(row.acquiredStage).toBe('FRAG');
  });

  it('links to a parent the caller owns', async () => {
    const parent = await seedCoral({ ownerId: owner.id, stage: 'MOTHER_COLONY' });
    const res = await createSpecimen({ ...base, parentId: parent.id });

    const { rows } = await testPool.query(
      'SELECT "parentId", "parentStageAtCut" FROM public."Lineage" WHERE "childId" = $1',
      [(res as { id: string }).id]
    );
    expect(rows[0].parentId).toBe(parent.id);
    expect(rows[0].parentStageAtCut).toBe('MOTHER_COLONY');
  });

  it('does not link to a parent the caller does not own', async () => {
    const theirs = await seedCoral({ ownerId: other.id });
    const res = await createSpecimen({ ...base, parentId: theirs.id });

    const { rows } = await testPool.query('SELECT 1 FROM public."Lineage" WHERE "childId" = $1', [
      (res as { id: string }).id,
    ]);
    expect(rows).toHaveLength(0);
  });

  it('stores an attached photo as pending review', async () => {
    const res = await createSpecimen({ ...base, photoUrl: '/api/image?key=k', photoKey: 'k' });
    const { rows } = await testPool.query(
      'SELECT "s3Key", status FROM public."CoralPhoto" WHERE "coralId" = $1',
      [(res as { id: string }).id]
    );
    expect(rows[0]).toMatchObject({ s3Key: 'k', status: 'pending' });
  });

  it('welcomes the user on their first specimen only', async () => {
    await createSpecimen(base);
    expect(sendEmail).toHaveBeenCalledTimes(1);

    await createSpecimen({ ...base, name: 'Second' });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});

describe('createSpecimen free cap', () => {
  it('blocks the specimen past the cap', async () => {
    for (let i = 0; i < 50; i++) await seedCoral({ ownerId: owner.id });
    const res = await createSpecimen({ name: 'One too many', category: 'SPS' });
    expect((res as { error: string }).error).toMatch(/free limit of 50/i);
  });

  it('allows the last specimen under the cap', async () => {
    for (let i = 0; i < 49; i++) await seedCoral({ ownerId: owner.id });
    expect(await createSpecimen({ name: 'Fits', category: 'SPS' })).not.toHaveProperty('error');
  });

  it('does not cap a COLLECTOR', async () => {
    const paid = await seedUser({ id: 'paid', plan: 'COLLECTOR' });
    currentUser.mockResolvedValue(paid);
    for (let i = 0; i < 50; i++) await seedCoral({ ownerId: paid.id });

    expect(await createSpecimen({ name: 'Unlimited', category: 'SPS' })).not.toHaveProperty(
      'error'
    );
  });

  // Removed corals stay in the lineage but must not consume a living slot.
  it('does not count removed corals toward the cap', async () => {
    for (let i = 0; i < 50; i++) await seedCoral({ ownerId: owner.id, status: 'LOST' });
    expect(await createSpecimen({ name: 'Still fits', category: 'SPS' })).not.toHaveProperty(
      'error'
    );
  });
});

describe('updateSpecimen', () => {
  it('updates a coral the caller owns', async () => {
    const coral = await seedCoral({ ownerId: owner.id, name: 'Before' });
    await updateSpecimen(coral.id, { name: 'After', category: 'LPS' });

    const row = await coralRow(coral.id);
    expect(row.name).toBe('After');
    expect(row.category).toBe('LPS');
  });

  it('leaves a coral owned by someone else untouched', async () => {
    const theirs = await seedCoral({ ownerId: other.id, name: 'Theirs' });
    await updateSpecimen(theirs.id, { name: 'Hijacked', category: 'LPS' });

    expect((await coralRow(theirs.id)).name).toBe('Theirs');
  });
});

describe('deleteSpecimen', () => {
  const events = async (coralId: string) => {
    const { rows } = await testPool.query(
      `SELECT "eventType"::text AS "eventType", notes
         FROM public."CoralOwnershipEvent" WHERE "coralId" = $1`,
      [coralId]
    );
    return rows;
  };

  it('marks the coral lost by default rather than deleting it', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    await deleteSpecimen(coral.id);

    const row = await coralRow(coral.id);
    expect(row.status).toBe('LOST');
    expect(row.statusAt).not.toBeNull();
  });

  it('records the note', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    await deleteSpecimen(coral.id, 'SOLD', 'Sold at swap');
    expect((await coralRow(coral.id)).statusNote).toBe('Sold at swap');
  });

  // Regression: CoralStatus was written straight into a CoralEventType column.
  // The enums overlap only on SOLD, so LOST and GIVEN failed outright and the
  // audit trail silently recorded nothing.
  it.each([
    ['LOST', 'OBSERVATION'],
    ['GIVEN', 'GIFTED'],
    ['SOLD', 'SOLD'],
  ] as const)('writes an audit event for %s', async (status, eventType) => {
    const coral = await seedCoral({ ownerId: owner.id });
    await deleteSpecimen(coral.id, status);

    const rows = await events(coral.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].eventType).toBe(eventType);
  });

  it('falls back to a descriptive note when none is given', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    await deleteSpecimen(coral.id, 'GIVEN');
    expect((await events(coral.id))[0].notes).toBe('Marked given');
  });

  it('leaves a coral owned by someone else alive', async () => {
    const theirs = await seedCoral({ ownerId: other.id });
    await deleteSpecimen(theirs.id);
    expect((await coralRow(theirs.id)).status).toBe('ALIVE');
  });
});

describe('restoreSpecimen', () => {
  it('brings a removed coral back and clears its status fields', async () => {
    const coral = await seedCoral({ ownerId: owner.id, status: 'LOST' });
    expect(await restoreSpecimen(coral.id)).toEqual({});

    const row = await coralRow(coral.id);
    expect(row.status).toBe('ALIVE');
    expect(row.statusAt).toBeNull();
    expect(row.statusNote).toBeNull();
  });

  it('refuses a coral owned by someone else', async () => {
    const theirs = await seedCoral({ ownerId: other.id, status: 'LOST' });
    expect((await restoreSpecimen(theirs.id)).error).toMatch(/not found/i);
    expect((await coralRow(theirs.id)).status).toBe('LOST');
  });

  // Restoring pushes a coral back into the ALIVE count, so it respects the cap.
  it('refuses when the collection is already at the cap', async () => {
    for (let i = 0; i < 50; i++) await seedCoral({ ownerId: owner.id });
    const removed = await seedCoral({ ownerId: owner.id, status: 'LOST' });

    expect((await restoreSpecimen(removed.id)).error).toMatch(/free limit/i);
    expect((await coralRow(removed.id)).status).toBe('LOST');
  });
});

describe('getPublicSpecimen', () => {
  it('resolves by rf code', async () => {
    const coral = await seedCoral({ ownerId: owner.id, rfCode: 'RF-PUB1', name: 'Public' });
    const found = await getPublicSpecimen('RF-PUB1');
    expect(found?.id).toBe(coral.id);
    expect(found?.name).toBe('Public');
  });

  it('resolves by id', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    expect((await getPublicSpecimen(coral.id))?.id).toBe(coral.id);
  });

  it('returns null for an unknown code', async () => {
    expect(await getPublicSpecimen('RF-NONE')).toBeNull();
  });

  it('hides photos that are not approved', async () => {
    const coral = await seedCoral({ ownerId: owner.id, rfCode: 'RF-PUB2' });
    await testPool.query(
      `INSERT INTO public."CoralPhoto" (id, "s3Key", url, "coralId", status, "createdAt")
       VALUES (gen_random_uuid()::text, 'k', '/api/image?key=k', $1, 'pending', NOW())`,
      [coral.id]
    );
    expect((await getPublicSpecimen('RF-PUB2'))?.coverPhotoUrl).toBeNull();
  });
});

describe('photographing an unclaimed frag', () => {
  // Every frag photo before this landed nowhere: the only camera button lived
  // in the cutting modal, and a pending photo on an ownerless frag was
  // invisible even to the keeper holding the plug.
  async function parentWithUnclaimedFrag() {
    const parent = await seedCoral({ ownerId: owner.id, rfCode: 'RF-PAR1' });
    const frag = await seedCoral({ ownerId: null, rfCode: 'RF-FRG1' });
    await testPool.query(
      `INSERT INTO public."Lineage" (id, "parentId", "childId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
      [parent.id, frag.id]
    );
    return { parent, frag };
  }

  const photosOf = async (coralId: string) => {
    const { rows } = await testPool.query<{ n: string }>(
      'SELECT COUNT(*)::text AS n FROM public."CoralPhoto" WHERE "coralId" = $1',
      [coralId]
    );
    return Number(rows[0].n);
  };

  it("lets the parent's owner attach a photo", async () => {
    const { frag } = await parentWithUnclaimedFrag();
    await addSpecimenPhoto({ specimenId: frag.id, photoKey: 'k1', photoUrl: '/api/image?key=k1' });
    expect(await photosOf(frag.id)).toBe(1);
  });

  it('refuses an unrelated user', async () => {
    const { frag } = await parentWithUnclaimedFrag();
    currentUser.mockResolvedValue(other);
    await expect(
      addSpecimenPhoto({ specimenId: frag.id, photoKey: 'k2', photoUrl: '/api/image?key=k2' })
    ).rejects.toThrow(/Not authorized/);
    expect(await photosOf(frag.id)).toBe(0);
  });

  // The frag's own public page still shows approved photos only — it is ISR
  // cached for crawlers and must not vary per viewer. The keeper sees the photo
  // on the parent's page instead, which is where the camera button lives.
  it('surfaces the photo to the keeper through the parent', async () => {
    const { parent, frag } = await parentWithUnclaimedFrag();
    await addSpecimenPhoto({ specimenId: frag.id, photoKey: 'k3', photoUrl: '/api/image?key=k3' });

    const children = await getChildren(parent.id);
    expect(children).toHaveLength(1);
    expect(children[0].id).toBe(frag.id);
    expect(children[0].photos).toEqual([
      expect.objectContaining({ url: '/api/image?key=k3', status: 'pending' }),
    ]);
  });

  it('keeps the pending photo off the public page', async () => {
    const { frag } = await parentWithUnclaimedFrag();
    await addSpecimenPhoto({ specimenId: frag.id, photoKey: 'k4', photoUrl: '/api/image?key=k4' });

    expect((await getPublicSpecimen('RF-FRG1'))?.photos).toHaveLength(0);
    expect(frag.id).toBeTruthy();
  });

  it('serves the photo through the proxy, never a raw S3 url', async () => {
    const { parent, frag } = await parentWithUnclaimedFrag();
    await addSpecimenPhoto({ specimenId: frag.id, photoKey: 'k5', photoUrl: '/api/image?key=k5' });

    const url = (await getChildren(parent.id))[0].photos?.[0]?.url ?? '';
    expect(url).toContain('/api/image?key=');
    expect(url).not.toContain('amazonaws.com');
    expect(frag.id).toBeTruthy();
  });
});
