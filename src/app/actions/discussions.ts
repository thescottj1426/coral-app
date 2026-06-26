'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');
  return session.user;
}

export type ThreadType = 'discussion' | 'question' | 'health' | 'trade';

export type ThreadRow = {
  id: string;
  title: string;
  body: string | null;
  type: ThreadType;
  anchorType: string;
  anchorId: string;
  photoKey: string | null;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  resolved: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  // anchor specimen fields (populated by getAllThreads)
  anchorName?: string;
  anchorRfCode?: string | null;
  anchorIdentityHue?: number | null;
};

export type ThreadDetail = ThreadRow & {
  replies: ReplyRow[];
};

export type ReplyRow = {
  id: string;
  threadId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  body: string;
  isBest: boolean;
  likes: number;
  createdAt: string;
};

const THREAD_SELECT = `
  t.id, t.title, t.body, t.type, t."anchorType", t."anchorId", t."photoKey",
  t."authorId", u.username AS "authorUsername", u."displayName" AS "authorDisplayName",
  t.resolved, t."replyCount", t."createdAt", t."updatedAt"
`;

// For non-specimen anchors, anchorId holds the display name (e.g. species name).
// COALESCE falls back to anchorId so those threads always have a displayable name.
const ANCHOR_FIELDS = `
  COALESCE(c.name, t."anchorId") AS "anchorName",
  c."rfCode" AS "anchorRfCode",
  c."identityHue" AS "anchorIdentityHue"
`;

export async function getAllThreads(): Promise<ThreadRow[]> {
  const { rows } = await pool.query<ThreadRow>(
    `SELECT ${THREAD_SELECT}, ${ANCHOR_FIELDS}
     FROM public."Thread" t
     JOIN public."User" u ON u.id = t."authorId"
     LEFT JOIN public."Coral" c ON c.id = t."anchorId" AND t."anchorType" = 'specimen'
     ORDER BY t."updatedAt" DESC
     LIMIT 100`
  );
  return rows;
}

export async function getSpecimenThreads(specimenId: string): Promise<ThreadRow[]> {
  const { rows } = await pool.query<ThreadRow>(
    `SELECT ${THREAD_SELECT}, ${ANCHOR_FIELDS}
     FROM public."Thread" t
     JOIN public."User" u ON u.id = t."authorId"
     LEFT JOIN public."Coral" c ON c.id = t."anchorId" AND t."anchorType" = 'specimen'
     WHERE t."anchorType" = 'specimen' AND t."anchorId" = $1
     ORDER BY t."updatedAt" DESC`,
    [specimenId]
  );
  return rows;
}

export async function getThread(threadId: string): Promise<ThreadDetail | null> {
  const [threadRows, replyRows] = await Promise.all([
    pool.query<ThreadRow>(
      `SELECT ${THREAD_SELECT}
       FROM public."Thread" t
       JOIN public."User" u ON u.id = t."authorId"
       WHERE t.id = $1`,
      [threadId]
    ),
    pool.query<ReplyRow>(
      `SELECT r.id, r."threadId", r."authorId",
              u.username AS "authorUsername", u."displayName" AS "authorDisplayName",
              r.body, r."isBest", r.likes, r."createdAt"
       FROM public."ThreadReply" r
       JOIN public."User" u ON u.id = r."authorId"
       WHERE r."threadId" = $1
       ORDER BY r."isBest" DESC, r."createdAt" ASC`,
      [threadId]
    ),
  ]);

  if (!threadRows.rows[0]) return null;
  return { ...threadRows.rows[0], replies: replyRows.rows };
}

export async function createThread(data: {
  anchorType: string;
  anchorId: string;
  specimenRfCode?: string | null;
  title: string;
  body?: string | null;
  type: ThreadType;
  photoKey?: string | null;
}): Promise<ThreadRow> {
  const user = await getCurrentUser();

  const { rows } = await pool.query<ThreadRow>(
    `INSERT INTO public."Thread"
       (id, title, body, type, "anchorType", "anchorId", "photoKey", "authorId")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, body, type, "anchorType", "anchorId", "photoKey", "authorId", resolved, "replyCount", "createdAt", "updatedAt"`,
    [data.title, data.body ?? null, data.type, data.anchorType, data.anchorId, data.photoKey ?? null, user.id]
  );

  if (data.anchorType === 'specimen' && data.specimenRfCode) {
    revalidatePath(`/collection/${data.specimenRfCode}`);
  }
  revalidatePath('/discuss');
  return { ...rows[0], authorUsername: user.name ?? '', authorDisplayName: null };
}

export async function createReply(data: {
  threadId: string;
  specimenId: string;
  body: string;
}): Promise<void> {
  const user = await getCurrentUser();

  await pool.query(
    `INSERT INTO public."ThreadReply" (id, "threadId", "authorId", body)
     VALUES (gen_random_uuid()::text, $1, $2, $3)`,
    [data.threadId, user.id, data.body]
  );

  await pool.query(
    `UPDATE public."Thread"
     SET "replyCount" = "replyCount" + 1, "updatedAt" = NOW()
     WHERE id = $1`,
    [data.threadId]
  );

  revalidatePath(`/collection/${data.specimenId}/discussion/${data.threadId}`);
  revalidatePath(`/discuss/${data.threadId}`);
}

export async function markBestAnswer(data: {
  replyId: string;
  threadId: string;
  specimenId: string;
}): Promise<void> {
  await getCurrentUser();
  await pool.query(
    `UPDATE public."ThreadReply" SET "isBest" = false WHERE "threadId" = $1`,
    [data.threadId]
  );
  await pool.query(
    `UPDATE public."ThreadReply" SET "isBest" = true WHERE id = $1`,
    [data.replyId]
  );
  await pool.query(
    `UPDATE public."Thread" SET resolved = true WHERE id = $1`,
    [data.threadId]
  );
  revalidatePath(`/collection/${data.specimenId}/discussion/${data.threadId}`);
  revalidatePath(`/discuss/${data.threadId}`);
}
