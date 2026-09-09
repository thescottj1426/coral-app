// Coral had two indexes in production: the primary key and rfCode. Nothing on
// "ownerId" — the most-filtered column in the app, hit by 19 query sites across
// dashboard.ts, specimens.ts, lineage.ts, users.ts and entitlements.ts. Every
// collection page, dashboard and profile was a sequential scan.
//
// Measured on a 200k-row table (5,000 keepers x 40 corals):
//   without index  Seq Scan, 199,960 rows filtered   11.493 ms
//   with index     Bitmap Index Scan                  0.116 ms
//
// Also adds CoralOwnershipEvent("coralId"), which migrate-ownership-events.mjs
// creates but which is absent from production — that script was never fully
// applied there.
//
//   node scripts/migrate-owner-indexes.mjs
//   DATABASE_URL="postgres://..." node scripts/migrate-owner-indexes.mjs
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
  CREATE INDEX IF NOT EXISTS "Coral_ownerId_idx"
    ON public."Coral" ("ownerId")
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS "CoralOwnershipEvent_coralId_idx"
    ON public."CoralOwnershipEvent" ("coralId")
`);

// Reported rather than assumed: the whole reason this script exists is that a
// previous migration was believed applied and was not.
const { rows } = await pool.query(
  `SELECT tablename, indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('Coral', 'CoralOwnershipEvent', 'CoralPhoto')
    ORDER BY tablename, indexname`
);
for (const r of rows) console.log(`${r.tablename.padEnd(22)} ${r.indexname}`);

await pool.end();
