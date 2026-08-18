'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { uniqueRFCode } from '@/lib/rfCode';
import { createNotification } from '@/app/actions/notifications';

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

// fragKind = 'unclaimed_frag': this coral exists in DB with ownerId=NULL, ready to be claimed
// fragKind = 'parent_coral': this is an owned coral; claiming creates a new child
export type ParentCoralInfo = {
  id: string;
  name: string;
  species: string | null;
  category: string | null;
  rfCode: string;
  ownerUsername: string | null;
  identityHue: number | null;
  ancestors: LineageNode[];
  fragKind: 'unclaimed_frag' | 'parent_coral';
  isOwn: boolean;
};

export async function lookupParentCoral(rfCode: string): Promise<ParentCoralInfo | null> {
  const normalized = rfCode.toUpperCase().trim();
  const { rows } = await pool.query<{
    id: string; name: string; species: string | null; category: string | null;
    rfCode: string; identityHue: number | null; ownerId: string | null; ownerUsername: string | null;
  }>(
    `SELECT c.id, c.name, c.species, c.category, c."rfCode", c."identityHue", c."ownerId",
            u.username AS "ownerUsername"
     FROM public."Coral" c
     LEFT JOIN public."User" u ON u.id = c."ownerId"
     WHERE c."rfCode" = $1`,
    [normalized]
  );
  if (!rows[0]) return null;
  const { ownerId, ...coral } = rows[0];
  const fragKind: ParentCoralInfo['fragKind'] = ownerId === null ? 'unclaimed_frag' : 'parent_coral';
  const user = await getCurrentUser();
  const ancestors = await getLineage(coral.id);
  return { ...coral, ancestors, fragKind, isOwn: ownerId === user.id };
}

export async function claimFrag(rfCode: string): Promise<{ coralId: string; coralRfCode: string } | { error: string }> {
  const user = await getCurrentUser();
  const normalized = rfCode.toUpperCase().trim();

  // Check if it's a pre-generated unclaimed frag
  const { rows: fragRows } = await pool.query<{ id: string; rfCode: string }>(
    `SELECT id, "rfCode" FROM public."Coral" WHERE "rfCode" = $1 AND "ownerId" IS NULL`,
    [normalized]
  );

  if (fragRows[0]) {
    await pool.query(
      `UPDATE public."Coral" SET "ownerId" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [user.id, fragRows[0].id]
    );
    revalidatePath('/collection');
    revalidatePath('/dashboard');
    return { coralId: fragRows[0].id, coralRfCode: fragRows[0].rfCode };
  }

  // Otherwise treat as a parent coral and create a child
  const { rows: parentRows } = await pool.query<{
    id: string; name: string; species: string | null; category: string | null; ownerId: string;
  }>(
    `SELECT id, name, species, category, "ownerId" FROM public."Coral" WHERE "rfCode" = $1 AND "ownerId" IS NOT NULL`,
    [normalized]
  );
  if (!parentRows[0]) return { error: 'No coral found with that RF code' };

  const parent = parentRows[0];
  if (parent.ownerId === user.id) {
    return { error: 'This is your own coral — log a frag from it instead of claiming it.' };
  }

  const newRfCode = await uniqueRFCode();
  const identityHue = Math.floor(Math.random() * 360);

  const { rows: childRows } = await pool.query<{ id: string; rfCode: string }>(
    `INSERT INTO public."Coral"
       (id, name, species, category, "rfCode", "ownerId", "identityHue", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW())
     RETURNING id, "rfCode"`,
    [parent.name, parent.species ?? null, parent.category ?? null, newRfCode, user.id, identityHue]
  );
  const child = childRows[0];

  await pool.query(
    `INSERT INTO public."Lineage" ("parentId", "childId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [parent.id, child.id]
  );

  createNotification({
    userId: parent.ownerId,
    type: 'FRAG_CLAIMED',
    fromUserId: user.id,
    targetType: 'CORAL',
    targetId: parent.id,
  }).catch((err) => console.error('[lineage] frag-claimed notification failed:', err));

  revalidatePath('/collection');
  revalidatePath('/dashboard');
  return { coralId: child.id, coralRfCode: child.rfCode };
}

// Creates unclaimed child corals (ownerId=NULL) linked to parentId.
// Called from FragModal — each code is a real DB record the recipient can claim.
export async function createFrags(parentId: string, count: number): Promise<string[]> {
  const user = await getCurrentUser();

  const { rows: parentRows } = await pool.query<{ name: string; species: string | null; category: string | null }>(
    'SELECT name, species, category FROM public."Coral" WHERE id = $1 AND "ownerId" = $2',
    [parentId, user.id]
  );
  if (!parentRows[0]) throw new Error('Coral not found or not owned by you');

  const parent = parentRows[0];
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const rfCode = await uniqueRFCode();
    const identityHue = Math.floor(Math.random() * 360);

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO public."Coral"
         (id, name, species, category, "rfCode", "ownerId", "identityHue", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NULL, $5, NOW())
       RETURNING id`,
      [parent.name, parent.species ?? null, parent.category ?? null, rfCode, identityHue]
    );

    await pool.query(
      'INSERT INTO public."Lineage" ("parentId", "childId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [parentId, rows[0].id]
    );

    codes.push(rfCode);
  }

  return codes;
}

export async function claimParent(childId: string, parentRfCode: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();

  const { rows: childRows } = await pool.query(
    'SELECT id FROM public."Coral" WHERE id = $1 AND "ownerId" = $2',
    [childId, user.id]
  );
  if (childRows.length === 0) return { error: 'Specimen not found' };

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
