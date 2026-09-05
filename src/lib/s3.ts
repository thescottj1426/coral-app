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
 * The bucket is private — a direct object URL answers 403, so it can never be
 * rendered. Every read path already rebuilds this shape in SQL
 * (`'/api/image?key=' || p."s3Key"`); this is the same URL for callers holding
 * a key in JS.
 *
 * The predecessor was named s3PublicUrl and returned the direct S3 URL. It
 * asserted a public bucket that does not exist, and the one component that
 * rendered its output — FragRow — showed a blank image for every frag photo
 * ever taken.
 */
export function imageProxyUrl(key: string): string {
  return `/api/image?key=${encodeURIComponent(key)}`;
}
