'use server';

import { pool } from '@/lib/db';

export type DashboardStats = {
  coralCount: number;
  fragsProduced: number;
  fragsReceived: number;
};

export type DashboardCoral = {
  id: string;
  name: string;
  rfCode: string | null;
  identityHue: number | null;
  category: string | null;
  coverUrl: string | null;
  coverPending: boolean | null;
  createdAt: string;
};

export type MyListing = {
  id: string;
  coralId: string;
  coralName: string;
  identityHue: number | null;
  price: number | null;
  qty: number | null;
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const { rows } = await pool.query<DashboardStats>(
    `SELECT
       (SELECT COUNT(*)::int FROM public."Coral" WHERE "ownerId" = $1) AS "coralCount",
       (SELECT COUNT(*)::int FROM public."Lineage" l
        JOIN public."Coral" c ON c.id = l."parentId" WHERE c."ownerId" = $1) AS "fragsProduced",
       (SELECT COUNT(*)::int FROM public."Lineage" l
        JOIN public."Coral" c ON c.id = l."childId" WHERE c."ownerId" = $1) AS "fragsReceived"`,
    [userId]
  );
  return rows[0];
}

export async function getRecentCorals(userId: string, limit = 4): Promise<DashboardCoral[]> {
  const { rows } = await pool.query<DashboardCoral>(
    `SELECT c.id, c.name, c."rfCode", c."identityHue", c.category, c."createdAt",
       (SELECT '/api/image?key=' || p."s3Key" FROM public."CoralPhoto" p WHERE p."coralId" = c.id ORDER BY CASE WHEN p.status = 'approved' THEN 0 ELSE 1 END, p."createdAt" ASC LIMIT 1) AS "coverUrl",
       (SELECT p.status = 'pending' FROM public."CoralPhoto" p WHERE p."coralId" = c.id ORDER BY CASE WHEN p.status = 'approved' THEN 0 ELSE 1 END, p."createdAt" ASC LIMIT 1) AS "coverPending"
     FROM public."Coral" c
     WHERE c."ownerId" = $1
     ORDER BY c."createdAt" DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

export type MyActivity = {
  id: string;
  kind: 'specimen' | 'lineage' | 'listing';
  createdAt: string;
  specimenName: string;
  specimenRfCode: string | null;
  parentName: string | null;
};

export async function getMyActivity(userId: string, limit = 8): Promise<MyActivity[]> {
  const { rows } = await pool.query<MyActivity>(
    `SELECT id, kind, "createdAt", "specimenName", "specimenRfCode", "parentName" FROM (
       SELECT
         'specimen-' || c.id AS id,
         'specimen'::text AS kind,
         c."createdAt",
         c.name AS "specimenName",
         c."rfCode" AS "specimenRfCode",
         NULL::text AS "parentName"
       FROM public."Coral" c
       WHERE c."ownerId" = $1 AND c."ownerId" IS NOT NULL

       UNION ALL

       SELECT
         'lineage-' || l.id AS id,
         'lineage'::text AS kind,
         l."createdAt",
         child.name AS "specimenName",
         child."rfCode" AS "specimenRfCode",
         parent.name AS "parentName"
       FROM public."Lineage" l
       JOIN public."Coral" child ON child.id = l."childId"
       JOIN public."Coral" parent ON parent.id = l."parentId"
       WHERE child."ownerId" = $1

       UNION ALL

       SELECT
         'listing-' || fl.id AS id,
         'listing'::text AS kind,
         fl."createdAt",
         c.name AS "specimenName",
         c."rfCode" AS "specimenRfCode",
         NULL::text AS "parentName"
       FROM public."FragListing" fl
       JOIN public."Coral" c ON c.id = fl."coralId"
       WHERE fl."userId" = $1
     ) events
     ORDER BY "createdAt" DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

export async function getMyListings(userId: string): Promise<MyListing[]> {
  const { rows } = await pool.query<MyListing>(
    `SELECT fl.id, fl."coralId", c.name AS "coralName", c."identityHue",
            fl.price, fl.qty
     FROM public."FragListing" fl
     JOIN public."Coral" c ON c.id = fl."coralId"
     WHERE fl."userId" = $1
     ORDER BY fl."createdAt" DESC
     LIMIT 5`,
    [userId]
  );
  return rows;
}
