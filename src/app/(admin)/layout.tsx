import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { AppShellWrapper } from '@/components/shell/AppShellWrapper';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const row = await queryOne<{ isAdmin: boolean }>(
    'SELECT "isAdmin" FROM public."User" WHERE id = $1',
    [session.user.id]
  );
  if (!row?.isAdmin) redirect('/dashboard');

  return <AppShellWrapper>{children}</AppShellWrapper>;
}
