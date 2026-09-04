import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { assertDisposableDatabase } from './guard';

function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const env = readFileSync(new URL('../../.env.test', import.meta.url), 'utf8');
  const line = env.split('\n').find((l) => l.startsWith('TEST_DATABASE_URL='));
  if (!line) throw new Error('TEST_DATABASE_URL not found in .env.test');
  return line.slice('TEST_DATABASE_URL='.length).trim();
}

// Guarded before the pool is built: nothing may connect until the target has
// been proven disposable.
export const TEST_DATABASE_URL = assertDisposableDatabase(testDatabaseUrl());

export const testPool = new Pool({ connectionString: TEST_DATABASE_URL });

/**
 * Tables the feature suite owns, child-first. CASCADE handles the FKs, but the
 * order keeps intent obvious. Everything else on the branch is left alone.
 */
const OWNED_TABLES = [
  'CoralOwnershipEvent',
  'CoralPhoto',
  'Lineage',
  'Coral',
  'User',
];

export async function truncateAll(): Promise<void> {
  const list = OWNED_TABLES.map((t) => `public."${t}"`).join(', ');
  await testPool.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}
