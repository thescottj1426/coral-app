import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ username: null });
  const row = await queryOne<{ username: string; isAdmin: boolean }>(
    'SELECT username, "isAdmin" FROM public."User" WHERE id = $1',
    [session.user.id]
  );
  return NextResponse.json({ username: row?.username ?? null, isAdmin: row?.isAdmin ?? false });
}
