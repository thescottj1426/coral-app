'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { sendEmail } from '@/lib/email';
import { welcomeTemplate } from '@/lib/emailTemplates';
import { uniqueRFCode } from '@/lib/rfCode';
import { checkSpecimenCap } from '@/lib/entitlements';
import { invariant } from '@/lib/log';

export type CoralStage =
  | 'MOTHER_COLONY' | 'COLONY' | 'MINI_COLONY' | 'FRAG' | 'MICRO_FRAG';

export type SpecimenRow = {
  id: string;
  name: string;
  species: string | null;
  category: 'SPS' | 'LPS' | 'SOFTIE' | 'ZOA' | 'ANEMONE' | 'OTHER' | null;
  rfCode: string | null;
  origin: string | null;
  notes: string | null;
  identityHue: number | null;
  acquiredDate: string | null;
  createdAt: string;
  updatedAt: string;
  tankName: string | null;
  lightPar: string | null;
  flowLevel: string | null;
  stage: CoralStage | null;
  acquiredStage: CoralStage | null;
  generationFromMother: number | null;
  sourceColony: string | null;
  vendor: string | null;
  coverPhotoUrl: string | null;
  coverPhotoPending: boolean | null;
};

export async function getMySpecimens(userId?: string): Promise<SpecimenRow[]> {
  const user = userId ? { id: userId } : await getCurrentUser();
  const { rows } = await pool.query<SpecimenRow>(
    `SELECT
       c.id, c.name, c.species, c.category, c."rfCode", c.origin, c.notes,
       c."identityHue", c."acquiredDate", c."createdAt", c."updatedAt",
       c."tankName", c."lightPar", c."flowLevel",
       c."stage", c."acquiredStage", c."generationFromMother", c."sourceColony", c."vendor",
       (SELECT '/api/image?key=' || p."s3Key" FROM public."CoralPhoto" p WHERE p."coralId" = c.id ORDER BY CASE WHEN p.status = 'approved' THEN 0 ELSE 1 END, p."createdAt" ASC LIMIT 1) AS "coverPhotoUrl",
       (SELECT p.status = 'pending' FROM public."CoralPhoto" p WHERE p."coralId" = c.id ORDER BY CASE WHEN p.status = 'approved' THEN 0 ELSE 1 END, p."createdAt" ASC LIMIT 1) AS "coverPhotoPending"
     FROM public."Coral" c
     WHERE c."ownerId" = $1
     ORDER BY c."createdAt" DESC`,
    [user.id]
  );
  return rows;
}

