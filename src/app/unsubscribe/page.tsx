import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button, Container, Paper, Stack, Text, Title } from '@mantine/core';
import type { Metadata } from 'next';
import { unsubscribeByToken } from '@/app/actions/unsubscribe';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';

export const metadata: Metadata = {
  title: 'Unsubscribe — Coral Chest',
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string }>;
}) {
  const { token = '', done } = await searchParams;
  const valid = verifyUnsubscribeToken(token) !== null;

  // A button rather than unsubscribing on load: mail scanners open every link.
  async function confirm() {
    'use server';
    const ok = await unsubscribeByToken(token);
    redirect(`/unsubscribe?token=${encodeURIComponent(token)}&done=${ok ? '1' : '0'}`);
  }

  return (
    <Container size="xs" py={80}>
      <Paper withBorder p="xl" radius="md">
        <Stack gap="md">
          <Title order={2} style={{ fontFamily: 'var(--font-sora)' }}>
            {done === '1' ? 'You’re unsubscribed' : 'Unsubscribe'}
          </Title>
          {!valid || done === '0' ? (
            <Text size="sm" c="dimmed">This unsubscribe link is invalid or expired.</Text>
          ) : done === '1' ? (
            <Text size="sm" c="dimmed">
              You won’t get Coral Chest updates anymore. Account emails like password resets still arrive.
            </Text>
          ) : (
            <>
              <Text size="sm" c="dimmed">
                Stop receiving Coral Chest updates and announcements? Account emails like password resets still arrive.
              </Text>
              <form action={confirm}>
                <Button type="submit">Unsubscribe</Button>
              </form>
            </>
          )}
          <Link href="/" style={{ fontSize: 13, color: 'var(--mantine-color-dimmed)' }}>
            ← Coral Chest
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}
