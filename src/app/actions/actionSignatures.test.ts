import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Files under src/app/actions are 'use server' modules, so every export is an
 * HTTP endpoint. A parameter naming the user is therefore not an input the
 * server chose — it is one the caller supplies, and nothing stops them naming
 * somebody else.
 *
 * Six actions shipped that way: getMySpecimens, getDashboardStats,
 * getRecentCorals, getMyActivity, getMyListings, getIsFollowing. All read as
 * "my" and none checked. This fails the build if a seventh appears.
 */
const ACTIONS_DIR = fileURLToPath(new URL('.', import.meta.url));

const IDENTITY_PARAMS = ['userId', 'viewerId', 'currentUserId', 'ownerId', 'actorId'];

/**
 * Actions that name a person as their *subject* rather than claiming to be
 * them. These back public pages, so the id is the question, not the answer to
 * "who are you". Adding to this list should take a moment's thought — that is
 * the point of it being explicit.
 */
const PUBLIC_SUBJECT = new Set([
  'specimens.ts:getMoreByOwner',  // "more from this keeper" on a public coral page
  'users.ts:getUserSpecimens',    // public profile
  'users.ts:getUserBloodlines',   // public profile
]);

function actionFiles() {
  return readdirSync(ACTIONS_DIR).filter(
    (f) => f.endsWith('.ts') && !f.includes('.test.')
  );
}

/** The parameter list of every exported async function in a source file. */
function exportedSignatures(src: string): Array<{ name: string; params: string }> {
  const out: Array<{ name: string; params: string }> = [];
  const re = /export\s+async\s+function\s+(\w+)\s*\(([\s\S]*?)\)\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) out.push({ name: m[1], params: m[2] });
  return out;
}

describe('server action signatures', () => {
  const files = actionFiles();

  it('finds the action modules', () => {
    expect(files.length).toBeGreaterThan(3);
  });

  it.each(files)('%s takes no caller-supplied identity', (file) => {
    const src = readFileSync(ACTIONS_DIR + file, 'utf8');
    if (!src.includes("'use server'")) return;

    const offenders = exportedSignatures(src)
      .filter(({ params }) =>
        IDENTITY_PARAMS.some((p) => new RegExp(`\\b${p}\\s*[?:]`).test(params))
      )
      .map(({ name }) => name)
      .filter((name) => !PUBLIC_SUBJECT.has(`${file}:${name}`));

    expect(
      offenders,
      `${file}: ${offenders.join(', ')} accept an identity from the caller. ` +
        'Derive it from getCurrentUser() instead — a parameter here is an ' +
        'argument any HTTP caller can set.'
    ).toEqual([]);
  });
});
