'use server';

import { headers } from 'next/headers';
import { auth } from './auth';
import { pool } from './db';

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');

  // Look up the app User.id by email — handles migration from old auth system
  // where User.id (CUID) may differ from session.user.id (better-auth ID).
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM public."User" WHERE email = $1`,
    [session.user.email]
  );

  if (rows.length > 0) {
    return { ...session.user, id: rows[0].id };
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

  return session.user;
}
