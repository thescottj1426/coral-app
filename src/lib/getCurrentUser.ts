'use server';

import { headers } from 'next/headers';
import { auth } from './auth';
import { pool } from './db';
import { FREE_CAP_ENABLED_AT, type Plan } from './entitlements';

type UserRow = { id: string; plan: Plan; capExempt: boolean };

// capExempt is computed in SQL: "createdAt" is timestamp-without-tz, and the Neon
// driver parses it into host-local time, so comparing in JS shifts the cutoff.
const SELECT_USER = `
  SELECT id,
         plan::text AS plan,
         ($2::timestamp IS NOT NULL AND "createdAt" < $2::timestamp) AS "capExempt"
  FROM public."User"
  WHERE email = $1`;

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');

  // Look up the app User.id by email — handles migration from old auth system
  // where User.id (CUID) may differ from session.user.id (better-auth ID).
  const { rows } = await pool.query<UserRow>(SELECT_USER, [session.user.email, FREE_CAP_ENABLED_AT]);

  if (rows.length > 0) {
    return { ...session.user, ...rows[0] };
  }

  // No User record — self-heal
  const base = (session.user.email?.split('@')[0] ?? 'user')
    .toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 15);
  const fallbackUsername = (base + '_' + session.user.id.slice(0, 6).toLowerCase()).slice(0, 30);
  await pool.query(
    `INSERT INTO public."User" (id, "neonAuthId", username, email, "onboardingComplete", "isSeller", verified, plan, "updatedAt")
     VALUES ($1, $2, $3, $4, false, false, false, 'FREE', NOW())
     ON CONFLICT DO NOTHING`,
    [session.user.id, session.user.id, fallbackUsername, session.user.email]
  ).catch(() => {});

  // Re-read so every caller gets the same shape, always carrying a real User.id.
  const { rows: healed } = await pool.query<UserRow>(SELECT_USER, [session.user.email, FREE_CAP_ENABLED_AT]);
  if (healed.length === 0) throw new Error('Could not resolve user record');

  return { ...session.user, ...healed[0] };
}
