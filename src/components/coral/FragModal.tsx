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
} from '@mantine/core';
import { IconCopy, IconCheck, IconLeaf, IconScissors, IconPlus } from '@tabler/icons-react';
import { useState, useCallback } from 'react';
import { CoralThumb } from './CoralThumb';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

function generateRFCode(): string {
  // Avoids ambiguous chars (0/O, 1/I/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return 'RF-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export interface FragModalProps {
  opened: boolean;
  onClose: () => void;
  parentRfCode: string;
  parentName: string;
  parentGeneration: number;
}

export function FragModal({ opened, onClose, parentRfCode, parentName, parentGeneration }: FragModalProps) {
  const newGeneration = parentGeneration + 1;

  // Start with one code; each "Log another" appends
  const [codes, setCodes] = useState<string[]>(() => [generateRFCode()]);

  const addFrag = useCallback(() => {
    setCodes((prev) => [...prev, generateRFCode()]);
  }, []);

  function handleClose() {
    // Reset to a fresh single code on next open
    setCodes([generateRFCode()]);
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
                {codes.length} {codes.length === 1 ? 'frag' : 'frags'}
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
            <Text style={EYEBROW}>rf codes generated</Text>
            <Text size="xs" c="dimmed">{codes.length} frag{codes.length !== 1 ? 's' : ''} logged</Text>
          </Group>

          <ScrollArea.Autosize mah={280} offsetScrollbars>
            <Stack gap={6}>
              {codes.map((code, i) => (
                <Paper
                  key={code}
                  p="sm"
                  style={{
                    background: 'var(--mantine-color-ocean-0)',
                    border: '1px solid var(--mantine-color-ocean-2)',
                  }}
                >
                  <Group gap={10} wrap="nowrap" align="center">
                    <Text
                      style={{
                        fontFamily: 'var(--font-ibm-plex-mono), monospace',
                        fontSize: 10,
                        color: 'var(--mantine-color-dimmed)',
                        width: 20,
                        flexShrink: 0,
                        textAlign: 'right',
                      }}
                    >
                      {i + 1}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'var(--font-ibm-plex-mono), monospace',
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: 'var(--mantine-color-ocean-9)',
                        flex: 1,
                      }}
                    >
                      {code}
                    </Text>
                    <CopyButton value={code} timeout={2000}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          variant="light"
                          color={copied ? 'teal' : 'ocean'}
                          size="md"
                          radius="md"
                          onClick={copy}
                          aria-label={`Copy ${code}`}
                        >
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>

        {/* Add another */}
        <Button
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={addFrag}
          fullWidth
        >
          Log another frag
        </Button>

        <Divider />

        {/* What happens next */}
        <Paper p="sm" withBorder>
          <Text style={{ ...EYEBROW, marginBottom: 6 }}>what happens next</Text>
          <Stack gap={4}>
            {[
              'Give each friend their frag plug + its RF code',
              'They enter it in the Claim widget on their dashboard',
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

        <Button onClick={handleClose}>
          Done
        </Button>
      </Stack>
    </Modal>
  );
}
