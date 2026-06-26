'use server';

import { headers } from 'next/headers';
import { pool } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { SpecimenRow } from './specimens';

export type UserProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  location: string | null;
  locationCity: string | null;
  locationState: string | null;
  verified: boolean;
  isSeller: boolean;
  shopName: string | null;
  shopBio: string | null;
  specialty: string[] | null;
  createdAt: string;
  specimenCount: number;
  bloodlineCount: number;
  sharedCount: number;
  followerCount: number;
  followingCount: number;
  categoryBreakdown: Record<string, number>;
};

export async function getUserProfile(username: string): Promise<UserProfile | null> {
  const [profileRows, breakdownRows] = await Promise.all([
    pool.query<Omit<UserProfile, 'categoryBreakdown'>>(
      `SELECT u.id, u.username, u."displayName", u.bio, u.location,
              u."locationCity", u."locationState", u.verified, u."isSeller",
              u."shopName", u."shopBio", u.specialty,
              u."createdAt",
              COUNT(DISTINCT c.id)::int AS "specimenCount",
              COUNT(DISTINCT l."parentId")::int AS "bloodlineCount",
              0::int AS "sharedCount",
              0::int AS "followerCount",
              0::int AS "followingCount"
       FROM public."User" u
       LEFT JOIN public."Coral" c ON c."ownerId" = u.id
       LEFT JOIN public."Lineage" l ON l."parentId" = c.id
       WHERE u.username = $1
       GROUP BY u.id`,
      [username]
    ),
    pool.query<{ category: string; count: number }>(
      `SELECT category, COUNT(*)::int AS count
       FROM public."Coral" c
       JOIN public."User" u ON u.id = c."ownerId"
       WHERE u.username = $1 AND category IS NOT NULL
       GROUP BY category`,
      [username]
    ),
  ]);
  if (!profileRows.rows[0]) return null;
  const categoryBreakdown: Record<string, number> = {};
  for (const row of breakdownRows.rows) {
    categoryBreakdown[row.category] = row.count;
  }
  const raw = profileRows.rows[0];
  // Neon serverless returns Postgres arrays as strings like "{SPS,LPS}" — normalize to JS array
  const rawSpecialty = raw.specialty as unknown;
  let specialty: string[] | null = null;
  if (Array.isArray(rawSpecialty)) {
    specialty = rawSpecialty as string[];
  } else if (typeof rawSpecialty === 'string' && (rawSpecialty as string).length > 2) {
    specialty = (rawSpecialty as string).slice(1, -1).split(',').filter(Boolean);
  }
  return { ...raw, specialty, categoryBreakdown };
}

export async function getUserSpecimens(userId: string): Promise<SpecimenRow[]> {
  const { rows } = await pool.query<SpecimenRow>(
    `SELECT
       c.id, c.name, c.species, c.category, c."rfCode", c.origin, c.notes,
       c."identityHue", c."acquiredDate", c."createdAt",
       (SELECT '/api/image?key=' || p."s3Key" FROM public."CoralPhoto" p WHERE p."coralId" = c.id ORDER BY p."createdAt" ASC LIMIT 1) AS "coverPhotoUrl"
     FROM public."Coral" c
     WHERE c."ownerId" = $1
     ORDER BY c."createdAt" DESC`,
    [userId]
  );
  return rows;
}

export type BloodlineRow = {
  rootId: string;
  rootName: string;
  rfCode: string | null;
  identityHue: number | null;
  generationCount: number;
  fragCount: number;
  keeperCount: number;
};

export async function getUserBloodlines(userId: string): Promise<BloodlineRow[]> {
  const { rows } = await pool.query<BloodlineRow>(
    `WITH root_corals AS (
       SELECT c.id, c.name, c."rfCode", c."identityHue"
       FROM public."Coral" c
       WHERE c."ownerId" = $1
         AND c.id IN (SELECT "parentId" FROM public."Lineage")
         AND c.id NOT IN (SELECT "childId" FROM public."Lineage")
     ),
     lineage_stats AS (
       SELECT
         root.id AS "rootId",
         COUNT(DISTINCT l."childId")::int AS "fragCount",
         COUNT(DISTINCT child_owner."ownerId")::int AS "keeperCount"
       FROM root_corals root
       JOIN LATERAL (
         WITH RECURSIVE chain AS (
           SELECT "childId", "parentId", 1 AS depth FROM public."Lineage" WHERE "parentId" = root.id
           UNION ALL
           SELECT l."childId", l."parentId", chain.depth + 1
           FROM public."Lineage" l JOIN chain ON l."parentId" = chain."childId"
           WHERE chain.depth < 10
         ) SELECT "childId" FROM chain
       ) l ON true
       JOIN public."Coral" child_owner ON child_owner.id = l."childId"
       GROUP BY root.id
     )
     SELECT
       root.id AS "rootId", root.name AS "rootName", root."rfCode",
       root."identityHue",
       COALESCE(stats."fragCount", 0) AS "fragCount",
       COALESCE(stats."keeperCount", 0) AS "keeperCount",
       1 AS "generationCount"
     FROM root_corals root
     LEFT JOIN lineage_stats stats ON stats."rootId" = root.id
     ORDER BY stats."fragCount" DESC NULLS LAST`,
    [userId]
  );
  return rows;
}

export async function getSessionUsername(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