export async function createSpecimen(data: {
  name: string;
  species?: string;
  category: string;
  origin?: string;
  notes?: string;
  tankName?: string;
  lightPar?: string;
  flowLevel?: string;
  stage?: CoralStage;
  acquiredStage?: CoralStage;
  generationFromMother?: number;
  sourceColony?: string;
  vendor?: string;
  /** When set, links the new specimen to a coral the user already owns. */
  parentId?: string;
  photoUrl?: string;
  photoKey?: string;
}): Promise<SpecimenRow | { error: string }> {
  const user = await getCurrentUser();

  const cap = await checkSpecimenCap(user);
  if (!cap.ok) return { error: cap.error };

  const rfCode = await uniqueRFCode();
  const identityHue = Math.floor(Math.random() * 360);

  const { rows } = await pool.query<SpecimenRow>(
    `INSERT INTO public."Coral"
       (id, name, species, category, origin, notes, "tankName", "lightPar", "flowLevel",
        stage, "acquiredStage", "generationFromMother", "sourceColony", vendor,
        "rfCode", "ownerId", "identityHue", "updatedAt")
     VALUES
       (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8,
        $9::"CoralStage", $10::"CoralStage", $11, $12, $13,
        $14, $15, $16, NOW())
     RETURNING id, name, species, category, "rfCode", origin, notes, "tankName", "lightPar", "flowLevel",
               stage, "acquiredStage", "generationFromMother", "sourceColony", vendor,
               "identityHue", "acquiredDate", "createdAt", "updatedAt"`,
    [
      data.name, data.species ?? null, data.category, data.origin ?? null, data.notes ?? null,
      data.tankName ?? null, data.lightPar ?? null, data.flowLevel ?? null,
      data.stage ?? null, data.acquiredStage ?? data.stage ?? null,
      data.generationFromMother ?? null, data.sourceColony ?? null, data.vendor ?? null,
      rfCode, user.id, identityHue,
    ]
  );

  const specimen = rows[0];

  // Linking to a coral the user already owns. Snapshot the parent's stage at
  // cut time so the claim stays truthful after the parent grows and is edited.
  if (data.parentId) {
    const { rows: parentRows } = await pool.query<{ id: string; stage: CoralStage | null }>(
      'SELECT id, stage FROM public."Coral" WHERE id = $1 AND "ownerId" = $2',
      [data.parentId, user.id]
    );
    if (parentRows[0]) {
      await pool.query(
        `INSERT INTO public."Lineage" ("parentId", "childId", "parentStageAtCut")
         VALUES ($1, $2, $3::"CoralStage") ON CONFLICT DO NOTHING`,
        [parentRows[0].id, specimen.id, parentRows[0].stage]
      );
    } else {
      invariant('specimen.parent_not_owned_by_creator', false, {
        parentId: data.parentId,
        specimenId: specimen.id,
      });
    }
  }

  if (data.photoUrl && data.photoKey) {
    await pool.query(
      `INSERT INTO public."CoralPhoto" (id, "s3Key", url, "coralId", status, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'pending', NOW())`,
      [data.photoKey, data.photoUrl, specimen.id]
    );
  }

  revalidatePath('/collection');

  // Welcome email on first specimen only
  const { rows: countRows } = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM public."Coral" WHERE "ownerId" = $1',
    [user.id]
  );
  if (parseInt(countRows[0].count, 10) === 1) {
    sendEmail(user.email, 'Your collection has started 🪸', welcomeTemplate(user.name ?? user.email))
      .catch((err) => console.error('[specimens] welcome email failed:', err));
  }

  return specimen;
}

export async function addSpecimenPhoto(data: {
  specimenId: string;
  photoKey: string;
  photoUrl: string;
}): Promise<void> {
  const user = await getCurrentUser();

  const { rows } = await pool.query<{ ownerId: string }>(
    `SELECT "ownerId" FROM public."Coral" WHERE id = $1`,
    [data.specimenId]
  );
  if (!rows[0] || rows[0].ownerId !== user.id) throw new Error('Not authorized');

  await pool.query(
    `INSERT INTO public."CoralPhoto" (id, "s3Key", url, "coralId", status, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, 'pending', NOW())`,
    [data.photoKey, data.photoUrl, data.specimenId]
  );

  revalidatePath(`/collection/${data.specimenId}`);
}

// ownerId/ownerUsername are null for unclaimed frags — rows created by
// createFrags that stay ownerless until someone claims the RF code.
export type SpecimenDetail = SpecimenRow & {
  ownerId: string | null;
  ownerUsername: string | null;
  ownerDisplayName: string | null;
  isOwner: boolean;
  fragsGiven: number;
  generationsBack: number;
  photoCount: number;
  threadCount: number;
  photos: Array<{ id: string; url: string; s3Key: string; status: string; createdAt: string }>;
};

