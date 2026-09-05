import { pool } from '@/lib/db';

export type PhotoAccess =
  | { ok: true; status: 'approved' | 'pending' }
  | { ok: false };

/**
 * Whether a viewer may be served the object behind an S3 key.
 *
 * /api/image used to return any key to anyone, so an unapproved photo was
 * fetchable by whoever held the URL. Moderation decided what appeared on public
 * pages but not what the proxy would hand out, which made the queue advisory.
 *
 * The rules mirror addSpecimenPhoto's write permission deliberately: whoever
 * may attach a photo may see it before review, and nobody else.
 */
export async function resolvePhotoAccess(
  s3Key: string,
  viewerId: string | null
): Promise<PhotoAccess> {
  const { rows } = await pool.query<{
    status: string;
    ownerId: string | null;
    parentOwnerId: string | null;
  }>(
    `SELECT ph.status, c."ownerId", par."ownerId" AS "parentOwnerId"
       FROM public."CoralPhoto" ph
       JOIN public."Coral" c ON c.id = ph."coralId"
       LEFT JOIN public."Lineage" l ON l."childId" = c.id
       LEFT JOIN public."Coral" par ON par.id = l."parentId"
      WHERE ph."s3Key" = $1
      LIMIT 1`,
    [s3Key]
  );

  const row = rows[0];
  if (!row) return { ok: false };

  if (row.status === 'approved') return { ok: true, status: 'approved' };

  // Rejected stays hidden from everyone, including the uploader — it was
  // reviewed and refused.
  if (row.status !== 'pending') return { ok: false };

  if (!viewerId) return { ok: false };

  const ownsIt = row.ownerId === viewerId;
  // The permission lapses on claim, exactly as it does for writing: once the
  // frag has an owner, the parent's owner is just another viewer.
  const ownsUnclaimedChild = row.ownerId === null && row.parentOwnerId === viewerId;

  return ownsIt || ownsUnclaimedChild ? { ok: true, status: 'pending' } : { ok: false };
}
