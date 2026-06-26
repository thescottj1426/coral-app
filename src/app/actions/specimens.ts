'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { welcomeTemplate } from '@/lib/emailTemplates';

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');
  return session.user;
}

function generateRFCode(): string {
  // Avoids ambiguous chars (0/O, 1/I/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return 'RF-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function uniqueRFCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateRFCode();
    const { rows } = await pool.query('SELECT 1 FROM public."Coral" WHERE "rfCode" = $1', [code]);
    if (rows.length === 0) return code;
  }
  throw new Error('Could not generate a unique RF code after 10 attempts');
}

export type SpecimenRow = {
  id: string;
  name: string;
  species: string | null;
  category: 'SPS' | 'LPS' | 'SOFTIE' | 'ZOA' | 'ANEMONE' | 'OTHER' | null;
  rfCode: string | null;
  origin: string | null;
  notes: string | null;
  identityHue: number | null;
  acquiredDate: string | null;
  createdAt: string;
  coverPhotoUrl: string | null;
};

export async function getMySpecimens(): Promise<SpecimenRow[]> {
  const user = await getCurrentUser();
  const { rows } = await pool.query<SpecimenRow>(
    `SELECT
       c.id, c.name, c.species, c.category, c."rfCode", c.origin, c.notes,
       c."identityHue", c."acquiredDate", c."createdAt",
       (SELECT '/api/image?key=' || p."s3Key" FROM public."CoralPhoto" p WHERE p."coralId" = c.id AND p.status = 'approved' ORDER BY p."createdAt" ASC LIMIT 1) AS "coverPhotoUrl"
     FROM public."Coral" c
     WHERE c."ownerId" = $1
     ORDER BY c."createdAt" DESC`,
    [user.id]
  );
  return rows;
}

export async function createSpecimen(data: {
  name: string;
  species?: string;
  category: string;
  origin?: string;
  notes?: string;
  photoUrl?: string;
  photoKey?: string;
}): Promise<SpecimenRow> {
  const user = await getCurrentUser();
  const rfCode = await uniqueRFCode();
  const identityHue = Math.floor(Math.random() * 360);

  const { rows } = await pool.query<SpecimenRow>(
    `INSERT INTO public."Coral"
       (id, name, species, category, origin, notes, "rfCode", "ownerId", "identityHue", "updatedAt")
     VALUES
       (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING id, name, species, category, "rfCode", origin, notes, "identityHue", "acquiredDate", "createdAt"`,
    [data.name, data.species ?? null, data.category, data.origin ?? null, data.notes ?? null, rfCode, user.id, identityHue]
  );

  const specimen = rows[0];

  if (data.photoUrl && data.photoKey) {
    await pool.query(
      `INSERT INTO public."CoralPhoto" (id, "s3Key", url, "coralId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())`,
      [data.photoKey, data.photoUrl, specimen.id]
    );
  }

  revalidatePath('/collection');

  // Welcome email on first specimen only
  const { rows: countRows } = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM public."Coral" WHERE "ownerId" = $1',
    [user.id]
  );
  if (parseInt(countRows[0].count, 10) === 1) {
    sendEmail(user.email, 'Your collection has started 🪸', welcomeTemplate(user.name ?? user.email)).catch(() => {});
  }

  return specimen;
}

export type SpecimenDetail = SpecimenRow & {
  ownerId: string;
  ownerUsername: string;
  ownerDisplayName: string | null;
  isOwner: boolean;
  photos: Array<{ id: string; url: string; s3Key: string; status: string }>;
};

export async function getSpecimen(rfCodeOrId: string): Promise<SpecimenDetail | null> {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const viewerId = session?.user?.id ?? null;

  const { rows } = await pool.query<SpecimenDetail>(
    `SELECT
       c.id, c.name, c.species, c.category, c."rfCode", c.origin, c.notes,
       c."identityHue", c."acquiredDate", c."createdAt",
       c."ownerId",
       u.username AS "ownerUsername",
       u."displayName" AS "ownerDisplayName",
       (c."ownerId" = $2) AS "isOwner",
       NULL AS "coverPhotoUrl",
       COALESCE(
         json_agg(
           json_build_object('id', p.id, 'url', '/api/image?key=' || p."s3Key", 's3Key', p."s3Key", 'status', p.status)
           ORDER BY p."createdAt" ASC
         ) FILTER (WHERE p.id IS NOT NULL AND (p.status = 'approved' OR c."ownerId" = $2)),
         '[]'
       ) AS photos
     FROM public."Coral" c
     JOIN public."User" u ON u.id = c."ownerId"
     LEFT JOIN public."CoralPhoto" p ON p."coralId" = c.id
     WHERE c."rfCode" = $1 OR c.id = $1
     GROUP BY c.id, u.username, u."displayName"
     LIMIT 1`,
    [rfCodeOrId, viewerId]
  );
  return rows[0] ?? null;
}

export async function updateSpecimen(id: string, data: {
  name: string;
  species?: string;
  category: string;
  origin?: string;
  notes?: string;
}): Promise<void> {
  const user = await getCurrentUser();
  await pool.query(
    `UPDATE public."Coral"
     SET name=$1, species=$2, category=$3::\"CoralCategory\", origin=$4, notes=$5, "updatedAt"=NOW()
     WHERE id=$6 AND "ownerId"=$7`,
    [data.name, data.species ?? null, data.category, data.origin ?? null, data.notes ?? null, id, user.id]
  );
  revalidatePath('/collection');
  revalidatePath(`/collection/${id}`);
}

export async function deleteSpecimen(id: string): Promise<void> {
  const user = await getCurrentUser();
  await pool.query(
    'DELETE FROM public."Coral" WHERE id = $1 AND "ownerId" = $2',
    [id, user.id]
  );
  revalidatePath('/collection');
}