export async function getPublicSpecimen(rfCodeOrId: string): Promise<SpecimenDetail | null> {
  const { rows } = await pool.query<SpecimenDetail>(
    `SELECT
       c.id, c.name, c.species, c.category, c."rfCode", c.origin, c.notes,
       c."identityHue", c."acquiredDate", c."createdAt", c."updatedAt",
       c."tankName", c."lightPar", c."flowLevel",
       c."stage", c."acquiredStage", c."generationFromMother", c."sourceColony", c."vendor",
       c."ownerId",
       u.username AS "ownerUsername",
       u."displayName" AS "ownerDisplayName",
       false AS "isOwner",
       NULL AS "coverPhotoUrl",
       0 AS "fragsGiven", 0 AS "generationsBack", 0 AS "photoCount", 0 AS "threadCount",
       COALESCE(
         json_agg(
           json_build_object('id', p.id, 'url', '/api/image?key=' || p."s3Key", 's3Key', p."s3Key", 'status', p.status, 'createdAt', p."createdAt")
           ORDER BY p."createdAt" ASC
         ) FILTER (WHERE p.id IS NOT NULL AND p.status = 'approved'),
         '[]'
       ) AS photos
     FROM public."Coral" c
     LEFT JOIN public."User" u ON u.id = c."ownerId"
     LEFT JOIN public."CoralPhoto" p ON p."coralId" = c.id
     WHERE c."rfCode" = $1 OR c.id = $1
     GROUP BY c.id, u.username, u."displayName"
     LIMIT 1`,
    [rfCodeOrId]
  );

  if (!rows[0]) {
    // This returning null 404s the public page. If the code exists in Coral,
    // the query is dropping a real row — which is exactly how unclaimed frags
    // were invisible for weeks (inner join on a NULL owner).
    const { rows: exists } = await pool.query<{ n: number }>(
      'SELECT COUNT(*)::int AS n FROM public."Coral" WHERE "rfCode" = $1 OR id = $1',
      [rfCodeOrId]
    );
    invariant('public_specimen.exists_but_query_returned_null', exists[0].n === 0, {
      rfCodeOrId,
    });
    return null;
  }

  return rows[0];
}

export async function getSpecimen(rfCodeOrId: string): Promise<SpecimenDetail | null> {
  let viewerId: string | null = null;
  try { viewerId = (await getCurrentUser()).id; } catch {}

  const { rows } = await pool.query<SpecimenDetail>(
    `SELECT
       c.id, c.name, c.species, c.category, c."rfCode", c.origin, c.notes,
       c."identityHue", c."acquiredDate", c."createdAt", c."updatedAt",
       c."tankName", c."lightPar", c."flowLevel",
       c."stage", c."acquiredStage", c."generationFromMother", c."sourceColony", c."vendor",
       c."ownerId",
       u.username AS "ownerUsername",
       u."displayName" AS "ownerDisplayName",
       (c."ownerId" = $2) AS "isOwner",
       NULL AS "coverPhotoUrl",
       (SELECT COUNT(*)::int FROM public."Lineage" WHERE "parentId" = c.id) AS "fragsGiven",
       (WITH RECURSIVE anc AS (
         SELECT "parentId" FROM public."Lineage" WHERE "childId" = c.id
         UNION ALL
         SELECT l."parentId" FROM public."Lineage" l JOIN anc ON l."childId" = anc."parentId"
       ) SELECT COUNT(*)::int FROM anc) AS "generationsBack",
       (SELECT COUNT(*)::int FROM public."CoralPhoto" WHERE "coralId" = c.id) AS "photoCount",
       (SELECT COUNT(*)::int FROM public."Thread" WHERE "anchorType" = 'specimen' AND "anchorId" = c.id::text) AS "threadCount",
       COALESCE(
         json_agg(
           json_build_object('id', p.id, 'url', '/api/image?key=' || p."s3Key", 's3Key', p."s3Key", 'status', p.status, 'createdAt', p."createdAt")
           ORDER BY p."createdAt" ASC
         ) FILTER (WHERE p.id IS NOT NULL AND (p.status = 'approved' OR c."ownerId" = $2)),
         '[]'
       ) AS photos
     FROM public."Coral" c
     JOIN public."User" u ON u.id = c."ownerId"
     LEFT JOIN public."CoralPhoto" p ON p."coralId" = c.id
     WHERE c."rfCode" = $1 OR c.id = $1
     GROUP BY c.id, u.username, u."displayName"
     LIMIT 1`,
    [rfCodeOrId, viewerId]
  );
  return rows[0] ?? null;
}

