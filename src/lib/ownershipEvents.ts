import { pool } from '@/lib/db';
import { invariant } from '@/lib/log';

export type CoralEventType = 'ACQUIRED' | 'FRAGGED' | 'SOLD' | 'TRADED' | 'GIFTED' | 'OBSERVATION';

type Queryable = Pick<typeof pool, 'query'>;

/**
 * Deliberately NOT a server action, for the same reason as createNotification:
 * an exported action would let anyone write history onto any coral.
 *
 * userId is the keeper the event is about: the new owner for ACQUIRED, the
 * cutter for FRAGGED, the outgoing owner for SOLD/TRADED/GIFTED.
 * Pass `db` (a transaction client) when the event must commit with an ownership change.
 */
export async function recordOwnershipEvent(
  event: {
    coralId: string;
    eventType: CoralEventType;
    userId: string | null;
    source?: string | null;
    notes?: string | null;
    price?: number | null;
  },
  db: Queryable = pool
): Promise<void> {
  const res = await db.query(
    `INSERT INTO public."CoralOwnershipEvent"
       (id, "coralId", "eventType", "userId", date, source, notes, price, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2::"CoralEventType", $3, NOW(), $4, $5, $6, NOW())`,
    [event.coralId, event.eventType, event.userId, event.source ?? null, event.notes ?? null, event.price ?? null]
  );
  invariant('ownership_event.not_written', res.rowCount === 1, {
    coralId: event.coralId,
    eventType: event.eventType,
  });
}
