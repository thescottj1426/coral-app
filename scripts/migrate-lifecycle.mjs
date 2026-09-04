// Coral lifecycle: corals die, and deleting them destroys lineage.
//
// Lineage's foreign keys are ON DELETE CASCADE, so deleteSpecimen has been
// silently severing chains — every descendant loses its parent link. This
// migration gives a coral a lifecycle state so removal sets a status instead
// of deleting the row, and switches the FKs to RESTRICT so a stray DELETE
// fails loudly rather than quietly destroying provenance.
//
//   node scripts/migrate-lifecycle.mjs
//   DATABASE_URL="postgres://..." node scripts/migrate-lifecycle.mjs
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
  DO $$ BEGIN
    CREATE TYPE "CoralStatus" AS ENUM ('ALIVE','LOST','SOLD','GIVEN');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
`);

await pool.query(`
  ALTER TABLE public."Coral"
    ADD COLUMN IF NOT EXISTS "status"     "CoralStatus" NOT NULL DEFAULT 'ALIVE',
    ADD COLUMN IF NOT EXISTS "statusAt"   TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "statusNote" TEXT
`);

// Stop DELETE from cascading through lineage. RESTRICT makes an accidental
// delete fail instead of silently severing every descendant's parent link.
for (const [name, col] of [
  ['Lineage_parentId_fkey', 'parentId'],
  ['Lineage_childId_fkey', 'childId'],
]) {
  await pool.query(`ALTER TABLE public."Lineage" DROP CONSTRAINT IF EXISTS "${name}"`);
  await pool.query(`
    ALTER TABLE public."Lineage"
      ADD CONSTRAINT "${name}" FOREIGN KEY ("${col}")
      REFERENCES public."Coral"(id) ON DELETE RESTRICT
  `);
}

const cols = await pool.query(
  `SELECT column_name, udt_name, column_default FROM information_schema.columns
   WHERE table_schema='public' AND table_name='Coral'
     AND column_name IN ('status','statusAt','statusNote') ORDER BY column_name`
);
const fks = await pool.query(
  `SELECT conname, confdeltype FROM pg_constraint
   WHERE conrelid='public."Lineage"'::regclass AND contype='f' ORDER BY conname`
);

console.table(cols.rows);
// confdeltype: 'c' = cascade, 'r' = restrict, 'a' = no action
console.table(fks.rows.map((r) => ({
  constraint: r.conname,
  onDelete: r.confdeltype === 'c' ? 'CASCADE (BAD)' : r.confdeltype === 'r' ? 'RESTRICT' : r.confdeltype,
})));
await pool.end();
