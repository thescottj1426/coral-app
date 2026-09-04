import { pool } from '@/lib/db';

export type Plan = 'FREE' | 'COLLECTOR';

// Accounts created before this naive-UTC timestamp are exempt from the cap.
// Set earlier than the oldest account (2026-02-24), so the cap applies to everyone.
// null disables the cap entirely; move this date forward to grandfather a cohort.
export const FREE_CAP_ENABLED_AT: string | null = '2026-01-01 00:00:00';
export const FREE_SPECIMEN_CAP = 50;

export type PlanContext = {
  id: string;
  plan: Plan;
  capExempt: boolean;
};

// null means unlimited — never Infinity, which does not survive the RSC boundary.
export function specimenCapFor(user: PlanContext): number | null {
  if (FREE_CAP_ENABLED_AT === null) return null;
  if (user.plan === 'COLLECTOR') return null;
  if (user.capExempt) return null;
  return FREE_SPECIMEN_CAP;
}

export type CapCheck = { ok: true } | { ok: false; error: string };

export async function checkSpecimenCap(user: PlanContext): Promise<CapCheck> {
  const cap = specimenCapFor(user);
  if (cap === null) return { ok: true };

  const { rows } = await pool.query<{ n: number }>(
    // Lost/sold corals stay in the record and in the lineage graph, but they
    // are not part of a living collection, so they do not consume a slot.
    `SELECT COUNT(*)::int AS n FROM public."Coral"
      WHERE "ownerId" = $1 AND status = 'ALIVE'::"CoralStatus"`,
    [user.id]
  );
  if (rows[0].n < cap) return { ok: true };

  return {
    ok: false,
    error: `You've reached the free limit of ${cap} specimens. Upgrade to keep adding.`,
  };
}

export async function setPlan(userId: string, plan: Plan): Promise<void> {
  await pool.query('UPDATE public."User" SET plan = $1::"UserPlan", "updatedAt" = NOW() WHERE id = $2', [
    plan,
    userId,
  ]);
}
