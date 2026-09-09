'use server';

import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/getCurrentUser';

import type { NotificationType } from '@/lib/notifications';
export type { NotificationType };


export type NotificationRow = {
  id: string;
  type: NotificationType;
  fromUserId: string | null;
  fromUsername: string | null;
  targetType: string | null;
  targetId: string | null;
  read: boolean;
  createdAt: string;
};


export async function getUnreadCount(): Promise<number> {
  const user = await getCurrentUser();
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public."Notification" WHERE "userId" = $1 AND read = false`,
    [user.id]
  );
  return parseInt(rows[0].count, 10);
}

export async function getMyNotifications(limit = 20): Promise<NotificationRow[]> {
  const user = await getCurrentUser();
  const { rows } = await pool.query<NotificationRow>(
    `SELECT n.id, n.type, n."fromUserId", u.username AS "fromUsername",
            n."targetType", n."targetId", n.read, n."createdAt"
     FROM public."Notification" n
     LEFT JOIN public."User" u ON u.id = n."fromUserId"
     WHERE n."userId" = $1
     ORDER BY n."createdAt" DESC
     LIMIT $2`,
    [user.id, limit]
  );
  return rows;
}

export async function markAllRead(): Promise<void> {
  const user = await getCurrentUser();
  await pool.query(
    `UPDATE public."Notification" SET read = true WHERE "userId" = $1 AND read = false`,
    [user.id]
  );
}
