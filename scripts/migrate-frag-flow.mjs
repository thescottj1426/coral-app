// Records where a frag went before it is claimed. An unclaimed code is
// otherwise indistinguishable from one that was never handed out.
//
//   node scripts/migrate-frag-flow.mjs
//   DATABASE_URL="postgres://..." node scripts/migrate-frag-flow.mjs
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
  ALTER TABLE public."Coral" ADD COLUMN IF NOT EXISTS "givenTo" TEXT
`);

const cols = await pool.query(
  `SELECT column_name, data_type FROM information_schema.columns
   WHERE table_schema='public' AND table_name='Coral' AND column_name='givenTo'`
);
console.table(cols.rows);
await pool.end();