export async function updateSpecimen(id: string, data: {
  name: string;
  species?: string;
  category: string;
  origin?: string;
  notes?: string;
  tankName?: string;
  lightPar?: string;
  flowLevel?: string;
  stage?: CoralStage;
  acquiredStage?: CoralStage;
  generationFromMother?: number;
  sourceColony?: string;
  vendor?: string;
}): Promise<void> {
  const user = await getCurrentUser();
  const res = await pool.query(
    `UPDATE public."Coral"
     SET name=$1, species=$2, category=$3::\"CoralCategory\", origin=$4, notes=$5,
         "tankName"=$6, "lightPar"=$7, "flowLevel"=$8,
         stage=$9::\"CoralStage\", "acquiredStage"=$10::\"CoralStage\",
         "generationFromMother"=$11, "sourceColony"=$12, vendor=$13,
         "updatedAt"=NOW()
     WHERE id=$14 AND "ownerId"=$15`,
    [
      data.name, data.species ?? null, data.category, data.origin ?? null, data.notes ?? null,
      data.tankName ?? null, data.lightPar ?? null, data.flowLevel ?? null,
      data.stage ?? null, data.acquiredStage ?? null,
      data.generationFromMother ?? null, data.sourceColony ?? null, data.vendor ?? null,
      id, user.id,
    ]
  );
  invariant('specimen.update_matched_no_rows', res.rowCount === 1, { specimenId: id });
  revalidatePath('/collection');
  revalidatePath(`/collection/${id}`);
}

export type PublicSpecimenStub = {
  id: string;
  name: string;
  rfCode: string | null;
  identityHue: number | null;
  category: string | null;
  coverPhotoUrl: string | null;
};

export async function getMoreByOwner(ownerId: string, excludeId: string, limit = 4): Promise<PublicSpecimenStub[]> {
  const { rows } = await pool.query<PublicSpecimenStub>(
    `SELECT c.id, c.name, c."rfCode", c."identityHue", c.category,
       (SELECT '/api/image?key=' || p."s3Key" FROM public."CoralPhoto" p
        WHERE p."coralId" = c.id AND p.status = 'approved'
        ORDER BY p."createdAt" ASC LIMIT 1) AS "coverPhotoUrl"
     FROM public."Coral" c
     WHERE c."ownerId" = $1 AND c.id != $2
     ORDER BY c."createdAt" DESC
     LIMIT $3`,
    [ownerId, excludeId, limit]
  );
  return rows;
}

export async function searchCoralNames(query: string): Promise<string[]> {
  if (query.length < 2) return [];
  const { rows } = await pool.query<{ name: string }>(
    `SELECT DISTINCT name FROM public."Coral" WHERE name ILIKE $1 ORDER BY name LIMIT 8`,
    [`${query}%`]
  );
  return rows.map(r => r.name);
}

export async function deleteSpecimen(id: string): Promise<void> {
  const user = await getCurrentUser();
  await pool.query(
    'DELETE FROM public."Coral" WHERE id = $1 AND "ownerId" = $2',
    [id, user.id]
  );
  revalidatePath('/collection');
}

export type SitemapEntry = { path: string; updatedAt: string };

/**
 * Every publicly reachable URL, for the sitemap. Unclaimed frags are included
 * deliberately — they resolve to a real claim page and are exactly what someone
 * scanning a frag tag or googling a code should land on.
 */
export async function getPublicUrls(): Promise<SitemapEntry[]> {
  const { rows: corals } = await pool.query<SitemapEntry>(
    `SELECT '/coral/' || COALESCE(c."rfCode", c.id) AS path,
            GREATEST(c."updatedAt", c."createdAt") AS "updatedAt"
     FROM public."Coral" c
     WHERE c."rfCode" IS NOT NULL
     ORDER BY c."updatedAt" DESC
     LIMIT 5000`
  );

  const { rows: users } = await pool.query<SitemapEntry>(
    `SELECT '/users/' || u.username AS path, NOW() AS "updatedAt"
     FROM public."User" u
     WHERE u.username IS NOT NULL
       AND EXISTS (SELECT 1 FROM public."Coral" c WHERE c."ownerId" = u.id)
     LIMIT 5000`
  );

  return [...corals, ...users];
}
