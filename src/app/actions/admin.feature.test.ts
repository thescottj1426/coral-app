import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testPool, truncateAll } from '@/test/db';
import { seedUser, seedCoral, resetSequence } from '@/test/factories';

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => revalidatePath(p) }));

vi.mock('@/lib/db', async () => {
  const { testPool: tp } = await import('@/test/db');
  return {
    pool: tp,
    queryOne: async (sql: string, params?: unknown[]) =>
      (await tp.query(sql, params)).rows[0] ?? null,
  };
});

const session = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: () => session() } } }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));

const { reviewPhoto } = await import('./admin');

let admin: Awaited<ReturnType<typeof seedUser>>;

beforeEach(async () => {
  await truncateAll();
  resetSequence();
  revalidatePath.mockClear();
  admin = await seedUser({ id: 'admin' });
  await testPool.query('UPDATE public."User" SET "isAdmin" = true WHERE id = $1', [admin.id]);
  session.mockResolvedValue({ user: { id: admin.id } });
});

afterAll(async () => {
  await testPool.end();
});

async function pendingPhoto(rfCode: string) {
  const coral = await seedCoral({ ownerId: admin.id, rfCode });
  const { rows } = await testPool.query<{ id: string }>(
    `INSERT INTO public."CoralPhoto" (id, "s3Key", url, "coralId", status, "createdAt")
     VALUES (gen_random_uuid()::text, 'k', '/api/image?key=k', $1, 'pending', NOW())
     RETURNING id`,
    [coral.id]
  );
  return { coral, photoId: rows[0].id };
}

describe('reviewPhoto', () => {
  it('records the decision', async () => {
    const { photoId } = await pendingPhoto('RF-REV1');
    await reviewPhoto(photoId, 'approved');

    const { rows } = await testPool.query<{ status: string; reviewedBy: string }>(
      'SELECT status, "reviewedBy" FROM public."CoralPhoto" WHERE id = $1',
      [photoId]
    );
    expect(rows[0].status).toBe('approved');
    expect(rows[0].reviewedBy).toBe(admin.id);
  });

  it('revalidates explore', async () => {
    const { photoId } = await pendingPhoto('RF-REV3');
    await reviewPhoto(photoId, 'approved');
    expect(revalidatePath).toHaveBeenCalledWith('/explore');
  });

  it("revalidates the coral's own public page", async () => {
    const { photoId } = await pendingPhoto('RF-REV4');
    await reviewPhoto(photoId, 'approved');
    expect(revalidatePath).toHaveBeenCalledWith('/coral/RF-REV4');
  });

  it('still revalidates the review queue', async () => {
    const { photoId } = await pendingPhoto('RF-REV5');
    await reviewPhoto(photoId, 'approved');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/photos');
  });

  // A rejection changes what is displayed just as much as an approval does:
  // an already-approved photo being pulled must leave the caches too.
  it('revalidates on rejection as well', async () => {
    const { photoId } = await pendingPhoto('RF-REV6');
    await reviewPhoto(photoId, 'rejected', 'blurry');
    expect(revalidatePath).toHaveBeenCalledWith('/explore');
    expect(revalidatePath).toHaveBeenCalledWith('/coral/RF-REV6');
  });

  it('refuses a non-admin', async () => {
    const plain = await seedUser({ id: 'plain' });
    session.mockResolvedValue({ user: { id: plain.id } });
    const { photoId } = await pendingPhoto('RF-REV7');

    await expect(reviewPhoto(photoId, 'approved')).rejects.toThrow(/Not authorized/);
  });
});
