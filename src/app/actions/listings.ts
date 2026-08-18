'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/getCurrentUser';

interface CreateListingData {
  coralId: string;
  price: number;
  qty: number;
  notes?: string;
}

export async function createListing(data: CreateListingData): Promise<void> {
  const user = await getCurrentUser();

  const { rows: [coral] } = await pool.query<{ ownerId: string }>(
    `SELECT "ownerId" FROM public."Coral" WHERE id = $1`,
    [data.coralId],
  );
  if (!coral || coral.ownerId !== user.id) throw new Error('Not your specimen');

  await pool.query(
    `INSERT INTO public."FragListing" (id, "coralId", "userId", price, qty, notes, "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())`,
    [data.coralId, user.id, data.price, data.qty, data.notes ?? null],
  );

  revalidatePath(`/collection/${data.coralId}`);
  revalidatePath('/dashboard');
}
