'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');
  return session.user;
}

export type LineageNode = {
  id: string;
  name: string;
  rfCode: string | null;
  identityHue: number | null;
  ownerUsername: string;
  depth: number;
};

export async function getLineage(specimenId: string): Promise<LineageNode[]> {
  const { rows } = await pool.query<LineageNode>(
    `WITH RECURSIVE chain AS (
       SELECT "parentId", "childId", 1 AS depth
       FROM public."Lineage"
       WHERE "childId" = $1
       UNION ALL
       SELECT l."parentId", l."childId", chain.depth + 1
       FROM public."Lineage" l
       JOIN chain ON l."childId" = chain."parentId"
       WHERE chain.depth < 4
     )
     SELECT c.id, c.name, c."rfCode", c."identityHue", u.username AS "ownerUsername", chain.depth
     FROM chain
     JOIN public."Coral" c ON c.id = chain."parentId"
     JOIN public."User" u ON u.id = c."ownerId"
     ORDER BY chain.depth DESC`,
    [specimenId]
  );
  return rows;
}

export async function getChildren(specimenId: string): Promise<LineageNode[]> {
  const { rows } = await pool.query<LineageNode>(
    `SELECT c.id, c.name, c."rfCode", c."identityHue", u.username AS "ownerUsername", 1 AS depth
     FROM public."Lineage" l
     JOIN public."Coral" c ON c.id = l."childId"
     JOIN public."User" u ON u.id = c."ownerId"
     WHERE l."parentId" = $1
     ORDER BY c."createdAt" ASC`,
    [specimenId]
  );
  return rows;
}

export async function claimParent(childId: string, parentRfCode: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();

  // Verify the child belongs to this user
  const { rows: childRows } = await pool.query(
    'SELECT id FROM public."Coral" WHERE id = $1 AND "ownerId" = $2',
    [childId, user.id]
  );
  if (childRows.length === 0) return { error: 'Specimen not found' };

  // Look up the parent by RF code
  const { rows: parentRows } = await pool.query(
    'SELECT id FROM public."Coral" WHERE "rfCode" = $1',
    [parentRfCode.toUpperCase().trim()]
  );
  if (parentRows.length === 0) return { error: 'No specimen found with that RF code' };

  const parentId = parentRows[0].id as string;
  if (parentId === childId) return { error: 'A specimen cannot be its own parent' };

  try {
    await pool.query(
      `INSERT INTO public."Lineage" ("parentId", "childId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [parentId, childId]
    );
  } catch {
    return { error: 'Could not create lineage link' };
  }

  revalidatePath(`/collection/${childId}/pedigree`);
  revalidatePath(`/collection/${parentRfCode}/pedigree`);
  return {};
}
