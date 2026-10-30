// Provenance: who each ownership event concerns, and owner-approved claims of a
// frag from an owned coral.
//
//   node scripts/migrate-provenance.mjs
//   DATABASE_URL="postgres://..." node scripts/migrate-provenance.mjs
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

await pool.query(`ALTER TABLE public."CoralOwnershipEvent" ADD COLUMN IF NOT EXISTS "userId" TEXT`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS public."FragClaimRequest" (
    id            TEXT NOT NULL PRIMARY KEY,
    "parentId"    TEXT NOT NULL REFERENCES public."Coral"(id) ON DELETE RESTRICT,
    "requesterId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    "childId"     TEXT REFERENCES public."Coral"(id) ON DELETE RESTRICT,
    "createdAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt"   TIMESTAMP
  )
`);

// One open request per person per coral, so re-scanning a tag does not spam the owner.
await pool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS "FragClaimRequest_open_idx"
    ON public."FragClaimRequest" ("parentId", "requesterId") WHERE status = 'pending'
`);

// ADD VALUE cannot run inside a transaction block; each is its own statement.
for (const value of ['FRAG_CLAIM_REQUEST', 'FRAG_CLAIM_APPROVED', 'FRAG_CLAIM_REJECTED']) {
  await pool.query(`ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS '${value}'`);
}

const cols = await pool.query(
  `SELECT table_name, column_name, udt_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name IN ('CoralOwnershipEvent','FragClaimRequest')
   ORDER BY table_name, ordinal_position`
);
console.table(cols.rows);
await pool.end();
