// Admin broadcast email: a per-user opt-out flag and a log of every broadcast.
//
//   node scripts/migrate-email-broadcast.mjs
//   DATABASE_URL="postgres://..." node scripts/migrate-email-broadcast.mjs
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

await pool.query(`
  ALTER TABLE public."User"
    ADD COLUMN IF NOT EXISTS "emailOptOut" BOOLEAN NOT NULL DEFAULT false
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS public."EmailBroadcast" (
    id               TEXT NOT NULL PRIMARY KEY,
    subject          TEXT NOT NULL,
    body             TEXT NOT NULL,
    audience         TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "sentCount"      INTEGER NOT NULL,
    "failedCount"    INTEGER NOT NULL,
    "sentById"       TEXT NOT NULL,
    "createdAt"      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const cols = await pool.query(
  `SELECT table_name, column_name, udt_name, is_nullable FROM information_schema.columns
   WHERE table_schema='public'
     AND (table_name='EmailBroadcast' OR (table_name='User' AND column_name='emailOptOut'))
   ORDER BY table_name, ordinal_position`
);
console.table(cols.rows);
await pool.end();
