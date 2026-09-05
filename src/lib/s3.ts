import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET!;

/**
 * The one place a photo URL is built. The bucket is private — a direct object
 * URL answers 403 — so images are served through /api/image, which signs the
 * read.
 *
 * This used to be constructed in fourteen separate SQL fragments plus a
 * misnamed `s3PublicUrl` that returned the direct bucket URL. With no single
 * answer to "what is this photo's URL", /api/upload quietly returned the wrong
 * one and every frag photo rendered blank. Queries now select `s3Key` and hand
 * it here.
 */
export function imageProxyUrl(key: string): string {
  return `/api/image?key=${encodeURIComponent(key)}`;
}
