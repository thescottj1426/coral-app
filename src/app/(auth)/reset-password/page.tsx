'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PasswordInput, Button, Title, Text, Anchor } from '@mantine/core';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { BrandPanel } from '@/components/auth/BrandPanel';
import styles from '@/components/auth/auth.module.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message ?? 'Something went wrong');
      } else {
        router.push('/sign-in?reset=1');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.formInner}>
        <div className={styles.formHeader}>
          <Title order={2}>Invalid link</Title>
          <Text c="dimmed" size="sm" mt={2}>
            This reset link is missing or malformed.{' '}
            <Anchor component={Link} href="/forgot-password" c="ocean.6">
              Request a new one
            </Anchor>
          </Text>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.formInner} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <Title order={2}>Reset password</Title>
        <Text c="dimmed" size="sm" mt={2}>Choose a new password for your account.</Text>
      </div>

      {error && (
        <Text c="red" size="sm">
          {error}{' '}
          {error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') ? (
            <Anchor component={Link} href="/forgot-password" c="ocean.6">Request a new link</Anchor>
          ) : null}
        </Text>
      )}

      <PasswordInput
        label="New password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        minLength={8}
        required
      />

      <PasswordInput
        label="Confirm password"
        placeholder="Same as above"
        value={confirm}
        onChange={(e) => setConfirm(e.currentTarget.value)}
        required
      />

      <Button type="submit" fullWidth loading={loading}>
        Set new password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.root}>
      <BrandPanel />
      <div className={styles.formPanel}>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
