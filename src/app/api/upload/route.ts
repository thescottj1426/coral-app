import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@/lib/auth';
import { s3, S3_BUCKET, imageProxyUrl } from '@/lib/s3';
import { addSpecimenPhoto } from '@/app/actions/specimens';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  // Optional: when the coral already exists the row is written here, in the
  // same request. Adding a coral uploads before the coral exists, so that
  // caller omits it and passes the key to createSpecimen instead.
  const specimenId = formData.get('specimenId');

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 8 MB)' }, { status: 413 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const key = `specimens/${session.user.id}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  if (typeof specimenId === 'string' && specimenId) {
    // Two requests meant a window where the object sat in S3 with no row
    // pointing at it — an orphan nothing would ever clean up. Authorization is
    // addSpecimenPhoto's, unchanged.
    try {
      const photo = await addSpecimenPhoto({
        specimenId,
        photoKey: key,
        photoUrl: imageProxyUrl(key),
      });
      return NextResponse.json({ url: photo.url, key, photo });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not attach the photo';
      return NextResponse.json({ error: message }, { status: message === 'Not authorized' ? 403 : 400 });
    }
  }

  return NextResponse.json({ url: imageProxyUrl(key), key });
}
