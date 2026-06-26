'use server';

import { headers } from 'next/headers';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@/lib/auth';
import { s3, S3_BUCKET, s3PublicUrl } from '@/lib/s3';

export async function getUploadUrl(
  contentType: string,
  ext: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');

  const key = `specimens/${session.user.id}/${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  return { uploadUrl, publicUrl: s3PublicUrl(key), key };
}
