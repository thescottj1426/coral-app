import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testPool, truncateAll } from '@/test/db';
import { seedUser, seedCoral, linkLineage, resetSequence } from '@/test/factories';

// The session is the only thing faked; every query below runs for real.
const currentUser = vi.fn();
vi.mock('@/lib/getCurrentUser', () => ({ getCurrentUser: () => currentUser() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', async () => ({ pool: (await import('@/test/db')).testPool }));

const { createFrags, claimFrag, claimParent, setFragRecipient } = await import('./lineage');

let owner: Awaited<ReturnType<typeof seedUser>>;
let other: Awaited<ReturnType<typeof seedUser>>;

beforeEach(async () => {
  await truncateAll();
  resetSequence();
  owner = await seedUser({ id: 'owner' });
  other = await seedUser({ id: 'other' });
  currentUser.mockResolvedValue(owner);
});

afterAll(async () => {
  await testPool.end();
});

const childrenOf = async (parentId: string) => {
  const { rows } = await testPool.query(
    `SELECT c.id, c."rfCode", c."ownerId", c.stage, c."acquiredStage", c.name, c.species,
            c.category, l."parentStageAtCut"
       FROM public."Lineage" l JOIN public."Coral" c ON c.id = l."childId"
      WHERE l."parentId" = $1 ORDER BY c."rfCode"`,
    [parentId]
  );
  return rows;
};

describe('recording what a cut came from', () => {
  // Every lineage link in production stored NULL here, because the corals
  // being cut predate the stage field. A tree that cannot say whether a frag
  // came off a mother colony or another frag is not a lineage.
  const stageOfLink = async (parentId: string) => {
    const { rows } = await testPool.query<{ parentStageAtCut: string | null }>(
      'SELECT "parentStageAtCut" FROM public."Lineage" WHERE "parentId" = $1 LIMIT 1',
      [parentId]
    );
    return rows[0]?.parentStageAtCut ?? null;
  };

  it.each(['MOTHER_COLONY', 'COLONY', 'MINI_COLONY', 'FRAG'] as const)(
    'records a cut from a %s',
    async (stage) => {
      const parent = await seedCoral({ ownerId: owner.id, stage });
      await createFrags(parent.id, 1);
      expect(await stageOfLink(parent.id)).toBe(stage);
    }
  );

  it('refuses to cut from a coral whose stage is unknown', async () => {
    const parent = await seedCoral({ ownerId: owner.id, stage: null });
    const res = await createFrags(parent.id, 1);

    expect(res).toEqual({ error: expect.stringMatching(/mother colony/i) });
    expect(await childrenOf(parent.id)).toHaveLength(0);
  });

  it('accepts the stage when told, and records it on the link', async () => {
    const parent = await seedCoral({ ownerId: owner.id, stage: null });
    await createFrags(parent.id, 1, { parentStage: 'MINI_COLONY' });

    expect(await stageOfLink(parent.id)).toBe('MINI_COLONY');
  });

  // Answering once must fix the coral, or the question returns on every cut.
  it('persists the answer on the parent', async () => {
    const parent = await seedCoral({ ownerId: owner.id, stage: null });
    await createFrags(parent.id, 1, { parentStage: 'MOTHER_COLONY' });

    const { rows } = await testPool.query<{ stage: string | null }>(
      'SELECT stage FROM public."Coral" WHERE id = $1',
      [parent.id]
    );
    expect(rows[0].stage).toBe('MOTHER_COLONY');

    // Second cut needs no prompting.
    const second = await createFrags(parent.id, 1);
    expect(Array.isArray(second)).toBe(true);
  });

  it('prefers the stage already on the coral over a supplied one', async () => {
    const parent = await seedCoral({ ownerId: owner.id, stage: 'COLONY' });
    await createFrags(parent.id, 1, { parentStage: 'FRAG' });

    expect(await stageOfLink(parent.id)).toBe('COLONY');
  });
});

describe('createFrags', () => {
  it('creates unclaimed children linked to the parent', async () => {
    const parent = await seedCoral({ ownerId: owner.id });
    const created = await createFrags(parent.id, 3);

    expect(Array.isArray(created)).toBe(true);
    const kids = await childrenOf(parent.id);
    expect(kids).toHaveLength(3);
    expect(kids.every((k) => k.ownerId === null)).toBe(true);
  });

  it('keeps a frag for the owner, setting owner and acquiredStage together', async () => {
    const parent = await seedCoral({ ownerId: owner.id });
    await createFrags(parent.id, 1, { stage: 'FRAG', keepForSelf: true });

    const [kid] = await childrenOf(parent.id);
    expect(kid.ownerId).toBe(owner.id);
    expect(kid.acquiredStage).toBe('FRAG');
  });

  // The asymmetry that matters: an unclaimed frag has no acquiredStage yet,
  // because nobody has acquired it.
  it('leaves owner and acquiredStage null when giving a frag away', async () => {
    const parent = await seedCoral({ ownerId: owner.id });
    await createFrags(parent.id, 1, { stage: 'FRAG', keepForSelf: false });

    const [kid] = await childrenOf(parent.id);
    expect(kid.ownerId).toBeNull();
    expect(kid.acquiredStage).toBeNull();
    expect(kid.stage).toBe('FRAG');
  });

  it('inherits identity from the parent', async () => {
    const parent = await seedCoral({
      ownerId: owner.id,
      name: 'Jason Fox',
      species: 'Acropora',
      category: 'SPS',
    });
    await createFrags(parent.id, 1);

    const [kid] = await childrenOf(parent.id);
    expect(kid.name).toBe('Jason Fox');
    expect(kid.species).toBe('Acropora');
    expect(kid.category).toBe('SPS');
  });

  it('snapshots the parent stage at cut time', async () => {
    const parent = await seedCoral({ ownerId: owner.id, stage: 'MOTHER_COLONY' });
    await createFrags(parent.id, 1);

    const [kid] = await childrenOf(parent.id);
    expect(kid.parentStageAtCut).toBe('MOTHER_COLONY');
  });

  it('gives every frag a distinct rf code', async () => {
    const parent = await seedCoral({ ownerId: owner.id });
    await createFrags(parent.id, 5);

    const kids = await childrenOf(parent.id);
    expect(new Set(kids.map((k) => k.rfCode)).size).toBe(5);
  });

  it('refuses to frag an unclaimed coral', async () => {
    const unclaimed = await seedCoral({ ownerId: null, rfCode: 'RF-UNCL' });
    const res = await createFrags(unclaimed.id, 1);
    expect(res).toHaveProperty('error');
    expect((res as { error: string }).error).toMatch(/not been claimed/i);
  });

  it("refuses to frag someone else's coral", async () => {
    const theirs = await seedCoral({ ownerId: other.id });
    const res = await createFrags(theirs.id, 1);
    expect((res as { error: string }).error).toMatch(/your own collection/i);
  });

  it('refuses a coral that does not exist', async () => {
    const res = await createFrags('00000000-0000-0000-0000-000000000000', 1);
    expect((res as { error: string }).error).toMatch(/no longer exists/i);
  });

  it('clamps the count to at least one', async () => {
    const parent = await seedCoral({ ownerId: owner.id });
    await createFrags(parent.id, 0);
    expect(await childrenOf(parent.id)).toHaveLength(1);
  });

  it('clamps the count to at most 25', async () => {
    const parent = await seedCoral({ ownerId: owner.id });
    await createFrags(parent.id, 40);
    expect(await childrenOf(parent.id)).toHaveLength(25);
  });
});

describe('claimFrag', () => {
  it('assigns an unclaimed frag to the claimer', async () => {
    const parent = await seedCoral({ ownerId: other.id });
    const frag = await seedCoral({ ownerId: null, rfCode: 'RF-CLM1' });
    await linkLineage(parent.id, frag.id);

    const res = await claimFrag('RF-CLM1');
    expect(res).not.toHaveProperty('error');

    const { rows } = await testPool.query('SELECT "ownerId" FROM public."Coral" WHERE id = $1', [
      frag.id,
    ]);
    expect(rows[0].ownerId).toBe(owner.id);
  });

  it('sets acquiredStage from the frag stage on claim', async () => {
    const parent = await seedCoral({ ownerId: other.id });
    const frag = await seedCoral({ ownerId: null, rfCode: 'RF-CLM2', stage: 'MICRO_FRAG' });
    await linkLineage(parent.id, frag.id);

    await claimFrag('RF-CLM2');
    const { rows } = await testPool.query(
      'SELECT "acquiredStage" FROM public."Coral" WHERE id = $1',
      [frag.id]
    );
    expect(rows[0].acquiredStage).toBe('MICRO_FRAG');
  });

  // Second branch: a code that is already owned is treated as a parent tag, and
  // claiming it cuts a NEW frag rather than transferring the original.
  it('cuts a new frag when the code belongs to someone else', async () => {
    const theirs = await seedCoral({ ownerId: other.id, rfCode: 'RF-TAKEN', name: 'Jason Fox' });
    const res = await claimFrag('RF-TAKEN');

    expect(res).not.toHaveProperty('error');
    const claimed = res as { coralId: string; coralRfCode: string };
    expect(claimed.coralId).not.toBe(theirs.id);

    const { rows } = await testPool.query(
      'SELECT "ownerId", name, stage, "acquiredStage" FROM public."Coral" WHERE id = $1',
      [claimed.coralId]
    );
    expect(rows[0]).toMatchObject({
      ownerId: owner.id,
      name: 'Jason Fox',
      stage: 'FRAG',
      acquiredStage: 'FRAG',
    });

    // The original stays with its owner.
    const { rows: original } = await testPool.query(
      'SELECT "ownerId" FROM public."Coral" WHERE id = $1',
      [theirs.id]
    );
    expect(original[0].ownerId).toBe(other.id);
  });

  it('links the new frag to the coral whose code was scanned', async () => {
    const theirs = await seedCoral({ ownerId: other.id, rfCode: 'RF-TAKE2', stage: 'COLONY' });
    const res = (await claimFrag('RF-TAKE2')) as { coralId: string };

    const { rows } = await testPool.query(
      'SELECT "parentId", "parentStageAtCut" FROM public."Lineage" WHERE "childId" = $1',
      [res.coralId]
    );
    expect(rows[0].parentId).toBe(theirs.id);
    expect(rows[0].parentStageAtCut).toBe('COLONY');
  });

  // Your own coral is the one case the parent branch refuses: cutting a frag
  // from it is the right action, not claiming it.
  it('refuses to claim your own coral', async () => {
    await seedCoral({ ownerId: owner.id, rfCode: 'RF-MINE' });
    const res = await claimFrag('RF-MINE');
    expect((res as { error: string }).error).toMatch(/your own coral/i);
  });

  it('refuses an unknown code', async () => {
    const res = await claimFrag('RF-NONE');
    expect(res).toHaveProperty('error');
  });

  it('clears the recipient note on claim', async () => {
    const parent = await seedCoral({ ownerId: other.id });
    const frag = await seedCoral({ ownerId: null, rfCode: 'RF-CLM3', givenTo: 'Dave' });
    await linkLineage(parent.id, frag.id);

    await claimFrag('RF-CLM3');
    const { rows } = await testPool.query('SELECT "givenTo" FROM public."Coral" WHERE id = $1', [
      frag.id,
    ]);
    expect(rows[0].givenTo).toBeNull();
  });
});

describe('claimParent', () => {
  it('links a child to a parent by rf code', async () => {
    const child = await seedCoral({ ownerId: owner.id });
    const parent = await seedCoral({ ownerId: other.id, rfCode: 'RF-PAR1' });

    expect(await claimParent(child.id, 'RF-PAR1')).toEqual({});
    const { rows } = await testPool.query(
      'SELECT "parentId", "parentStageAtCut" FROM public."Lineage" WHERE "childId" = $1',
      [child.id]
    );
    expect(rows[0].parentId).toBe(parent.id);
  });

  // An after-the-fact link has no honest cut-time stage, so it stays null
  // rather than fabricating today's stage as history.
  it('leaves parentStageAtCut null for an after-the-fact link', async () => {
    const child = await seedCoral({ ownerId: owner.id });
    await seedCoral({ ownerId: other.id, rfCode: 'RF-PAR2', stage: 'COLONY' });

    await claimParent(child.id, 'RF-PAR2');
    const { rows } = await testPool.query(
      'SELECT "parentStageAtCut" FROM public."Lineage" WHERE "childId" = $1',
      [child.id]
    );
    expect(rows[0].parentStageAtCut).toBeNull();
  });

  it('refuses self-parenting', async () => {
    const child = await seedCoral({ ownerId: owner.id, rfCode: 'RF-SELF' });
    const res = await claimParent(child.id, 'RF-SELF');
    expect(res.error).toMatch(/its own parent/i);
  });

  it('refuses a child the caller does not own', async () => {
    const child = await seedCoral({ ownerId: other.id });
    await seedCoral({ ownerId: owner.id, rfCode: 'RF-PAR3' });
    expect((await claimParent(child.id, 'RF-PAR3')).error).toMatch(/not found/i);
  });

  it('refuses an unknown parent code', async () => {
    const child = await seedCoral({ ownerId: owner.id });
    expect((await claimParent(child.id, 'RF-GONE')).error).toMatch(/no specimen found/i);
  });

  // UNIQUE(childId) would make this a silent no-op under ON CONFLICT DO NOTHING;
  // the action checks first so the user gets a real message.
  it('reports when the same parent is already linked', async () => {
    const child = await seedCoral({ ownerId: owner.id });
    const parent = await seedCoral({ ownerId: other.id, rfCode: 'RF-PAR4' });
    await linkLineage(parent.id, child.id);

    expect((await claimParent(child.id, 'RF-PAR4')).error).toMatch(/already linked/i);
  });

  it('reports when a different parent is already linked', async () => {
    const child = await seedCoral({ ownerId: owner.id });
    const first = await seedCoral({ ownerId: other.id, rfCode: 'RF-PAR5' });
    await seedCoral({ ownerId: other.id, rfCode: 'RF-PAR6' });
    await linkLineage(first.id, child.id);

    expect((await claimParent(child.id, 'RF-PAR6')).error).toMatch(/already has a parent/i);
  });
});

describe('setFragRecipient', () => {
  it('lets the owner note a recipient', async () => {
    const coral = await seedCoral({ ownerId: owner.id });
    expect(await setFragRecipient(coral.id, 'Dave')).toEqual({});

    const { rows } = await testPool.query('SELECT "givenTo" FROM public."Coral" WHERE id = $1', [
      coral.id,
    ]);
    expect(rows[0].givenTo).toBe('Dave');
  });

  // The permission that makes the frag modal work: you may annotate a plug you
  // cut, right up until someone claims it.
  it("lets the parent's owner note a recipient on an unclaimed child", async () => {
    const parent = await seedCoral({ ownerId: owner.id });
    const frag = await seedCoral({ ownerId: null });
    await linkLineage(parent.id, frag.id);

    expect(await setFragRecipient(frag.id, 'Dave')).toEqual({});
  });

  it('refuses an unrelated user', async () => {
    const parent = await seedCoral({ ownerId: other.id });
    const frag = await seedCoral({ ownerId: null });
    await linkLineage(parent.id, frag.id);

    expect((await setFragRecipient(frag.id, 'Dave')).error).toMatch(/not authorized/i);
  });

  it("refuses someone else's claimed coral", async () => {
    const theirs = await seedCoral({ ownerId: other.id });
    expect((await setFragRecipient(theirs.id, 'Dave')).error).toMatch(/not authorized/i);
  });

  it('clears the note when given an empty string', async () => {
    const coral = await seedCoral({ ownerId: owner.id, givenTo: 'Dave' });
    await setFragRecipient(coral.id, '   ');

    const { rows } = await testPool.query('SELECT "givenTo" FROM public."Coral" WHERE id = $1', [
      coral.id,
    ]);
    expect(rows[0].givenTo).toBeNull();
  });

  it('reports a coral that does not exist', async () => {
    const res = await setFragRecipient('00000000-0000-0000-0000-000000000000', 'Dave');
    expect(res.error).toMatch(/not found/i);
  });
});
