'use server';

import { pool } from '@/lib/db';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';
import * as log from '@/lib/log';

/** No session needed: the signed token is the proof, so it works from any inbox. */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const userId = verifyUnsubscribeToken(token);
  if (!userId) return false;
  const res = await pool.query(
    `UPDATE public."User" SET "emailOptOut" = true, "updatedAt" = NOW() WHERE id = $1`,
    [userId]
  );
  log.event('email.unsubscribed', { found: res.rowCount === 1 });
  return res.rowCount === 1;
}
