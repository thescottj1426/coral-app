'use client';

import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Paper,
  CopyButton,
  ActionIcon,
  Divider,
  ThemeIcon,
  Badge,
  ScrollArea,
  Loader,
  Select,
  Checkbox,
} from '@mantine/core';
import { IconCopy, IconCheck, IconLeaf, IconScissors, IconPlus, IconLink } from '@tabler/icons-react';
import { useState, useTransition } from 'react';
import { CoralThumb } from './CoralThumb';
import { notifications } from '@mantine/notifications';
import { createFrags } from '@/app/actions/lineage';
import { FragRow, type LoggedFrag } from './FragRow';
import { CORAL_STAGES } from '@/components/specimen/AddSpecimenDrawer';
import type { CoralStage } from '@/app/actions/specimens';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

export interface FragModalProps {
  opened: boolean;
  onClose: () => void;
  parentId: string;
  parentRfCode: string;
  parentName: string;
  parentGeneration: number;
}

export function FragModal({ opened, onClose, parentId, parentRfCode, parentName, parentGeneration }: FragModalProps) {
  const newGeneration = parentGeneration + 1;
  const [frags, setFrags] = useState<LoggedFrag[]>([]);
  const [stage, setStage] = useState<CoralStage>('FRAG');
  const [keepForSelf, setKeepForSelf] = useState(false);
  const [isPending, startTransition] = useTransition();

  function addFrag() {
    startTransition(async () => {
      const created = await createFrags(parentId, 1, { stage, keepForSelf });
      if ('error' in created) {
        notifications.show({ title: 'Could not log frag', message: created.error, color: 'red' });
        return;
      }
      setFrags((prev) => [...prev, ...created]);
    });
  }

  function handleClose() {
    setFrags([]);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size={440}
      centered
      title={
        <Group gap={8}>
          <ThemeIcon size={28} radius="md" variant="light" color="teal">
            <IconScissors size={15} />
          </ThemeIcon>
          <Stack gap={0}>
            <Group gap={8}>
              <Text style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 15 }}>
                Frag logger
              </Text>
              <Badge variant="light" color="teal" size="sm" radius="xl">
                {frags.length} {frags.length === 1 ? 'frag' : 'frags'}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">Share each RF code with whoever receives that plug</Text>
          </Stack>
        </Group>
      }
      styles={{
        header: { paddingBottom: 12, borderBottom: '1px solid var(--mantine-color-default-border)' },
        body: { paddingTop: 20 },
      }}
    >
      <Stack gap="lg">
        {/* Parent coral */}
        <Group gap={10} align="center">
          <CoralThumb rfCode={parentRfCode} size={40} radius={8} />
          <Stack gap={2}>
            <Text size="sm" fw={600}>{parentName}</Text>
            <Group gap={4}>
              <IconLeaf size={11} color="var(--mantine-color-teal-6)" />
              <Text size="xs" c="teal.7">
                {parentRfCode} · each frag will be Gen {newGeneration}
              </Text>
            </Group>
          </Stack>
        </Group>

        <Divider />

        {/* Code list */}
        <Stack gap={4}>
          <Group justify="space-between" align="center" mb={4}>
            <Text style={EYEBROW}>rf codes registered</Text>
            <Text size="xs" c="dimmed">{frags.length} frag{frags.length !== 1 ? 's' : ''} logged</Text>
          </Group>

          {frags.length === 0 ? (
            isPending ? (
              <Group justify="center" py="md">
                <Loader size="sm" color="teal" />
                <Text size="xs" c="dimmed">Registering frag code…</Text>
              </Group>
            ) : (
              <Paper p="md" style={{ textAlign: 'center', border: '1px dashed var(--mantine-color-default-border)' }}>
                <Text size="sm" c="dimmed">No frags logged yet</Text>
                <Text size="xs" c="dimmed" mt={4}>Click below to generate your first RF code</Text>
              </Paper>
            )
          ) : (
            <ScrollArea.Autosize mah={320} offsetScrollbars>
              <Stack gap={6}>
                {frags.map((f, i) => (
                  <FragRow key={f.id} frag={f} index={i} />
                ))}
              </Stack>
            </ScrollArea.Autosize>
          )}
        </Stack>

        {/* What is being cut, and whether it stays with you */}
        <Stack gap="sm">
          <Select
            label="Frag size"
            description="The size of the new plug, not the colony it came from."
            data={CORAL_STAGES.map(o => ({ value: o.value, label: o.label }))}
            value={stage}
            onChange={(v) => v && setStage(v as CoralStage)}
            allowDeselect={false}
            size="sm"
          />
          <Checkbox
            label="Keep this one — add it straight to my collection"
            description="Skips the claim step. Use when you are fragging to grow out yourself."
            checked={keepForSelf}
            onChange={(e) => setKeepForSelf(e.currentTarget.checked)}
          />
        </Stack>

        {/* Add frag */}
        <Button
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={addFrag}
          loading={isPending}
          fullWidth
        >
          {keepForSelf ? 'Log a frag and keep it' : 'Log a frag'}
        </Button>

        <Divider />

        {/* What happens next */}
        <Paper p="sm" withBorder>
          <Text style={{ ...EYEBROW, marginBottom: 6 }}>what happens next</Text>
          <Stack gap={4}>
            {[
              'Give each friend their frag plug + RF code, or copy the claim link',
              'They visit the link or enter the code at /claim',
              'Their name joins the lineage — permanently',
            ].map((step, i) => (
              <Group key={i} gap={8} wrap="nowrap" align="flex-start">
                <Text
                  style={{
                    fontFamily: 'var(--font-ibm-plex-mono), monospace',
                    fontSize: 10,
                    color: 'var(--mantine-color-ocean-6)',
                    fontWeight: 600,
                    flexShrink: 0,
                    lineHeight: '18px',
                  }}
                >
                  0{i + 1}
                </Text>
                <Text size="xs" c="dimmed">{step}</Text>
              </Group>
            ))}
          </Stack>
        </Paper>

        <Button onClick={handleClose}>Done</Button>
      </Stack>
    </Modal>
  );
}
