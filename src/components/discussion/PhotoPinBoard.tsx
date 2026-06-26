'use client';

import { useState } from 'react';
import { Box, Text, Stack, Paper, Group } from '@mantine/core';
import { IconCircleCheck, IconCornerUpLeft, IconHeart, IconMapPin, IconPlus } from '@tabler/icons-react';
import { coralIdentityGradient } from '@/theme/theme';
import styles from './discussion.module.css';

interface Pin {
  n: number;
  x: number;  // percentage
  y: number;
  solved: boolean;
  question: string;
  author: string;
  replies: number;
  snip?: string;
  reply?: { who: string; text: string; tm: string };
}

interface Props {
  photoUrl: string;
  specimenName: string;
  pins?: Pin[];
}

const DEFAULT_PINS: Pin[] = [];

export function PhotoPinBoard({ photoUrl, specimenName, pins = DEFAULT_PINS }: Props) {
  const [activePin, setActivePin] = useState<number | null>(pins[0]?.n ?? null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const active = pins.find(p => p.n === activePin) ?? null;

  function handlePhotoClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGhostPos({ x, y });
  }

  function handlePhotoMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGhostPos({ x, y });
  }

  return (
    <Box style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>

      {/* Photo with pins */}
      <Box>
        <div
          className={styles.pinPhoto}
          style={{ height: 340, cursor: 'crosshair', position: 'relative' }}
          onClick={handlePhotoClick}
          onMouseMove={handlePhotoMouseMove}
          onMouseLeave={() => setGhostPos(null)}
        >
          {/* Photo or placeholder */}
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={specimenName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, var(--mantine-color-gray-2), var(--mantine-color-gray-3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Text size="sm" c="dimmed">{specimenName} · photo</Text>
            </Box>
          )}

          {/* Pins */}
          {pins.map(p => (
            <div
              key={p.n}
              className={[
                styles.pin,
                activePin === p.n ? styles.pinActive : '',
                p.solved ? styles.pinSolved : '',
              ].join(' ')}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={e => { e.stopPropagation(); setActivePin(p.n); }}
            >
              {p.solved ? <IconCircleCheck size={13} stroke={3} /> : p.n}
            </div>
          ))}

          {/* Ghost pin */}
          {ghostPos && (
            <div
              className={`${styles.pin} ${styles.pinGhost}`}
              style={{ left: `${ghostPos.x}%`, top: `${ghostPos.y}%`, pointerEvents: 'none' }}
            >
              <IconPlus size={12} stroke={2.4} />
            </div>
          )}
        </div>
        <Group gap={6} mt={8} style={{ fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
          <IconMapPin size={14} color="var(--mantine-color-dimmed)" />
          <span>Click anywhere on the photo to drop a pin and ask. {pins.length} pins on this image.</span>
        </Group>
      </Box>

      {/* Right panel: pin list + active pin thread */}
      <Stack gap={12}>

        {/* Pin list */}
        {pins.length > 0 && (
          <Paper withBorder p="md">
            <Text style={{
              fontFamily: 'var(--font-ibm-plex-mono), monospace', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--mantine-color-dimmed)', fontWeight: 500, display: 'block', marginBottom: 8,
            }}>
              pins on this photo
            </Text>
            <Stack gap={8}>
              {pins.map(p => (
                <div
                  key={p.n}
                  className={activePin === p.n ? `${styles.pinItem} ${styles.pinItemActive}` : styles.pinItem}
                  onClick={() => setActivePin(p.n)}
                >
                  <span className={p.solved ? `${styles.pinNum} ${styles.pinNumSolved}` : styles.pinNum}>
                    {p.solved ? <IconCircleCheck size={12} stroke={3} /> : p.n}
                  </span>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" fw={500} style={{ fontSize: 12.5, lineHeight: 1.35 }}>{p.question}</Text>
                    <Text size="xs" c="dimmed">
                      {p.author} · {p.replies} {p.replies === 1 ? 'reply' : 'replies'}
                      {p.solved ? ' · resolved' : ''}
                    </Text>
                  </Box>
                </div>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Empty state — prompt to drop a pin */}
        {pins.length === 0 && (
          <Paper withBorder p="md" style={{ textAlign: 'center' }}>
            <IconMapPin size={24} color="var(--mantine-color-gray-4)" style={{ marginBottom: 8 }} />
            <Text size="sm" c="dimmed">No pins yet.</Text>
            <Text size="xs" c="dimmed" mt={4}>
              Click anywhere on the photo to drop a pin and ask a question about that exact spot.
            </Text>
          </Paper>
        )}

        {/* Active pin expanded */}
        {active && (
          <Paper withBorder p="md" style={{ borderColor: 'var(--mantine-primary-color-filled)' }}>
            <Group gap={8} mb={8} align="flex-start">
              <span className={styles.pinNum}>{active.n}</span>
              <Text size="sm" fw={600} style={{ flex: 1, lineHeight: 1.35 }}>{active.question}</Text>
            </Group>

            {active.snip && (
              <Text size="sm" style={{ color: 'var(--mantine-color-gray-7)', lineHeight: 1.55, marginBottom: 10 }}>
                {active.snip}
              </Text>
            )}

            {active.reply && (
              <Box style={{
                borderTop: '1px solid var(--mantine-color-default-border)',
                paddingTop: 10, marginTop: 4,
              }}>
                <Group gap={8} align="flex-start" wrap="nowrap">
                  <Box style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: coralIdentityGradient(active.reply.who + '_av'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                  }}>
                    {active.reply.who[0].toUpperCase()}
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Group gap={4} mb={4}>
                      <Text size="xs" fw={600}>{active.reply.who}</Text>
                      <Text size="xs" c="dimmed">· {active.reply.tm}</Text>
                    </Group>
                    <Text size="xs" style={{ color: 'var(--mantine-color-gray-7)', lineHeight: 1.5 }}>
                      {active.reply.text}
                    </Text>
                  </Box>
                </Group>
              </Box>
            )}

            {/* Inline reply input */}
            <Group gap={8} mt={10}>
              <input
                placeholder={`Reply to pin ${active.n}…`}
                style={{
                  flex: 1, height: 34,
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 6, padding: '0 10px',
                  fontFamily: 'inherit', fontSize: 13,
                  background: 'var(--mantine-color-body)',
                  color: 'var(--mantine-color-text)',
                  outline: 'none',
                }}
              />
              <button style={{
                height: 34, padding: '0 12px',
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 6, background: 'var(--mantine-color-body)',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                Send
              </button>
            </Group>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
