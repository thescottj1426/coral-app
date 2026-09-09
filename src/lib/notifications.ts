import { pool } from '@/lib/db';

export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'REPLY' | 'BEST_ANSWER' | 'FRAG_CLAIMED';

/**
 * Deliberately NOT a server action.
 *
 * It lived in src/app/actions, which makes every export an HTTP endpoint — so
 * anyone could POST a notification to any user, attributed to any other user.
 * Both ids are legitimately parameters (a frag claim notifies the parent's
 * owner, not the claimer), so the fix is to stop exposing it rather than to
 * derive them from the session.
 */
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  fromUserId?: string;
  targetType?: string;
  targetId?: string;
}): Promise<void> {
  if (data.fromUserId && data.fromUserId === data.userId) return;
  await pool.query(
    `INSERT INTO public."Notification" (id, "userId", type, "fromUserId", "targetType", "targetId")
     VALUES (gen_random_uuid()::text, $1, $2::"NotificationType", $3, $4, $5)`,
    [data.userId, data.type, data.fromUserId ?? null, data.targetType ?? null, data.targetId ?? null]
  );
}
