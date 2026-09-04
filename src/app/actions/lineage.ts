'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { uniqueRFCode } from '@/lib/rfCode';
import { createNotification } from '@/app/actions/notifications';
import { checkSpecimenCap } from '@/lib/entitlements';
import type { CoralStage } from '@/app/actions/specimens';
import { invariant } from '@/lib/log';

export type LineageNode = {
  id: string;
  name: string;
  rfCode: string | null;
  identityHue: number | null;
  ownerUsername: string | null;
  depth: number;
  generationFromMother: number | null;
  parentStageAtCut: CoralStage | null;
};

export async function getLineage(specimenId: string): Promise<LineageNode[]> {
  const { rows } = await pool.query<LineageNode>(
    `WITH RECURSIVE chain AS (
       SELECT "parentId", "childId", 1 AS depth, "parentStageAtCut"
       FROM public."Lineage"
       WHERE "childId" = $1
       UNION ALL
       SELECT l."parentId", l."childId", chain.depth + 1, l."parentStageAtCut"
       FROM public."Lineage" l
       JOIN chain ON l."childId" = chain."parentId"
       WHERE chain.depth < 20
     )
     SELECT c.id, c.name, c."rfCode", c."identityHue", u.username AS "ownerUsername", chain.depth,
            c."generationFromMother", chain."parentStageAtCut"
     FROM chain
     JOIN public."Coral" c ON c.id = chain."parentId"
     LEFT JOIN public."User" u ON u.id = c."ownerId"
     ORDER BY chain.depth DESC`,
    [specimenId]
  );
  return rows;
}

