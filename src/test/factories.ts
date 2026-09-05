import { testPool } from './db';
import type { CoralStage } from '@/app/actions/specimens';

let seq = 0;

/** Fixtures never call the real uniqueRFCode, so a random collision cannot
 *  make the suite flaky. Reset between tests to keep codes predictable. */
export function nextRfCode(): string {
  seq += 1;
  return `RF-T${String(seq).padStart(3, '0')}`;
}

export function resetSequence(): void {
  seq = 0;
}

export async function seedUser(
  over: { id?: string; username?: string; plan?: 'FREE' | 'COLLECTOR' } = {}
) {
  const id = over.id ?? `user-${(seq += 1)}`;
  const username = over.username ?? id;
  const email = `${username}@example.test`;

  await testPool.query(
    `INSERT INTO public."User" (id, "neonAuthId", username, email, "onboardingComplete",
       "isSeller", verified, plan, "updatedAt")
     VALUES ($1, $1, $2, $3, true, false, true, $4::"UserPlan", NOW())`,
    [id, username, email, over.plan ?? 'FREE']
  );

  // Shaped like getCurrentUser's return so tests can hand it straight to the mock.
  return { id, username, email, name: username, plan: over.plan ?? 'FREE', capExempt: false };
}

export async function seedCoral(
  over: {
    ownerId?: string | null;
    name?: string;
    species?: string | null;
    category?: string | null;
    rfCode?: string;
    stage?: CoralStage | null;
    status?: 'ALIVE' | 'LOST' | 'SOLD' | 'GIVEN';
    givenTo?: string | null;
  } = {}
) {
  const { rows } = await testPool.query<{ id: string; rfCode: string }>(
    `INSERT INTO public."Coral"
       (id, name, species, category, "rfCode", "ownerId", "identityHue",
        stage, status, "givenTo", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 120,
             $6::"CoralStage", $7::"CoralStatus", $8, NOW())
     RETURNING id, "rfCode"`,
    [
      over.name ?? 'Test Coral',
      over.species ?? null,
      over.category ?? null,
      over.rfCode ?? nextRfCode(),
      over.ownerId ?? null,
      // `??` would turn an explicit null back into COLONY, and a null stage is
      // exactly what corals logged before the field look like — the case the
      // cut path has to handle.
      over.stage === undefined ? 'COLONY' : over.stage,
      over.status ?? 'ALIVE',
      over.givenTo ?? null,
    ]
  );
  return rows[0];
}

export async function linkLineage(parentId: string, childId: string, stageAtCut?: CoralStage) {
  await testPool.query(
    `INSERT INTO public."Lineage" ("parentId", "childId", "parentStageAtCut")
     VALUES ($1, $2, $3::"CoralStage")`,
    [parentId, childId, stageAtCut ?? null]
  );
}
