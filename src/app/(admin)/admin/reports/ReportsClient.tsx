'use client';

import { useState, useTransition } from 'react';
import {
  Stack,
  Text,
  Badge,
  Button,
  Paper,
  Table,
  Group,
  TextInput,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { resolveReport } from '@/app/actions/admin';
import type { OpenReport } from '@/app/actions/admin';

const TARGET_COLOR: Record<string, string> = {
  coral: 'ocean',
  user: 'violet',
  thread: 'teal',
  reply: 'gray',
};

function ReportRow({ report, onDone }: { report: OpenReport; onDone: (id: string) => void }) {
  const [, startTransition] = useTransition();
  const [noteMode, setNoteMode] = useState<'resolved' | 'dismissed' | null>(null);
  const [note, setNote] = useState('');

  function act(decision: 'resolved' | 'dismissed') {
    if (!noteMode) { setNoteMode(decision); return; }
    startTransition(async () => {
      await resolveReport(report.id, decision, note || undefined);
      notifications.show({
        message: `Report ${decision}`,
        color: decision === 'resolved' ? 'teal' : 'gray',
      });
      onDone(report.id);
    });
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Badge size="xs" variant="light" color={TARGET_COLOR[report.targetType] ?? 'gray'} radius="sm">
          {report.targetType}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" truncate maw={220}>
          {report.targetPreview ?? report.targetId}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">{report.reporterUsername ? `@${report.reporterUsername}` : 'anon'}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" style={{ maxWidth: 240, whiteSpace: 'pre-wrap' }}>{report.reason}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </Table.Td>
      <Table.Td>
        <Stack gap={4} align="flex-start">
          {noteMode && (
            <TextInput
              size="xs"
              placeholder="Admin note (optional)"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
              autoFocus
              style={{ width: 180 }}
            />
          )}
          <Group gap={6}>
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconCheck size={12} />}
              onClick={() => act('resolved')}
            >
              {noteMode === 'resolved' ? 'Confirm' : 'Resolve'}
            </Button>
            <Button
              size="xs"
              variant="light"
              color="gray"
              leftSection={<IconX size={12} />}
              onClick={() => act('dismissed')}
            >
              {noteMode === 'dismissed' ? 'Confirm' : 'Dismiss'}
            </Button>
            {noteMode && (
              <Button size="xs" variant="subtle" color="gray" onClick={() => { setNoteMode(null); setNote(''); }}>
                Cancel
              </Button>
            )}
          </Group>
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
}

export function ReportsClient({ reports: initial }: { reports: OpenReport[] }) {
  const [reports, setReports] = useState(initial);

  function remove(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  if (reports.length === 0) {
    return (
      <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
        <Text fw={600} mb={4}>All clear</Text>
        <Text size="sm" c="dimmed">No open reports.</Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Type</Table.Th>
            <Table.Th>Target</Table.Th>
            <Table.Th>Reporter</Table.Th>
            <Table.Th>Reason</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} onDone={remove} />
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
