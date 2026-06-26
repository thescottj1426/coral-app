'use server';

import { headers } from 'next/headers';
import { pool } from '@/lib/db';
import { auth } from '@/lib/auth';

export type FeedEventKind = 'specimen' | 'lineage' | 'listing';

export type FeedItem = {
  id: string;
  kind: FeedEventKind;
  createdAt: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName: string | null;
  actorHue: number;
  // specimen / lineage
  specimenId?: string;
  specimenName?: string;
  specimenRfCode?: string | null;
  specimenCategory?: string | null;
  specimenSpecies?: string | null;
  specimenIdentityHue?: number | null;
  specimenCoverUrl?: string | null;
  specimenNotes?: string | null;
  // lineage extras
  parentId?: string;
  parentName?: string;
  parentRfCode?: string | null;
  parentHue?: number | null;
  // listing extras
  listingId?: string;
  listingPrice?: number | null;
  listingQty?: number | null;
  listingNotes?: string | null;
};

export async function getFeedItems(limit = 30): Promise<FeedItem[]> {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const currentUserId = session?.user?.id ?? null;

  // deterministic hue from string
  const { rows } = await pool.query<FeedItem>(
    `WITH actor_hue AS (
       SELECT id, ABS(HASHTEXT(id)) % 360 AS hue FROM public."User"
     ),
     new_specimens AS (
       SELECT
         'specimen-' || c.id AS id,
         'specimen'::text AS kind,
         c."createdAt",
         u.id AS "actorId",
         u.username AS "actorUsername",
         u."displayName" AS "actorDisplayName",
         ah.hue AS "actorHue",
         c.id AS "specimenId",
         c.name AS "specimenName",
         c."rfCode" AS "specimenRfCode",
         c.category AS "specimenCategory",
         c.species AS "specimenSpecies",
         c."identityHue" AS "specimenIdentityHue",
         c.notes AS "specimenNotes",
         (SELECT '/api/image?key=' || p."s3Key"
          FROM public."CoralPhoto" p
          WHERE p."coralId" = c.id AND p.status = 'approved'
          ORDER BY p."createdAt" ASC LIMIT 1) AS "specimenCoverUrl",
         NULL::text AS "parentId",
         NULL::text AS "parentName",
         NULL::text AS "parentRfCode",
         NULL::int AS "parentHue",
         NULL::text AS "listingId",
         NULL::float8 AS "listingPrice",
         NULL::int AS "listingQty",
         NULL::text AS "listingNotes"
       FROM public."Coral" c
       JOIN public."User" u ON u.id = c."ownerId"
       JOIN actor_hue ah ON ah.id = u.id
     ),
     new_lineage AS (
       SELECT
         'lineage-' || l.id AS id,
         'lineage'::text AS kind,
         l."createdAt",
         u.id AS "actorId",
         u.username AS "actorUsername",
         u."displayName" AS "actorDisplayName",
         ah.hue AS "actorHue",
         child.id AS "specimenId",
         child.name AS "specimenName",
         child."rfCode" AS "specimenRfCode",
         child.category AS "specimenCategory",
         child.species AS "specimenSpecies",
         child."identityHue" AS "specimenIdentityHue",
         child.notes AS "specimenNotes",
         (SELECT '/api/image?key=' || p."s3Key"
          FROM public."CoralPhoto" p
          WHERE p."coralId" = child.id
          ORDER BY p."createdAt" ASC LIMIT 1) AS "specimenCoverUrl",
         parent.id AS "parentId",
         parent.name AS "parentName",
         parent."rfCode" AS "parentRfCode",
         parent."identityHue" AS "parentHue",
         NULL::text AS "listingId",
         NULL::float8 AS "listingPrice",
         NULL::int AS "listingQty",
         NULL::text AS "listingNotes"
       FROM public."Lineage" l
       JOIN public."Coral" child ON child.id = l."childId"
       JOIN public."Coral" parent ON parent.id = l."parentId"
       JOIN public."User" u ON u.id = child."ownerId"
       JOIN actor_hue ah ON ah.id = u.id
     ),
     new_listings AS (
       SELECT
         'listing-' || fl.id AS id,
         'listing'::text AS kind,
         fl."createdAt",
         u.id AS "actorId",
         u.username AS "actorUsername",
         u."displayName" AS "actorDisplayName",
         ah.hue AS "actorHue",
         c.id AS "specimenId",
         c.name AS "specimenName",
         c."rfCode" AS "specimenRfCode",
         c.category AS "specimenCategory",
         c.species AS "specimenSpecies",
         c."identityHue" AS "specimenIdentityHue",
         c.notes AS "specimenNotes",
         (SELECT '/api/image?key=' || p."s3Key"
          FROM public."CoralPhoto" p
          WHERE p."coralId" = c.id
          ORDER BY p."createdAt" ASC LIMIT 1) AS "specimenCoverUrl",
         NULL::text AS "parentId",
         NULL::text AS "parentName",
         NULL::text AS "parentRfCode",
         NULL::int AS "parentHue",
         fl.id AS "listingId",
         fl.price AS "listingPrice",
         fl.qty AS "listingQty",
         fl.notes AS "listingNotes"
       FROM public."FragListing" fl
       JOIN public."Coral" c ON c.id = fl."coralId"
       JOIN public."User" u ON u.id = fl."userId"
       JOIN actor_hue ah ON ah.id = u.id
     )
     SELECT * FROM new_specimens
     UNION ALL SELECT * FROM new_lineage
     UNION ALL SELECT * FROM new_listings
     ORDER BY "createdAt" DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}
