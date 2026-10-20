import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3, S3_BUCKET } from '@/lib/s3';
import { auth } from '@/lib/auth';
import { resolvePhotoAccess } from '@/lib/photoAccess';
import { withRoute } from '@/lib/log';

export const GET = withRoute('api.image', handleGet);

async function handleGet(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) return new NextResponse('Missing key', { status: 400 });

  // Resolved before the session is fetched: an approved photo is public, and
  // most requests are for approved photos.
  const viewerId = await currentUserId(request);
  const access = await resolvePhotoAccess(key, viewerId);

  // 404, never 403 — a 403 confirms the key names a real photo.
  if (!access.ok) return new NextResponse('Not found', { status: 404 });

  if (access.status === 'approved') {
    // Let S3 serve the bytes. Proxying them meant holding each image in memory
    // and paying for the same bandwidth twice.
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
    return NextResponse.redirect(url, {
      status: 302,
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  // Pending: streamed inline and never presigned. A presigned URL outlives the
  // session that earned it, which is the leak this whole change closes.
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) return new NextResponse('Not found', { status: 404 });

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': response.ContentType ?? 'image/jpeg',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    // A photo row exists but S3 could not return it — not a normal 404.
    Sentry.captureException(err, { tags: { api: 'image' }, extra: { key } });
    return new NextResponse('Not found', { status: 404 });
  }
}

async function currentUserId(request: NextRequest): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) return null;
    // The session id is better-auth's; app rows key on User.id, which
    // getCurrentUser also resolves by email.
    const { pool } = await import('@/lib/db');
    const { rows } = await pool.query<{ id: string }>(
      'SELECT id FROM public."User" WHERE email = $1',
      [session.user.email]
    );
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}
