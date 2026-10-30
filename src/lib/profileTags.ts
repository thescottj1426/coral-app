import { pool } from '@/lib/db';

/** Accounts created before this are Pilot Reefers. Null until the public launch is scheduled — everyone joining now is a pilot. */
export const PUBLIC_LAUNCH_AT: string | null = null;

const FAMILY_FOUNDER_DESCENDANTS = 10;

export type ProfileTag = 'pilot' | 'first_frag' | 'family_founder';

export const PROFILE_TAG_LABELS: Record<ProfileTag, { label: string; hint: string }> = {
  pilot: { label: 'Pilot Reefer', hint: 'Joined before the public launch' },
  first_frag: { label: 'First Frag', hint: 'Received a coral with a transfer code' },
  family_founder: { label: 'Family Founder', hint: `A colony with ${FAMILY_FOUNDER_DESCENDANTS}+ descendants` },
};

export async function getProfileTags(userId: string): Promise<ProfileTag[]> {
  const { rows } = await pool.query<{ pilot: boolean; firstFrag: boolean; founder: boolean }>(
    `WITH RECURSIVE down AS (
       SELECT c.id AS root, c.id, 0 AS depth FROM public."Coral" c WHERE c."ownerId" = $1
       UNION ALL
       SELECT down.root, l."childId", down.depth + 1
       FROM public."Lineage" l JOIN down ON l."parentId" = down.id
       WHERE down.depth < 30
     )
     SELECT
       ($2::timestamp IS NULL OR u."createdAt" < $2::timestamp) AS pilot,
       EXISTS (SELECT 1 FROM public."TransferCode" t WHERE t."redeemedById" = u.id) AS "firstFrag",
       EXISTS (
         SELECT 1 FROM down WHERE depth > 0 GROUP BY root HAVING COUNT(*) >= $3
       ) AS founder
     FROM public."User" u WHERE u.id = $1`,
    [userId, PUBLIC_LAUNCH_AT, FAMILY_FOUNDER_DESCENDANTS]
  );
  const r = rows[0];
  if (!r) return [];
  return [
    r.pilot && 'pilot',
    r.firstFrag && 'first_frag',
    r.founder && 'family_founder',
  ].filter(Boolean) as ProfileTag[];
}
