import { pool } from '@/lib/db';
import type { CoralEventType } from '@/lib/ownershipEvents';

// Plain module, not a server action: these back public pages and take a coral
// id, never a user, so there is nothing a caller could abuse — but there is no
// reason to expose them as endpoints either.

export type ProvenanceEntry = {
  date: string;
  kind: 'added' | 'cut' | 'acquired' | 'claimed' | 'transferred' | 'sold' | 'gifted' | 'note';
  username: string | null;
  /** RF code of the coral it was cut from, for 'cut'. */
  fromRfCode: string | null;
  notes: string | null;
};

function kindOf(eventType: CoralEventType, source: string | null): ProvenanceEntry['kind'] {
  if (eventType === 'FRAGGED') return 'cut';
  if (eventType === 'SOLD') return 'sold';
  if (eventType === 'GIFTED') return 'gifted';
  if (eventType === 'OBSERVATION') return 'note';
  if (source === 'transfer_code') return 'transferred';
  if (source === 'rf_claim') return 'claimed';
  if (source === 'added') return 'added';
  return 'acquired';
}

export async function getProvenance(coral: {
  id: string;
  createdAt: string;
  ownerUsername: string | null;
}): Promise<ProvenanceEntry[]> {
  const { rows } = await pool.query<{
    date: string; eventType: CoralEventType; source: string | null; notes: string | null; username: string | null;
  }>(
    `SELECT e.date, e."eventType", e.source, e.notes, u.username
     FROM public."CoralOwnershipEvent" e
     LEFT JOIN public."User" u ON u.id = e."userId"
     WHERE e."coralId" = $1
     ORDER BY e.date ASC, e."createdAt" ASC`,
    [coral.id]
  );

  const entries = rows.map((r) => {
    const kind = kindOf(r.eventType, r.source);
    return {
      date: r.date,
      kind,
      username: r.username,
      fromRfCode: kind === 'cut' ? r.source : null,
      notes: r.notes,
    };
  });

  // Corals logged before events existed have no history rows at all; say what
  // is known rather than showing an empty timeline.
  if (!entries.some((e) => e.kind !== 'note')) {
    entries.unshift({
      date: coral.createdAt,
      kind: 'added',
      username: coral.ownerUsername,
      fromRfCode: null,
      notes: null,
    });
  }
  return entries;
}

export type Family = {
  root: { id: string; name: string; rfCode: string | null; ownerUsername: string | null; ownerVerified: boolean };
  /** Living pieces of the colony, root included. */
  pieces: number;
  keepers: Array<{ username: string; pieces: number }>;
};

/** Everyone who holds a living piece of the colony this coral came from. */
export async function getFamily(coralId: string): Promise<Family | null> {
  const { rows: rootRows } = await pool.query<Family['root']>(
    `WITH RECURSIVE up AS (
       SELECT $1::text AS id, 0 AS depth
       UNION ALL
       SELECT l."parentId", up.depth + 1
       FROM public."Lineage" l JOIN up ON l."childId" = up.id
       WHERE up.depth < 30
     )
     SELECT c.id, c.name, c."rfCode", u.username AS "ownerUsername", COALESCE(u.verified, false) AS "ownerVerified"
     FROM up
     JOIN public."Coral" c ON c.id = up.id
     LEFT JOIN public."User" u ON u.id = c."ownerId"
     ORDER BY up.depth DESC
     LIMIT 1`,
    [coralId]
  );
  const root = rootRows[0];
  if (!root) return null;

  const { rows } = await pool.query<{ username: string | null; pieces: number }>(
    `WITH RECURSIVE down AS (
       SELECT $1::text AS id, 0 AS depth
       UNION ALL
       SELECT l."childId", down.depth + 1
       FROM public."Lineage" l JOIN down ON l."parentId" = down.id
       WHERE down.depth < 30
     )
     SELECT u.username, COUNT(*)::int AS pieces
     FROM down
     JOIN public."Coral" c ON c.id = down.id
     LEFT JOIN public."User" u ON u.id = c."ownerId"
     WHERE c.status = 'ALIVE'
     GROUP BY u.username
     ORDER BY pieces DESC, u.username`,
    [root.id]
  );

  return {
    root,
    pieces: rows.reduce((n, r) => n + r.pieces, 0),
    keepers: rows.filter((r): r is { username: string; pieces: number } => r.username !== null),
  };
}
