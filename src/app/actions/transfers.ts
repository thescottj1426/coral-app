'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { checkSpecimenCap } from '@/lib/entitlements';
import { createNotification } from '@/lib/notifications';
import { recordOwnershipEvent } from '@/lib/ownershipEvents';
import {
  generateTransferCode,
  hashTransferCode,
  normalizeTransferCode,
  TRANSFER_CODE_TTL_DAYS,
} from '@/lib/transferCode';
import * as log from '@/lib/log';
import { getLineage, type LineageNode } from '@/app/actions/lineage';

const MAX_FAILED_PER_HOUR = 10;
const BATCH_LIMIT = 50;

/** The owner may hand a coral on, and so may whoever cut an unclaimed frag — a farm's frags are ownerless until claimed. */
async function issuableCoralIds(coralIds: string[], userId: string): Promise<Map<string, string | null>> {
  const { rows } = await pool.query<{ id: string; rfCode: string | null }>(
    `SELECT c.id, c."rfCode"
     FROM public."Coral" c
     LEFT JOIN public."Lineage" l ON l."childId" = c.id
     LEFT JOIN public."Coral" p ON p.id = l."parentId"
     WHERE c.id = ANY($1::text[])
       AND c.status = 'ALIVE'
       AND (c."ownerId" = $2 OR (c."ownerId" IS NULL AND p."ownerId" = $2))`,
    [coralIds, userId]
  );
  return new Map(rows.map((r) => [r.id, r.rfCode]));
}

export type IssuedCode = { coralId: string; rfCode: string | null; code: string; expiresAt: string };