export async function getChildren(specimenId: string): Promise<LineageNode[]> {
  const { rows } = await pool.query<LineageNode>(
    `SELECT c.id, c.name, c."rfCode", c."identityHue", u.username AS "ownerUsername", 1 AS depth,
            c."generationFromMother", l."parentStageAtCut"
     FROM public."Lineage" l
     JOIN public."Coral" c ON c.id = l."childId"
     LEFT JOIN public."User" u ON u.id = c."ownerId"
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

  // Covers both branches below — branch A is an UPDATE, so a guard at the
  // INSERT site alone would miss it.
  const cap = await checkSpecimenCap(user);
  if (!cap.ok) return { error: cap.error };

  // Check if it's a pre-generated unclaimed frag
  const { rows: fragRows } = await pool.query<{ id: string; rfCode: string }>(
    `SELECT id, "rfCode" FROM public."Coral" WHERE "rfCode" = $1 AND "ownerId" IS NULL`,
    [normalized]
  );

  if (fragRows[0]) {
    await pool.query(
      `UPDATE public."Coral"
         SET "ownerId" = $1,
             "acquiredStage" = COALESCE("acquiredStage", stage),
             "givenTo" = NULL,
             "updatedAt" = NOW()
       WHERE id = $2`,
      [user.id, fragRows[0].id]
    );
    revalidatePath('/collection');
    revalidatePath('/dashboard');
    return { coralId: fragRows[0].id, coralRfCode: fragRows[0].rfCode };
  }

  // Otherwise treat as a parent coral and create a child
  const { rows: parentRows } = await pool.query<{
    id: string; name: string; species: string | null; category: string | null; ownerId: string; stage: CoralStage | null;
  }>(
    `SELECT id, name, species, category, "ownerId", stage FROM public."Coral" WHERE "rfCode" = $1 AND "ownerId" IS NOT NULL`,
    [normalized]
  );
  if (!parentRows[0]) {
    // Neither branch matched. Usually a typo'd code — but if the code DOES exist
    // in Coral, the two branch queries disagree with reality and that is a bug.
    const { rows: exists } = await pool.query<{ n: number }>(
      'SELECT COUNT(*)::int AS n FROM public."Coral" WHERE "rfCode" = $1',
      [normalized]
    );
    invariant('claim.code_exists_but_no_branch_matched', exists[0].n === 0, {
      rfCode: normalized,
    });
    return { error: 'No coral found with that RF code' };
  }

  const parent = parentRows[0];
  if (parent.ownerId === user.id) {
    return { error: 'This is your own coral — log a frag from it instead of claiming it.' };
  }

  const newRfCode = await uniqueRFCode();
  const identityHue = Math.floor(Math.random() * 360);

  const { rows: childRows } = await pool.query<{ id: string; rfCode: string }>(
    `INSERT INTO public."Coral"
       (id, name, species, category, "rfCode", "ownerId", "identityHue",
        stage, "acquiredStage", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6,
             'FRAG'::"CoralStage", 'FRAG'::"CoralStage", NOW())
     RETURNING id, "rfCode"`,
    [parent.name, parent.species ?? null, parent.category ?? null, newRfCode, user.id, identityHue]
  );
  const child = childRows[0];

  await pool.query(
    `INSERT INTO public."Lineage" ("parentId", "childId", "parentStageAtCut")
     VALUES ($1, $2, $3::"CoralStage") ON CONFLICT DO NOTHING`,
    [parent.id, child.id, parent.stage]
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
export async function createFrags(
  parentId: string,
  count: number,
  opts?: { stage?: CoralStage; keepForSelf?: boolean }
): Promise<Array<{ id: string; rfCode: string }> | { error: string }> {
  const user = await getCurrentUser();

  // Look the parent up without the ownership filter so the failure can say
  // something useful. "Not owned by you" is misleading for an unclaimed frag
  // you cut yourself — it is yours, it just has no owner until it is claimed.
  const { rows: parentRows } = await pool.query<{
    name: string; species: string | null; category: string | null;
    stage: CoralStage | null; ownerId: string | null; rfCode: string | null;
  }>(
    'SELECT name, species, category, stage, "ownerId", "rfCode" FROM public."Coral" WHERE id = $1',
    [parentId]
  );
  const found = parentRows[0];
  if (!found) return { error: 'That coral no longer exists.' };

  if (found.ownerId === null) {
    return {
      error:
        `${found.rfCode ?? 'This frag'} has not been claimed yet, so it cannot be fragged. ` +
        'Claim it first to add it to your collection.',
    };
  }
  if (found.ownerId !== user.id) {
    return { error: 'You can only cut frags from corals in your own collection.' };
  }

  const parent = found;
  const fragStage: CoralStage = opts?.stage ?? 'FRAG';
  // "Keep this one" — assign straight to the owner so cutting a frag off your
  // own frag doesn't require a self-claim detour through /claim.
  const ownerId = opts?.keepForSelf ? user.id : null;

  const created: Array<{ id: string; rfCode: string }> = [];
  const n = Math.min(Math.max(1, Math.floor(count)), 25);

  for (let i = 0; i < n; i++) {
    const rfCode = await uniqueRFCode();
    const identityHue = Math.floor(Math.random() * 360);

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO public."Coral"
         (id, name, species, category, "rfCode", "ownerId", "identityHue",
          stage, "acquiredStage", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6,
               $7::"CoralStage", $8::"CoralStage", NOW())
       RETURNING id`,
      [
        parent.name, parent.species ?? null, parent.category ?? null, rfCode, ownerId, identityHue,
        fragStage,
        // Only meaningful once someone owns it; set on claim otherwise.
        ownerId ? fragStage : null,
      ]
    );

    await pool.query(
      `INSERT INTO public."Lineage" ("parentId", "childId", "parentStageAtCut")
       VALUES ($1, $2, $3::"CoralStage") ON CONFLICT DO NOTHING`,
      [parentId, rows[0].id, parent.stage]
    );

    created.push({ id: rows[0].id, rfCode });
  }

  if (opts?.keepForSelf) revalidatePath('/collection');
  return created;
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

  // A frag is cut from exactly one colony, enforced by UNIQUE("childId").
  // Check first so the user gets a real message rather than a silent no-op —
  // ON CONFLICT DO NOTHING would swallow this and report success.
  const { rows: existing } = await pool.query<{ parentId: string }>(
    'SELECT "parentId" FROM public."Lineage" WHERE "childId" = $1',
    [childId]
  );
  if (existing[0]) {
    return existing[0].parentId === parentId
      ? { error: 'That parent is already linked to this specimen' }
      : { error: 'This specimen already has a parent. Remove it before linking a different one.' };
  }

  try {
    // parentStageAtCut is deliberately left null: this link is made after the
    // fact, so there is no honest cut-time stage to record. Writing today's
    // stage would fabricate history.
    const res = await pool.query(
      `INSERT INTO public."Lineage" ("parentId", "childId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [parentId, childId]
    );
    if (!invariant('claim_parent.insert_matched_no_rows', res.rowCount === 1, { childId, parentId })) {
      return { error: 'Could not create lineage link' };
    }
  } catch {
    return { error: 'Could not create lineage link' };
  }

  revalidatePath(`/collection/${childId}/pedigree`);
  revalidatePath(`/collection/${parentRfCode}/pedigree`);
  return {};
}

/**
 * Note who received a frag, before anyone claims it. Same authorisation shape
 * as photographing one: the parent's owner may annotate an unclaimed child.
 * Cleared on claim, since the real owner supersedes the note.
 */
export async function setFragRecipient(coralId: string, recipient: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();

  const { rows } = await pool.query<{ ownerId: string | null; parentOwnerId: string | null }>(
    `SELECT c."ownerId", p."ownerId" AS "parentOwnerId"
     FROM public."Coral" c
     LEFT JOIN public."Lineage" l ON l."childId" = c.id
     LEFT JOIN public."Coral" p ON p.id = l."parentId"
     WHERE c.id = $1`,
    [coralId]
  );
  const row = rows[0];
  if (!row) return { error: 'Coral not found' };

  const ownsIt = row.ownerId === user.id;
  const ownsUnclaimedChild = row.ownerId === null && row.parentOwnerId === user.id;
  if (!ownsIt && !ownsUnclaimedChild) return { error: 'Not authorized' };

  const value = recipient.trim();
  await pool.query(
    `UPDATE public."Coral" SET "givenTo" = $1, "updatedAt" = NOW() WHERE id = $2`,
    [value || null, coralId]
  );
  revalidatePath(`/coral/${coralId}`);
  return {};
}
