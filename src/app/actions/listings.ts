'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';

interface CreateListingData {
  coralId: string;
  price: number;
  qty: number;
  notes?: string;
}

export async function createListing(data: CreateListingData): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');

  const { rows: [coral] } = await pool.query<{ ownerId: string }>(
    `SELECT "ownerId" FROM public."Coral" WHERE id = $1`,
    [data.coralId],
  );
  if (!coral || coral.ownerId !== session.user.id) throw new Error('Not your specimen');

  await pool.query(
    `INSERT INTO public."FragListing" (id, "coralId", "userId", price, qty, notes, "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())`,
    [data.coralId, session.user.id, data.price, data.qty, data.notes ?? null],
  );

  revalidatePath(`/collection/${data.coralId}`);
  revalidatePath('/dashboard');
}
