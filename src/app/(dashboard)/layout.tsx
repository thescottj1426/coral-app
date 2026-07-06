import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { AppShellWrapper } from '@/components/shell/AppShellWrapper';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');
  if (!session.user.emailVerified) redirect('/verify-notice');
  return <AppShellWrapper>{children}</AppShellWrapper>;
}
