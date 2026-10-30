import { Box, Stack, Text } from '@mantine/core';
import { getBroadcastHistory } from '@/app/actions/admin';
import { EmailClient } from './EmailClient';

export const dynamic = 'force-dynamic';
// sendBroadcast paces sends under Resend's rate limit; 100 recipients takes ~1–2 minutes.
export const maxDuration = 300;

export default async function AdminEmailPage() {
  const history = await getBroadcastHistory();

  return (
    <Box p="lg" maw={1100}>
      <Stack gap="xl">
        <Stack gap={4}>
          <Text
            component="h1"
            style={{ fontSize: 24, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            Email users
          </Text>
          <Text size="sm" c="dimmed">
            Announcements and invites. Opted-out users are skipped; every email carries an unsubscribe link.
          </Text>
        </Stack>
        <EmailClient history={history} />
      </Stack>
    </Box>
  );
}
