'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { pool, queryOne } from '@/lib/db';
import { imageProxyUrl } from '@/lib/s3';
import { sendEmail, type SendResult } from '@/lib/email';
import { broadcastTemplate } from '@/lib/emailTemplates';
import { unsubscribeToken } from '@/lib/unsubscribe';
import { siteUrl } from '@/lib/siteUrl';
import * as log from '@/lib/log';

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
  // Null for an unclaimed frag, which has no owner until its code is claimed.
  ownerUsername: string | null;
  ownerDisplayName: string | null;
  // Who cut the frag, and so who photographed it.
  parentOwnerUsername: string | null;
};

export async function getPendingPhotos(): Promise<PendingPhoto[]> {
  await getCurrentAdmin();
  const { rows } = await pool.query<PendingPhoto>(
    `SELECT
       p.id, p."s3Key", p."createdAt",
       c.id AS "coralId", c.name AS "coralName", c."rfCode" AS "coralRfCode",
       u.username AS "ownerUsername", u."displayName" AS "ownerDisplayName",
       pu.username AS "parentOwnerUsername"
     FROM public."CoralPhoto" p
     -- LEFT: a frag has no owner until claimed, and an inner join here hid
     -- its photos from the queue entirely.
     JOIN public."Coral" c ON c.id = p."coralId"
     LEFT JOIN public."User" u ON u.id = c."ownerId"
     LEFT JOIN public."Lineage" l ON l."childId" = c.id
     LEFT JOIN public."Coral" par ON par.id = l."parentId"
     LEFT JOIN public."User" pu ON pu.id = par."ownerId"
     WHERE p.status = 'pending'
     ORDER BY p."createdAt" ASC`
  );
  return rows.map((r) => ({ ...r, url: imageProxyUrl(r.s3Key) }));
}

export async function reviewPhoto(
  photoId: string,
  decision: 'approved' | 'rejected',
  note?: string
): Promise<void> {
  const admin = await getCurrentAdmin();

  // Needed to refresh the coral's own page, which is still ISR-cached.
  const { rows } = await pool.query<{ rfCode: string | null }>(
    `SELECT c."rfCode"
     FROM public."CoralPhoto" p
     JOIN public."Coral" c ON c.id = p."coralId"
     WHERE p.id = $1`,
    [photoId]
  );

  await pool.query(
    `UPDATE public."CoralPhoto"
     SET status = $1::"PhotoStatus", "reviewedBy" = $2, "reviewedAt" = NOW(), "reviewNote" = $3
     WHERE id = $4`,
    [decision, admin.id, note ?? null, photoId]
  );

  revalidatePath('/admin/photos');

  // Home, /explore and the coral's public page cache for an hour, and a
  // reviewer who just approved a photo will look at the coral immediately.
  revalidatePath('/');
  revalidatePath('/explore');
  if (rows[0]?.rfCode) revalidatePath(`/coral/${rows[0].rfCode}`);
}

export type ReviewedPhoto = PendingPhoto & {
  status: 'approved' | 'rejected';
  reviewedAt: string;
  reviewNote: string | null;
  reviewerUsername: string | null;
};

