// CoralPhoto had only its primary key. Two lookups run constantly without one:
// every cover-photo subquery filters on "coralId", and the image proxy now
// resolves a photo by "s3Key" on each request to decide whether it may be
// served. Both were sequential scans.
//
//   node scripts/migrate-photo-indexes.mjs
//   DATABASE_URL="postgres://..." node scripts/migrate-photo-indexes.mjs
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

// Not UNIQUE on s3Key: nothing in the schema guarantees it, and a migration is
// the wrong place to discover a duplicate.
await pool.query(`
  CREATE INDEX IF NOT EXISTS "CoralPhoto_s3Key_idx"
    ON public."CoralPhoto" ("s3Key")
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS "CoralPhoto_coralId_idx"
    ON public."CoralPhoto" ("coralId")
`);

const { rows } = await pool.query(
  `SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'CoralPhoto'
    ORDER BY indexname`
);
console.log('CoralPhoto indexes:', rows.map((r) => r.indexname).join(', '));

await pool.end();
