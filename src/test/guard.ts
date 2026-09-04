import { readFileSync } from 'node:fs';

/**
 * The feature suite TRUNCATEs. Pointed at the wrong branch it would destroy the
 * real collection, so a test database has to prove it is disposable before any
 * test runs. Fails closed: anything unrecognised is treated as real data.
 */

// Branches holding real data. A test connection resolving to any of these host
// endpoints is a stop, not a warning.
const PROTECTED_ENDPOINTS = [
  'ep-silent-credit-aiklv788', // staging  (br-steep-dream-ai7mj113) — .env.local points here
  'ep-calm-heart-airbkkvd', // production (br-little-pond-aibzv5qo)
  'ep-damp-dream-aino7tf9', // staging-pre-cleanup-backup
  'ep-proud-cloud-aic4x578', // QA
];

function endpointOf(url: string): string {
  const host = new URL(url).hostname;
  // ep-foo-bar-123-pooler.c-4.… and ep-foo-bar-123.c-4.… are the same compute.
  return host.split('.')[0].replace(/-pooler$/, '');
}

function localDatabaseUrl(): string | null {
  try {
    const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
    const line = env.split('\n').find((l) => l.startsWith('DATABASE_URL='));
    return line ? line.slice('DATABASE_URL='.length).trim() : null;
  } catch {
    return null;
  }
}

/** Throws unless `url` is a disposable test database. */
export function assertDisposableDatabase(url: string | undefined): string {
  if (!url) {
    throw new Error('TEST_DATABASE_URL is not set. Refusing to run destructive tests.');
  }

  let endpoint: string;
  try {
    endpoint = endpointOf(url);
  } catch {
    throw new Error('TEST_DATABASE_URL is not a valid URL. Refusing to run destructive tests.');
  }

  if (PROTECTED_ENDPOINTS.includes(endpoint)) {
    throw new Error(
      `TEST_DATABASE_URL points at protected endpoint ${endpoint}, which holds real data. ` +
        'Refusing to truncate. Create a throwaway branch instead.'
    );
  }

  const local = localDatabaseUrl();
  if (local && endpointOf(local) === endpoint) {
    throw new Error(
      'TEST_DATABASE_URL resolves to the same compute as DATABASE_URL in .env.local. ' +
        'Refusing to truncate your development database.'
    );
  }

  return url;
}
