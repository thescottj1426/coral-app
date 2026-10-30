'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Alert,
  Button,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { IconSend, IconTestPipe } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  previewBroadcastRecipients,
  sendBroadcast,
  sendTestBroadcast,
  type BroadcastAudience,
  type BroadcastPreview,
  type BroadcastRow,
} from '@/app/actions/admin';
import { broadcastTemplate } from '@/lib/emailTemplates';
import styles from './email.module.css';

export function EmailClient({ history }: { history: BroadcastRow[] }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<'all' | 'usernames'>('usernames');
  const [usernames, setUsernames] = useState('');
  const [preview, setPreview] = useState<BroadcastPreview | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const audience: BroadcastAudience = kind === 'all'
    ? { kind: 'all' }
    : { kind: 'usernames', usernames: usernames.split(/[\s,]+/) };
  const audienceKey = kind === 'all' ? 'all' : usernames;

  // Counted when the audience changes, not on a timer — each count is one query.
  useEffect(() => {
    const t = setTimeout(() => {
      previewBroadcastRecipients(audience).then(setPreview).catch(() => setPreview(null));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceKey]);

  const ready = subject.trim() !== '' && body.trim() !== '';
  const canSend = ready && !!preview && preview.count > 0 && !preview.overLimit;

  function test() {
    startTransition(async () => {
      const r = await sendTestBroadcast(subject, body);
      notifications.show(r.ok
        ? { message: 'Test sent to your inbox', color: 'teal' }
        : { message: `Test failed: ${r.error}`, color: 'red' });
    });
  }

  function send() {
    if (!confirming) { setConfirming(true); return; }
    startTransition(async () => {
      const r = await sendBroadcast(subject, body, audience);
      setConfirming(false);
      if ('error' in r) {
        notifications.show({ message: r.error, color: 'red' });
        return;
      }
      notifications.show({
        message: `Sent ${r.sent}${r.failed ? `, ${r.failed} failed` : ''}`,
        color: r.failed ? 'yellow' : 'teal',
      });
      if (r.failed === 0) { setSubject(''); setBody(''); }
    });
  }

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <SegmentedControl
              value={kind}
              onChange={(v) => { setKind(v as 'all' | 'usernames'); setConfirming(false); }}
              data={[
                { value: 'usernames', label: 'Specific users' },
                { value: 'all', label: 'All users' },
              ]}
            />
            {kind === 'usernames' && (
              <Textarea
                label="Usernames"
                description="Separated by commas, spaces or new lines"
                placeholder="@reefer1, @reefer2"
                autosize
                minRows={2}
                value={usernames}
                onChange={(e) => { setUsernames(e.currentTarget.value); setConfirming(false); }}
              />
            )}
            {preview && (
              <Text size="sm" c={preview.overLimit ? 'red' : 'dimmed'}>
                {preview.count} recipient{preview.count === 1 ? '' : 's'}
                {preview.optedOut > 0 && ` · ${preview.optedOut} opted out (skipped)`}
                {preview.overLimit && ' · over the 100/day limit'}
              </Text>
            )}
            {preview && preview.unknown.length > 0 && (
              <Alert color="yellow" variant="light" p="xs">
                <Text size="xs">Not found: {preview.unknown.map((u) => `@${u}`).join(', ')}</Text>
              </Alert>
            )}
            <TextInput
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.currentTarget.value)}
            />
            <Textarea
              label="Message"
              description="Plain text. Blank line = new paragraph. Links are clickable."
              autosize
              minRows={8}
              value={body}
              onChange={(e) => setBody(e.currentTarget.value)}
            />
            <Group gap="sm">
              <Button
                variant="light"
                leftSection={<IconTestPipe size={16} />}
                disabled={!ready || pending}
                onClick={test}
              >
                Send test to me
              </Button>
              <Button
                color={confirming ? 'red' : undefined}
                leftSection={<IconSend size={16} />}
                disabled={!canSend}
                loading={pending && confirming}
                onClick={send}
              >
                {confirming ? `Confirm: send to ${preview?.count}` : `Send to ${preview?.count ?? 0}`}
              </Button>
              {confirming && !pending && (
                <Button variant="subtle" color="gray" onClick={() => setConfirming(false)}>Cancel</Button>
              )}
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder radius="md" className={styles.previewPane}>
          <iframe
            title="Email preview"
            className={styles.previewFrame}
            srcDoc={broadcastTemplate(subject || 'Subject', body || 'Your message…', '#')}
          />
        </Paper>
      </SimpleGrid>

      <Stack gap="xs">
        <Text fw={600}>Sent</Text>
        {history.length === 0 ? (
          <Text size="sm" c="dimmed">Nothing sent yet.</Text>
        ) : (
          <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Subject</Table.Th>
                  <Table.Th>Audience</Table.Th>
                  <Table.Th>Sent</Table.Th>
                  <Table.Th>Failed</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {history.map((b) => (
                  <Table.Tr key={b.id}>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(b.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </Table.Td>
                    <Table.Td><Text size="sm">{b.subject}</Text></Table.Td>
                    <Table.Td><Text size="xs" truncate maw={220}>{b.audience}</Text></Table.Td>
                    <Table.Td><Text size="sm">{b.sentCount}/{b.recipientCount}</Text></Table.Td>
                    <Table.Td><Text size="sm" c={b.failedCount ? 'red' : 'dimmed'}>{b.failedCount}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
