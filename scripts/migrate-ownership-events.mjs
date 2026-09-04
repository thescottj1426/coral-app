// CoralOwnershipEvent exists on production but not on staging, so deleteSpecimen's
// audit insert failed outright on any branch created from staging. The .catch()
// around it hid that. This brings a branch up to the production shape.
//
//   node scripts/migrate-ownership-events.mjs
//   DATABASE_URL="postgres://..." node scripts/migrate-ownership-events.mjs
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
    CREATE TYPE "CoralEventType" AS ENUM ('ACQUIRED','FRAGGED','SOLD','TRADED','GIFTED','OBSERVATION');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS public."CoralOwnershipEvent" (
    id          TEXT NOT NULL PRIMARY KEY,
    "coralId"   TEXT NOT NULL,
    "eventType" "CoralEventType" NOT NULL,
    date        TIMESTAMP NOT NULL,
    source      TEXT,
    notes       TEXT,
    price       DOUBLE PRECISION,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// An event describes a coral that must still exist. Production carries no FK
// here; adding one on a branch would diverge the other way, so match production.
await pool.query(`
  CREATE INDEX IF NOT EXISTS "CoralOwnershipEvent_coralId_idx"
    ON public."CoralOwnershipEvent" ("coralId")
`);

const cols = await pool.query(
  `SELECT column_name, udt_name, is_nullable FROM information_schema.columns
   WHERE table_schema='public' AND table_name='CoralOwnershipEvent'
   ORDER BY ordinal_position`
);
console.table(cols.rows);
await pool.end();
