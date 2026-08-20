'use client';

import { useState } from 'react';
import { TextInput, Button, Title, Text, ThemeIcon, Stack } from '@mantine/core';
import { IconMail, IconCheck } from '@tabler/icons-react';
import { authClient } from '@/lib/auth-client';
import { BrandPanel } from '@/components/auth/BrandPanel';
import styles from '@/components/auth/auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        setError(result.error.message ?? 'Something went wrong');
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      <BrandPanel />
      <div className={styles.formPanel}>
        {sent ? (
          <div className={styles.formInner}>
            <Stack align="center" gap="md">
              <ThemeIcon size={56} radius="xl" color="ocean" variant="light">
                <IconCheck size={28} />
              </ThemeIcon>
              <div className={styles.formHeader}>
                <Title order={2}>Password reset is paused</Title>
                <Text c="dimmed" size="sm" mt={2}>
                  We&apos;re not sending email right now, so no reset link will arrive for{' '}
                  <strong>{email}</strong>. Contact us and we&apos;ll get you back in.
                </Text>
              </div>
            </Stack>
          </div>
        ) : (
          <form className={styles.formInner} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <Title order={2}>Forgot password?</Title>
              <Text c="dimmed" size="sm" mt={2}>
                Enter your email and we'll send a reset link.
              </Text>
            </div>

            {error && <Text c="red" size="sm">{error}</Text>}

            <TextInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />

            <Button type="submit" fullWidth loading={loading}>
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
