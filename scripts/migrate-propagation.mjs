// Propagation stage: where a specimen sits in the cutting chain.
//   node scripts/migrate-propagation.mjs                    # dev, from .env.local
//   DATABASE_URL="postgres://..." node scripts/migrate-propagation.mjs   # prod
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

// Postgres has no CREATE TYPE ... IF NOT EXISTS.
await pool.query(`
  DO $$ BEGIN
    CREATE TYPE "CoralStage" AS ENUM
      ('MOTHER_COLONY','COLONY','MINI_COLONY','FRAG','MICRO_FRAG');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
`);

await pool.query(`
  ALTER TABLE public."Coral"
    ADD COLUMN IF NOT EXISTS "stage"                "CoralStage",
    ADD COLUMN IF NOT EXISTS "acquiredStage"        "CoralStage",
    ADD COLUMN IF NOT EXISTS "generationFromMother" INT,
    ADD COLUMN IF NOT EXISTS "sourceColony"         TEXT,
    ADD COLUMN IF NOT EXISTS "vendor"               TEXT
`);

await pool.query(`
  ALTER TABLE public."Lineage"
    ADD COLUMN IF NOT EXISTS "parentStageAtCut" "CoralStage"
`);

// A frag is cut from exactly one colony. Without this, generation is undefined.
const { rows: dupes } = await pool.query(
  `SELECT COUNT(*)::int AS n FROM (
     SELECT "childId" FROM public."Lineage" GROUP BY "childId" HAVING COUNT(*) > 1
   ) x`
);
if (dupes[0].n > 0) {
  console.error(`REFUSING: ${dupes[0].n} coral(s) already have multiple parents. Resolve before adding the constraint.`);
} else {
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE public."Lineage" ADD CONSTRAINT "Lineage_childId_key" UNIQUE ("childId");
    EXCEPTION WHEN duplicate_table THEN NULL;
              WHEN duplicate_object THEN NULL;
    END $$;
  `);
}

const cols = await pool.query(
  `SELECT table_name, column_name, udt_name FROM information_schema.columns
   WHERE table_schema='public'
     AND ((table_name='Coral' AND column_name IN ('stage','acquiredStage','generationFromMother','sourceColony','vendor'))
       OR (table_name='Lineage' AND column_name='parentStageAtCut'))
   ORDER BY table_name, column_name`
);
const enumVals = await pool.query(
  `SELECT string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS labels
   FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid WHERE t.typname='CoralStage'`
);
const cons = await pool.query(
  `SELECT conname FROM pg_constraint WHERE conrelid='public."Lineage"'::regclass AND contype='u' ORDER BY conname`
);

console.table(cols.rows);
console.log('CoralStage:', enumVals.rows[0]?.labels);
console.log('Lineage unique constraints:', cons.rows.map((r) => r.conname).join(', '));
await pool.end();
