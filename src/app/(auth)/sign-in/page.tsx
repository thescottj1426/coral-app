import { BrandPanel } from '@/components/auth/BrandPanel';
import { SignInForm } from '@/components/auth/SignInForm';
import styles from '@/components/auth/auth.module.css';

export default function SignInPage() {
  return (
    <div className={styles.root}>
      <BrandPanel />
      <SignInForm />
    </div>
  );
}