export async function getPhotoHistory(limit = 100): Promise<ReviewedPhoto[]> {
  await getCurrentAdmin();
  const { rows } = await pool.query<ReviewedPhoto>(
    `SELECT
       p.id, p."s3Key", p."createdAt",
       p.status, p."reviewedAt", p."reviewNote",
       c.id AS "coralId", c.name AS "coralName", c."rfCode" AS "coralRfCode",
       u.username AS "ownerUsername", u."displayName" AS "ownerDisplayName",
       pu.username AS "parentOwnerUsername",
       r.username AS "reviewerUsername"
     FROM public."CoralPhoto" p
     JOIN public."Coral" c ON c.id = p."coralId"
     LEFT JOIN public."User" u ON u.id = c."ownerId"
     LEFT JOIN public."Lineage" l ON l."childId" = c.id
     LEFT JOIN public."Coral" par ON par.id = l."parentId"
     LEFT JOIN public."User" pu ON pu.id = par."ownerId"
     LEFT JOIN public."User" r ON r.id = p."reviewedBy"
     WHERE p.status IN ('approved', 'rejected')
     ORDER BY p."reviewedAt" DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({ ...r, url: imageProxyUrl(r.s3Key) }));
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
  // Every other export here gates on this; this one did not. It returns
  // reporterUsername alongside the reason, so an unguarded read hands the
  // reported person the name of whoever reported them.
  await getCurrentAdmin();
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

export async function getVerifiedUsers(): Promise<string[]> {
  await getCurrentAdmin();
  const { rows } = await pool.query<{ username: string }>(
    `SELECT username FROM public."User" WHERE verified = true ORDER BY username`
  );
  return rows.map((r) => r.username);
}

/** "Verified farm" on every coral descended from this user's colonies. */
export async function setUserVerified(username: string, verified: boolean): Promise<{ error?: string }> {
  await getCurrentAdmin();
  const res = await pool.query(
    `UPDATE public."User" SET verified = $1, "updatedAt" = NOW() WHERE lower(username) = lower($2)`,
    [verified, username.trim().replace(/^@/, '')]
  );
  if (res.rowCount !== 1) return { error: `No user @${username.trim().replace(/^@/, '')}` };
  revalidatePath('/admin');
  revalidatePath('/coral/[rfCode]', 'page');
  return {};
}

export type BroadcastAudience = { kind: 'all' } | { kind: 'usernames'; usernames: string[] };

// Resend's free plan allows 100 emails a day; a bigger send fails partway through.
const MAX_RECIPIENTS = 100;
// Resend's default rate limit is 2 requests a second.
const SEND_GAP_MS = 600;

type Recipient = { id: string; email: string; username: string };

async function resolveRecipients(audience: BroadcastAudience) {
  const names = audience.kind === 'usernames'
    ? [...new Set(audience.usernames.map((u) => u.trim().replace(/^@/, '').toLowerCase()).filter(Boolean))]
    : [];
  const { rows } = await pool.query<Recipient & { emailOptOut: boolean }>(
    `SELECT id, email, username, "emailOptOut" FROM public."User"
     WHERE email IS NOT NULL AND ($1::boolean OR lower(username) = ANY($2::text[]))
     ORDER BY "createdAt" ASC`,
    [audience.kind === 'all', names]
  );
  const found = new Set(rows.map((r) => r.username.toLowerCase()));
  return {
    recipients: rows.filter((r) => !r.emailOptOut),
    optedOut: rows.filter((r) => r.emailOptOut).length,
    unknown: names.filter((n) => !found.has(n)),
  };
}

export type BroadcastPreview = { count: number; optedOut: number; unknown: string[]; overLimit: boolean };

export async function previewBroadcastRecipients(audience: BroadcastAudience): Promise<BroadcastPreview> {
  await getCurrentAdmin();
  const { recipients, optedOut, unknown } = await resolveRecipients(audience);
  return { count: recipients.length, optedOut, unknown, overLimit: recipients.length > MAX_RECIPIENTS };
}

function broadcastEmail(subject: string, body: string, userId: string) {
  const unsubscribeUrl = `${siteUrl()}/unsubscribe?token=${encodeURIComponent(unsubscribeToken(userId))}`;
  const oneClickUrl = `${siteUrl()}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken(userId))}`;
  return {
    html: broadcastTemplate(subject, body, unsubscribeUrl),
    headers: {
      'List-Unsubscribe': `<${oneClickUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

export async function sendTestBroadcast(subject: string, body: string): Promise<SendResult> {
  const admin = await getCurrentAdmin();
  const { html, headers } = broadcastEmail(subject, body, admin.id);
  return sendEmail(admin.email, `[Test] ${subject}`, html, headers);
}

export async function sendBroadcast(
  subject: string,
  body: string,
  audience: BroadcastAudience
): Promise<{ sent: number; failed: number } | { error: string }> {
  const admin = await getCurrentAdmin();
  if (!subject.trim() || !body.trim()) return { error: 'Subject and message are required' };

  const { recipients } = await resolveRecipients(audience);
  if (recipients.length === 0) return { error: 'No recipients' };
  if (recipients.length > MAX_RECIPIENTS) {
    return { error: `${recipients.length} recipients is over the ${MAX_RECIPIENTS}/day limit` };
  }

  let sent = 0;
  let failed = 0;
  for (const [i, r] of recipients.entries()) {
    if (i > 0) await new Promise((res) => setTimeout(res, SEND_GAP_MS));
    const { html, headers } = broadcastEmail(subject, body, r.id);
    const result = await sendEmail(r.email, subject, html, headers);
    if (result.ok) sent++;
    else failed++;
  }

  await pool.query(
    `INSERT INTO public."EmailBroadcast"
       (id, subject, body, audience, "recipientCount", "sentCount", "failedCount", "sentById")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)`,
    [
      subject, body,
      audience.kind === 'all' ? 'all' : audience.usernames.join(','),
      recipients.length, sent, failed, admin.id,
    ]
  );
  log.event('email.broadcast_sent', { recipients: recipients.length, sent, failed });
  revalidatePath('/admin/email');
  return { sent, failed };
}

export type BroadcastRow = {
  id: string;
  subject: string;
  audience: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
};

export async function getBroadcastHistory(): Promise<BroadcastRow[]> {
  await getCurrentAdmin();
  const { rows } = await pool.query<BroadcastRow>(
    `SELECT id, subject, audience, "recipientCount", "sentCount", "failedCount", "createdAt"
     FROM public."EmailBroadcast" ORDER BY "createdAt" DESC LIMIT 50`
  );
  return rows;
}
