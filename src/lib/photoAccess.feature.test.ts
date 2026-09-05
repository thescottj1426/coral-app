import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testPool, truncateAll } from '@/test/db';
import { seedUser, seedCoral, linkLineage, resetSequence } from '@/test/factories';

vi.mock('@/lib/db', async () => ({ pool: (await import('@/test/db')).testPool }));

const { resolvePhotoAccess } = await import('./photoAccess');

let owner: Awaited<ReturnType<typeof seedUser>>;
let stranger: Awaited<ReturnType<typeof seedUser>>;

beforeEach(async () => {
  await truncateAll();
  resetSequence();
  owner = await seedUser({ id: 'owner' });
  stranger = await seedUser({ id: 'stranger' });
});

afterAll(async () => {
  await testPool.end();
});

async function photoOn(coralId: string, status: string, key: string) {
  await testPool.query(
    `INSERT INTO public."CoralPhoto" (id, "s3Key", url, "coralId", status, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4::"PhotoStatus", NOW())`,
    [key, `/api/image?key=${key}`, coralId, status]
  );
  return key;
}

describe('resolvePhotoAccess', () => {
  it('serves an approved photo to a stranger', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    const key = await photoOn(coral.id, 'approved', 'k-approved');

    expect(await resolvePhotoAccess(key, stranger.id)).toEqual({ ok: true, status: 'approved' });
  });

  it('serves an approved photo to a logged-out viewer', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    const key = await photoOn(coral.id, 'approved', 'k-public');

    expect(await resolvePhotoAccess(key, null)).toEqual({ ok: true, status: 'approved' });
  });

  it('serves a pending photo to the coral owner', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    const key = await photoOn(coral.id, 'pending', 'k-mine');

    expect(await resolvePhotoAccess(key, owner.id)).toEqual({ ok: true, status: 'pending' });
  });

  // The hole this closes: the proxy used to hand this to anyone with the URL,
  // which made the moderation queue advisory.
  it('refuses a pending photo to a stranger', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    const key = await photoOn(coral.id, 'pending', 'k-pending');

    expect(await resolvePhotoAccess(key, stranger.id)).toEqual({ ok: false });
  });

  it('refuses a pending photo to a logged-out viewer', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    const key = await photoOn(coral.id, 'pending', 'k-anon');

    expect(await resolvePhotoAccess(key, null)).toEqual({ ok: false });
  });

  it("serves a pending photo on an unclaimed frag to the parent's owner", async () => {
    const parent = await seedCoral({ ownerId: owner.id });
    const frag = await seedCoral({ ownerId: null });
    await linkLineage(parent.id, frag.id);
    const key = await photoOn(frag.id, 'pending', 'k-frag');

    expect(await resolvePhotoAccess(key, owner.id)).toEqual({ ok: true, status: 'pending' });
  });

  // Mirrors how the write permission lapses on claim: once the frag has an
  // owner, the person who cut it is just another viewer.
  it('refuses once that frag has been claimed by someone else', async () => {
    const parent = await seedCoral({ ownerId: owner.id });
    const frag = await seedCoral({ ownerId: stranger.id });
    await linkLineage(parent.id, frag.id);
    const key = await photoOn(frag.id, 'pending', 'k-claimed');

    expect(await resolvePhotoAccess(key, owner.id)).toEqual({ ok: false });
    expect(await resolvePhotoAccess(key, stranger.id)).toEqual({ ok: true, status: 'pending' });
  });

  it('refuses a rejected photo even to its owner', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    const key = await photoOn(coral.id, 'rejected', 'k-rejected');

    expect(await resolvePhotoAccess(key, owner.id)).toEqual({ ok: false });
  });

  it('refuses a key that matches no photo', async () => {
    expect(await resolvePhotoAccess('specimens/nobody/nothing.jpg', owner.id)).toEqual({
      ok: false,
    });
  });
});
