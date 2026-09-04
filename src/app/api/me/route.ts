import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { queryOne } from '@/lib/db';

export async function GET() {
  // getCurrentUser resolves the app User.id by email — matching on
  // session.user.id directly returns nothing for accounts migrated from the
  // old auth system, which is the bug this used to have.
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch {
    return NextResponse.json({ username: null, isAdmin: false });
  }

  const row = await queryOne<{ username: string; isAdmin: boolean }>(
    'SELECT username, "isAdmin" FROM public."User" WHERE id = $1',
    [user.id]
  );
  return NextResponse.json({
    username: row?.username ?? null,
    isAdmin: row?.isAdmin ?? false,
  });
}
