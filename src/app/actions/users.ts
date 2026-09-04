'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db';
import { auth } from '@/lib/auth';
import { invariant } from '@/lib/log';
import { getCurrentUser } from '@/lib/getCurrentUser';
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
              (SELECT COUNT(*)::int FROM public."Follow" f WHERE f."followingId" = u.id) AS "followerCount",
              (SELECT COUNT(*)::int FROM public."Follow" f WHERE f."followerId" = u.id) AS "followingCount"
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

export type UpdateProfileData = {
  displayName?: string;
  bio?: string;
  location?: string;
  isSeller?: boolean;
  shopName?: string;
  shopBio?: string;
  specialty?: string[];
};

// Explicit whitelist — the only columns updateProfile may ever write.
// Privileged columns (plan, verified, isAdmin) must never be added here;
// plan is written only by setPlan() in @/lib/entitlements.
const PROFILE_COLUMNS: Record<keyof UpdateProfileData, string> = {
  displayName: '"displayName"',
  bio:         'bio',
  location:    'location',
  isSeller:    '"isSeller"',
  shopName:    '"shopName"',
  shopBio:     '"shopBio"',
  specialty:   'specialty',
};

function normalizeProfileValue(key: keyof UpdateProfileData, data: UpdateProfileData): unknown {
  if (key === 'isSeller') return data.isSeller ?? false;
  if (key === 'specialty') return data.specialty?.length ? `{${data.specialty.join(',')}}` : null;
  return data[key] ?? null;
}

export async function updateProfile(data: UpdateProfileData): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');
  // Matching session.user.id against User.id silently updates zero rows for
  // accounts migrated from the old auth system — the exact mismatch
  // getCurrentUser exists to resolve.
  const userId = (await getCurrentUser()).id;

  const setClauses: string[] = [];
  const params: unknown[] = [userId];
  let i = 2;

  for (const key of Object.keys(data) as (keyof UpdateProfileData)[]) {
    const column = PROFILE_COLUMNS[key];
    if (!column) continue;
    setClauses.push(`${column} = $${i++}`);
    params.push(normalizeProfileValue(key, data));
  }

  if (!setClauses.length) return;
  const res = await pool.query(`UPDATE public."User" SET ${setClauses.join(', ')} WHERE id = $1`, params);

  // Matches session.user.id against User.id. For accounts migrated from the old
  // auth system those differ, so this silently updates nothing — the exact bug
  // getCurrentUser exists to work around. Report it rather than failing quietly.
  invariant('profile.update_matched_no_rows', res.rowCount === 1, {
    userId,
    rowCount: res.rowCount ?? -1,
  });

  revalidatePath(`/users/${session.user.name}`);
}

export async function followUser(targetUserId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');
  await pool.query(
    `CREATE TABLE IF NOT EXISTS public."Follow" (
       id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
       "followerId" TEXT NOT NULL,
       "followingId" TEXT NOT NULL,
       "createdAt" TIMESTAMPTZ DEFAULT NOW(),
       UNIQUE("followerId", "followingId")
     )`,
    []
  );
  await pool.query(
    `INSERT INTO public."Follow" ("followerId", "followingId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [session.user.id, targetUserId]
  );
  revalidatePath(`/users`);
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');
  await pool.query(
    `DELETE FROM public."Follow" WHERE "followerId" = $1 AND "followingId" = $2`,
    [session.user.id, targetUserId]
  );
  revalidatePath(`/users`);
}

export async function getIsFollowing(viewerId: string, targetUserId: string): Promise<boolean> {
  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM public."Follow" WHERE "followerId" = $1 AND "followingId" = $2 LIMIT 1`,
      [viewerId, targetUserId]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}