/** Codes are returned once and only their hash is stored — there is no way to show one again. */
export async function createTransferCodes(coralIds: string[]): Promise<IssuedCode[] | { error: string }> {
  const user = await getCurrentUser();
  const ids = [...new Set(coralIds)].slice(0, BATCH_LIMIT);
  if (ids.length === 0) return { error: 'No corals selected' };

  const allowed = await issuableCoralIds(ids, user.id);
  if (allowed.size !== ids.length) return { error: 'You can only create codes for your own corals and frags' };

  const issued: IssuedCode[] = [];
  for (const coralId of ids) {
    const code = generateTransferCode();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE public."TransferCode" SET "cancelledAt" = NOW()
         WHERE "coralId" = $1 AND "redeemedAt" IS NULL AND "cancelledAt" IS NULL`,
        [coralId]
      );
      const { rows } = await client.query<{ expiresAt: string }>(
        `INSERT INTO public."TransferCode" (id, "coralId", "createdById", "codeHash", "expiresAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW() + make_interval(days => $4))
         RETURNING "expiresAt"`,
        [coralId, user.id, hashTransferCode(code), TRANSFER_CODE_TTL_DAYS]
      );
      await client.query('COMMIT');
      issued.push({ coralId, rfCode: allowed.get(coralId) ?? null, code, expiresAt: rows[0].expiresAt });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  log.event('transfer_code.created', { count: issued.length });
  return issued;
}

export type TransferCodeStatus = { createdAt: string; expiresAt: string; expired: boolean } | null;

export async function getTransferCodeStatus(coralId: string): Promise<TransferCodeStatus> {
  const user = await getCurrentUser();
  if ((await issuableCoralIds([coralId], user.id)).size === 0) return null;
  const { rows } = await pool.query<{ createdAt: string; expiresAt: string; expired: boolean }>(
    `SELECT "createdAt", "expiresAt", "expiresAt" < NOW() AS expired
     FROM public."TransferCode"
     WHERE "coralId" = $1 AND "redeemedAt" IS NULL AND "cancelledAt" IS NULL`,
    [coralId]
  );
  return rows[0] ?? null;
}

export async function cancelTransferCode(coralId: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if ((await issuableCoralIds([coralId], user.id)).size === 0) return { error: 'Not authorized' };
  await pool.query(
    `UPDATE public."TransferCode" SET "cancelledAt" = NOW()
     WHERE "coralId" = $1 AND "redeemedAt" IS NULL AND "cancelledAt" IS NULL`,
    [coralId]
  );
  return {};
}

async function rateLimited(userId: string) {
  const { rows } = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM public."TransferCodeAttempt"
     WHERE "userId" = $1 AND "createdAt" > NOW() - INTERVAL '1 hour'`,
    [userId]
  );
  return rows[0].n >= MAX_FAILED_PER_HOUR;
}

async function recordFailedAttempt(userId: string) {
  await pool.query(`INSERT INTO public."TransferCodeAttempt" ("userId") VALUES ($1)`, [userId]);
}

const TOO_MANY = 'Too many wrong codes. Try again in an hour.';
const NOT_FOUND = 'That transfer code doesn’t match any coral. Check it against your order email.';

type CodeRow = {
  id: string;
  coralId: string;
  createdById: string;
  expired: boolean;
  redeemedAt: string | null;
  cancelledAt: string | null;
  ownerId: string | null;
  rfCode: string | null;
};

function codeProblem(row: CodeRow, userId: string): string | null {
  if (row.cancelledAt) return 'This code was cancelled. Ask the seller for a new one.';
  if (row.redeemedAt) return 'This code has already been used.';
  if (row.expired) return 'This code has expired. Ask the seller for a new one.';
  if (row.ownerId === userId) return 'This coral is already in your collection.';
  return null;
}

export type TransferPreview = {
  coralId: string;
  name: string;
  species: string | null;
  rfCode: string | null;
  fromUsername: string | null;
  ancestors: LineageNode[];
};

export async function lookupTransferCode(input: string): Promise<TransferPreview | { error: string }> {
  const user = await getCurrentUser();
  if (await rateLimited(user.id)) return { error: TOO_MANY };

  const code = normalizeTransferCode(input);
  const { rows } = code
    ? await pool.query<CodeRow & { name: string; species: string | null; fromUsername: string | null }>(
        `SELECT t.id, t."coralId", t."createdById", t."expiresAt" < NOW() AS expired,
                t."redeemedAt", t."cancelledAt", c."ownerId", c."rfCode", c.name, c.species,
                cu.username AS "fromUsername"
         FROM public."TransferCode" t
         JOIN public."Coral" c ON c.id = t."coralId"
         LEFT JOIN public."User" cu ON cu.id = t."createdById"
         WHERE t."codeHash" = $1`,
        [hashTransferCode(code)]
      )
    : { rows: [] };

  const row = rows[0];
  if (!row) {
    await recordFailedAttempt(user.id);
    return { error: NOT_FOUND };
  }
  const problem = codeProblem(row, user.id);
  if (problem) return { error: problem };

  return {
    coralId: row.coralId,
    name: row.name,
    species: row.species,
    rfCode: row.rfCode,
    fromUsername: row.fromUsername,
    ancestors: await getLineage(row.coralId),
  };
}

export async function redeemTransferCode(input: string): Promise<{ coralId: string; coralRfCode: string | null } | { error: string }> {
  const user = await getCurrentUser();
  if (await rateLimited(user.id)) return { error: TOO_MANY };

  const code = normalizeTransferCode(input);
  if (!code) {
    await recordFailedAttempt(user.id);
    return { error: NOT_FOUND };
  }

  const cap = await checkSpecimenCap(user);
  if (!cap.ok) return { error: cap.error };

  const client = await pool.connect();
  let row: CodeRow | undefined;
  try {
    await client.query('BEGIN');
    // Locks both rows: two people redeeming the same code at once must not
    // both see it unredeemed, and the coral's owner must not change underneath.
    const { rows } = await client.query<CodeRow>(
      `SELECT t.id, t."coralId", t."createdById", t."expiresAt" < NOW() AS expired,
              t."redeemedAt", t."cancelledAt", c."ownerId", c."rfCode"
       FROM public."TransferCode" t
       JOIN public."Coral" c ON c.id = t."coralId"
       WHERE t."codeHash" = $1
       FOR UPDATE OF t, c`,
      [hashTransferCode(code)]
    );
    row = rows[0];
    const problem = row ? codeProblem(row, user.id) : NOT_FOUND;
    if (problem) {
      await client.query('ROLLBACK');
      if (!row) await recordFailedAttempt(user.id);
      return { error: problem };
    }

    await client.query(
      `UPDATE public."Coral"
         SET "ownerId" = $1,
             "acquiredStage" = COALESCE("acquiredStage", stage),
             "givenTo" = NULL,
             "updatedAt" = NOW()
       WHERE id = $2`,
      [user.id, row!.coralId]
    );
    await recordOwnershipEvent(
      { coralId: row!.coralId, eventType: 'ACQUIRED', userId: user.id, source: 'transfer_code' },
      client
    );
    await client.query(
      `UPDATE public."TransferCode" SET "redeemedById" = $1, "redeemedAt" = NOW() WHERE id = $2`,
      [user.id, row!.id]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  createNotification({
    userId: row!.createdById,
    type: 'FRAG_CLAIMED',
    fromUserId: user.id,
    targetType: 'CORAL',
    targetId: row!.coralId,
  }).catch((err) => log.error('transfer_code.notification_failed', { reason: String(err) }));

  log.event('transfer_code.redeemed', { coralId: row!.coralId });
  revalidatePath('/collection');
  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');
  return { coralId: row!.coralId, coralRfCode: row!.rfCode };
}
