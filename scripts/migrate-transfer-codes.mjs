// Transfer codes: single-use secrets that move a coral into the redeemer's
// collection. RF codes are public and 4 characters, so they can never be the
// credential for taking ownership.
//
//   node scripts/migrate-transfer-codes.mjs
//   DATABASE_URL="postgres://..." node scripts/migrate-transfer-codes.mjs
// Safe to run more than once.
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

function resolveUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const line = env.split('\n').find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not found in .env.local');
  return line.slice('DATABASE_URL='.length).trim();
}

const pool = new Pool({ connectionString: resolveUrl() });

// Who each ownership event concerns (the new owner for ACQUIRED, the cutter for FRAGGED).
await pool.query(`ALTER TABLE public."CoralOwnershipEvent" ADD COLUMN IF NOT EXISTS "userId" TEXT`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS public."TransferCode" (
    id             TEXT NOT NULL PRIMARY KEY,
    "coralId"      TEXT NOT NULL REFERENCES public."Coral"(id) ON DELETE RESTRICT,
    "createdById"  TEXT NOT NULL,
    "codeHash"     TEXT NOT NULL UNIQUE,
    "expiresAt"    TIMESTAMP NOT NULL,
    "redeemedById" TEXT,
    "redeemedAt"   TIMESTAMP,
    "cancelledAt"  TIMESTAMP,
    "createdAt"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// One open code per coral. Expired codes still count, so generating a new one
// cancels the old one first.
await pool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS "TransferCode_open_idx"
    ON public."TransferCode" ("coralId") WHERE "redeemedAt" IS NULL AND "cancelledAt" IS NULL
`);

// Failed redeem attempts, for rate limiting guesses.
await pool.query(`
  CREATE TABLE IF NOT EXISTS public."TransferCodeAttempt" (
    "userId"    TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
await pool.query(`
  CREATE INDEX IF NOT EXISTS "TransferCodeAttempt_user_idx"
    ON public."TransferCodeAttempt" ("userId", "createdAt")
`);

const cols = await pool.query(
  `SELECT table_name, column_name, udt_name, is_nullable FROM information_schema.columns
   WHERE table_schema='public'
     AND (table_name IN ('TransferCode','TransferCodeAttempt')
          OR (table_name='CoralOwnershipEvent' AND column_name='userId'))
   ORDER BY table_name, ordinal_position`
);
console.table(cols.rows);
await pool.end();
