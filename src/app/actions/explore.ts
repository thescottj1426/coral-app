'use server';

import { pool } from '@/lib/db';
import type { SpecimenRow } from './specimens';

export type ExploreSpecimen = SpecimenRow & {
  ownerUsername: string;
  ownerDisplayName: string | null;
};

export type ExploreCollector = {
  id: string;
  username: string;
  displayName: string | null;
  specimenCount: number;
};

const COVER_PHOTO_SQL = `(SELECT '/api/image?key=' || p."s3Key" FROM public."CoralPhoto" p WHERE p."coralId" = c.id AND p.status = 'approved' ORDER BY p."createdAt" ASC LIMIT 1)`;

export async function getExploreSpecimens(): Promise<ExploreSpecimen[]> {
  const { rows } = await pool.query<ExploreSpecimen>(
    `SELECT
       c.id, c.name, c.species, c.category, c."rfCode", c.origin, c.notes,
       c."identityHue", c."acquiredDate", c."createdAt",
       ${COVER_PHOTO_SQL} AS "coverPhotoUrl",
       u.username AS "ownerUsername",
       u."displayName" AS "ownerDisplayName"
     FROM public."Coral" c
     JOIN public."User" u ON u.id = c."ownerId"
     -- A frag you cut and kept is the same genotype in a smaller piece, and it
     -- carries the parent's name, so listing both shows the same coral twice —
     -- the frag's card being the emptier of the two. Hidden here only; it stays
     -- in /collection, on the parent's page, and on its own /coral page.
     --
     -- Scoped to same-owner deliberately: a frag CLAIMED from another keeper is
     -- a real acquisition into a new collection and belongs in Explore.
     WHERE NOT EXISTS (
       SELECT 1
         FROM public."Lineage" l
         JOIN public."Coral" par ON par.id = l."parentId"
        WHERE l."childId" = c.id
          AND par."ownerId" = c."ownerId"
     )
     ORDER BY c."createdAt" DESC
     LIMIT 60`
  );
  return rows;
}

export async function getExploreCollectors(): Promise<ExploreCollector[]> {
  const { rows } = await pool.query<ExploreCollector>(
    `SELECT u.id, u.username, u."displayName", COUNT(c.id)::int AS "specimenCount"
     FROM public."User" u
     LEFT JOIN public."Coral" c ON c."ownerId" = u.id
     GROUP BY u.id, u.username, u."displayName", u."createdAt"
     ORDER BY "specimenCount" DESC, u."createdAt" DESC
     LIMIT 20`
  );
  return rows;
}

export async function searchSpecimens(q: string): Promise<ExploreSpecimen[]> {
  if (!q.trim()) return [];
  const pattern = `%${q.trim()}%`;
  const { rows } = await pool.query<ExploreSpecimen>(
    `SELECT
       c.id, c.name, c.species, c.category, c."rfCode", c.origin, c.notes,
       c."identityHue", c."acquiredDate", c."createdAt",
       ${COVER_PHOTO_SQL} AS "coverPhotoUrl",
       u.username AS "ownerUsername",
       u."displayName" AS "ownerDisplayName"
     FROM public."Coral" c
     JOIN public."User" u ON u.id = c."ownerId"
     WHERE c.name ILIKE $1
        OR c.species ILIKE $1
        OR u.username ILIKE $1
        OR c."rfCode" ILIKE $1
     ORDER BY c."createdAt" DESC
     LIMIT 30`,
    [pattern]
  );
  return rows;
}
