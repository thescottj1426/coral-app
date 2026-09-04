import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { queryOne } from '@/lib/db';
import { AppShellWrapper } from '@/components/shell/AppShellWrapper';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Resolves the app User.id by email. Matching session.user.id against
  // User.id returns nothing for accounts migrated from the old auth system,
  // which would lock a genuine admin out of their own admin pages.
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch {
    redirect('/sign-in');
  }

  const row = await queryOne<{ isAdmin: boolean }>(
    'SELECT "isAdmin" FROM public."User" WHERE id = $1',
    [user.id]
  );
  if (!row?.isAdmin) redirect('/collection');

  return <AppShellWrapper>{children}</AppShellWrapper>;
}
