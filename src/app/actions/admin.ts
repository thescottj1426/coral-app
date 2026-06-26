'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { pool, queryOne } from '@/lib/db';

async function getCurrentAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');
  const row = await queryOne<{ isAdmin: boolean }>(
    'SELECT "isAdmin" FROM public."User" WHERE id = $1',
    [session.user.id]
  );
  if (!row?.isAdmin) throw new Error('Not authorized');
  return session.user;
}

export type PendingPhoto = {
  id: string;
  s3Key: string;
  url: string;
  createdAt: string;
  coralId: string;
  coralName: string;
  coralRfCode: string | null;
  ownerUsername: string;
  ownerDisplayName: string | null;
};

export async function getPendingPhotos(): Promise<PendingPhoto[]> {
  await getCurrentAdmin();
  const { rows } = await pool.query<PendingPhoto>(
    `SELECT
       p.id, p."s3Key", '/api/image?key=' || p."s3Key" AS url, p."createdAt",
       c.id AS "coralId", c.name AS "coralName", c."rfCode" AS "coralRfCode",
       u.username AS "ownerUsername", u."displayName" AS "ownerDisplayName"
     FROM public."CoralPhoto" p
     JOIN public."Coral" c ON c.id = p."coralId"
     JOIN public."User" u ON u.id = c."ownerId"
     WHERE p.status = 'pending'
     ORDER BY p."createdAt" ASC`
  );
  return rows;
}

export async function reviewPhoto(
  photoId: string,
  decision: 'approved' | 'rejected',
  note?: string
): Promise<void> {
  const admin = await getCurrentAdmin();
  await pool.query(
    `UPDATE public."CoralPhoto"
     SET status = $1::"PhotoStatus", "reviewedBy" = $2, "reviewedAt" = NOW(), "reviewNote" = $3
     WHERE id = $4`,
    [decision, admin.id, note ?? null, photoId]
  );
  revalidatePath('/admin/photos');
}

export type OpenReport = {
  id: string;
  targetType: 'coral' | 'user' | 'thread' | 'reply';
  targetId: string;
  reason: string;
  createdAt: string;
  reporterUsername: string | null;
  targetPreview: string | null;
};

export async function getOpenReports(): Promise<OpenReport[]> {
  const { rows } = await pool.query<OpenReport>(
    `SELECT
       r.id, r."targetType", r."targetId", r.reason, r."createdAt",
       u.username AS "reporterUsername",
       CASE
         WHEN r."targetType" = 'coral'  THEN (SELECT name FROM public."Coral"        WHERE id = r."targetId")
         WHEN r."targetType" = 'user'   THEN (SELECT username FROM public."User"      WHERE id = r."targetId")
         WHEN r."targetType" = 'thread' THEN (SELECT title FROM public."Thread"       WHERE id = r."targetId")
         WHEN r."targetType" = 'reply'  THEN (SELECT LEFT(body, 80) FROM public."ThreadReply" WHERE id = r."targetId")
       END AS "targetPreview"
     FROM public."Report" r
     LEFT JOIN public."User" u ON u.id = r."reporterId"
     WHERE r.status = 'open'
     ORDER BY r."createdAt" ASC`
  );
  return rows;
}

export async function resolveReport(
  reportId: string,
  decision: 'resolved' | 'dismissed',
  note?: string
): Promise<void> {
  const admin = await getCurrentAdmin();
  await pool.query(
    `UPDATE public."Report"
     SET status = $1::"ReportStatus", "resolvedBy" = $2, "resolvedAt" = NOW(), "adminNote" = $3
     WHERE id = $4`,
    [decision, admin.id, note ?? null, reportId]
  );
  revalidatePath('/admin/reports');
}

export type AdminStats = {
  pendingPhotos: number;
  openReports: number;
  totalUsers: number;
  totalCorals: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  await getCurrentAdmin();
  const { rows } = await pool.query<{
    pendingPhotos: string;
    openReports: string;
    totalUsers: string;
    totalCorals: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM public."CoralPhoto" WHERE status = 'pending')::text AS "pendingPhotos",
       (SELECT COUNT(*) FROM public."Report"     WHERE status = 'open')::text    AS "openReports",
       (SELECT COUNT(*) FROM public."User")::text                                AS "totalUsers",
       (SELECT COUNT(*) FROM public."Coral")::text                               AS "totalCorals"`
  );
  const r = rows[0];
  return {
    pendingPhotos: parseInt(r.pendingPhotos, 10),
    openReports: parseInt(r.openReports, 10),
    totalUsers: parseInt(r.totalUsers, 10),
    totalCorals: parseInt(r.totalCorals, 10),
  };
}
