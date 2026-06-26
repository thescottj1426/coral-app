import { BrandPanel } from '@/components/auth/BrandPanel';
import { SignUpForm } from '@/components/auth/SignUpForm';
import styles from '@/components/auth/auth.module.css';

export default function SignUpPage() {
  return (
    <div className={styles.root}>
      <BrandPanel />
      <SignUpForm />
    </div>
  );
}
