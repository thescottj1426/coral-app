import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { BrandPanel } from '@/components/auth/BrandPanel';
import { SignUpForm } from '@/components/auth/SignUpForm';
import styles from '@/components/auth/auth.module.css';

export const dynamic = 'force-dynamic';

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect('/dashboard');

  return (
    <div className={styles.root}>
      <BrandPanel />
      <SignUpForm />
    </div>
  );
}
