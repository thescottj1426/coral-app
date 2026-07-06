'use client';

import { useState, useTransition } from 'react';
import { Title, Text, Button, Stack, Paper, ThemeIcon } from '@mantine/core';
import { IconMail, IconCheck } from '@tabler/icons-react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function VerifyNoticePage() {
  const router = useRouter();
  const [resendSent, setResendSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    startTransition(async () => {
      const session = await authClient.getSession();
      if (!session.data?.user?.email) return;
      await authClient.sendVerificationEmail({
        email: session.data.user.email,
        callbackURL: '/dashboard',
      });
      setResendSent(true);
    });
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--mantine-color-gray-0)',
      padding: '24px',
    }}>
      <Paper withBorder p="xl" radius="md" style={{ maxWidth: 440, width: '100%' }}>
        <Stack align="center" gap="md">
          <ThemeIcon size={56} radius="xl" color="ocean" variant="light">
            <IconMail size={28} />
          </ThemeIcon>

          <Stack align="center" gap={4}>
            <Title order={2} style={{ fontFamily: 'var(--font-sora)' }}>
              Check your inbox
            </Title>
            <Text c="dimmed" size="sm" ta="center" style={{ lineHeight: 1.6 }}>
              We sent a verification link to your email address.
              Click it to activate your Coral Chest account.
            </Text>
          </Stack>

          {resendSent ? (
            <Stack align="center" gap={6}>
              <ThemeIcon size={32} radius="xl" color="teal" variant="light">
                <IconCheck size={16} />
              </ThemeIcon>
              <Text size="sm" c="teal.7" fw={500}>Email resent — check your inbox.</Text>
            </Stack>
          ) : (
            <Button variant="light" fullWidth loading={isPending} onClick={handleResend}>
              Resend verification email
            </Button>
          )}

          <Button variant="subtle" color="gray" size="sm" onClick={handleSignOut}>
            Sign out and use a different account
          </Button>
        </Stack>
      </Paper>
    </div>
  );
}
