'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Text,
  TextInput,
  Button,
  Select,
  Paper,
  Stack,
  Group,
  Divider,
  Badge,
  ThemeIcon,
} from '@mantine/core';
import {
  IconQrcode,
  IconAlertCircle,
  IconLeaf,
  IconShield,
  IconArrowRight,
} from '@tabler/icons-react';
import { CoralThumb } from '@/components/coral/CoralThumb';
import { CategoryBadge } from '@/components/coral/CategoryBadge';
import type { CoralCategory } from '@/theme/theme';
import styles from '@/components/coral/coral.module.css';

// ── Stub frag registry ───────────────────────────────────────
interface LineageStep {
  rfCode: string;
  owner: string;
  ownerHue: number;
  generation: number;
  isYou?: boolean;       // the fragger (previous owner handing off)
  isClaiming?: boolean;  // the frag being claimed
}

interface FragRecord {
  rfCode: string;
  name: string;
  species: string;
  category: CoralCategory;
  fraggedBy: string;
  fraggedByHue: number;
  generation: number;
  alreadyClaimed: boolean;
  lineage: LineageStep[];
}

const FRAG_REGISTRY: Record<string, FragRecord> = {
  'RF-9D4T': {
    rfCode: 'RF-9D4T',
    name: 'Oregon Tort',
    species: 'Acropora tortuosa',
    category: 'SPS',
    fraggedBy: 'Maya Okafor',
    fraggedByHue: 160,
    generation: 3,
    alreadyClaimed: false,
    lineage: [
      { rfCode: 'RF-001A', owner: 'Reef Raft MN',  ownerHue: 210, generation: 0 },
      { rfCode: 'RF-2K8D', owner: 'Tidal Gardens',  ownerHue: 160, generation: 1 },
      { rfCode: 'RF-4F2K', owner: 'Maya Okafor',    ownerHue: 160, generation: 2, isYou: true },
      { rfCode: 'RF-9D4T', owner: 'You',            ownerHue: 0,   generation: 3, isClaiming: true },
    ],
  },
  'RF-8B2X': {
    rfCode: 'RF-8B2X',
    name: 'Oregon Tort',
    species: 'Acropora tortuosa',
    category: 'SPS',
    fraggedBy: 'Maya Okafor',
    fraggedByHue: 160,
    generation: 3,
    alreadyClaimed: true,
    lineage: [
      { rfCode: 'RF-001A', owner: 'Reef Raft MN',  ownerHue: 210, generation: 0 },
      { rfCode: 'RF-2K8D', owner: 'Tidal Gardens',  ownerHue: 160, generation: 1 },
      { rfCode: 'RF-4F2K', owner: 'Maya Okafor',    ownerHue: 160, generation: 2 },
      { rfCode: 'RF-8B2X', owner: 'Nick Tran',      ownerHue: 270, generation: 3 },
    ],
  },
  'RF-CC98': {
    rfCode: 'RF-CC98',
    name: 'Walt Disney Acro',
    species: 'Acropora microclados',
    category: 'SPS',
    fraggedBy: 'Reef Raft MN',
    fraggedByHue: 210,
    generation: 2,
    alreadyClaimed: false,
    lineage: [
      { rfCode: 'RF-BB21', owner: 'Reef Raft MN',  ownerHue: 210, generation: 0 },
      { rfCode: 'RF-CC98', owner: 'You',            ownerHue: 0,   generation: 1, isClaiming: true },
    ],
  },
};

const TANKS = [
  { value: '1', label: 'The 90 (Reef · 90 gal)' },
  { value: '2', label: 'Nano Brain Pico (Nano · 16 gal)' },
];

// ── Helpers ──────────────────────────────────────────────────
const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

// ── Lineage chain display ────────────────────────────────────
function LineageChain({ steps }: { steps: LineageStep[] }) {
  return (
    <Stack gap={0}>
      {steps.map((step, i) => {
        const isClaiming = step.isClaiming;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.rfCode}>
            <Group
              gap={10}
              py={10}
              wrap="nowrap"
              style={
                isClaiming
                  ? {
                      background: 'var(--mantine-color-ocean-0)',
                      border: '1px solid var(--mantine-color-ocean-3)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginTop: 4,
                    }
                  : undefined
              }
            >
              {/* Thumb or "you" placeholder */}
              {isClaiming ? (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: '2px dashed var(--mantine-color-ocean-4)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 10, color: 'var(--mantine-color-ocean-6)', fontWeight: 700 }}>YOU</Text>
                </div>
              ) : (
                <CoralThumb rfCode={step.rfCode} size={36} />
              )}

              <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" fw={600} truncate style={{ flex: 1 }}>
                    {isClaiming ? 'Your tank' : step.owner}
                  </Text>
                  <Text
                    size="xs"
                    style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', color: 'var(--mantine-color-dimmed)', flexShrink: 0 }}
                  >
                    {step.rfCode}
                  </Text>
                </Group>
                <Text style={EYEBROW}>
                  Gen {step.generation}
                  {step.isYou ? ' · fragger' : ''}
                  {isClaiming ? ' · will be yours' : ''}
                </Text>
              </Stack>

              {isClaiming && (
                <Badge variant="light" color="ocean" size="xs" radius="xl" style={{ flexShrink: 0 }}>
                  Claiming
                </Badge>
              )}
            </Group>

            {/* Arrow between steps */}
            {!isLast && (
              <Group justify="center" py={2}>
                <IconArrowRight size={14} color="var(--mantine-color-gray-4)" style={{ transform: 'rotate(90deg)' }} />
              </Group>
            )}
          </div>
        );
      })}
    </Stack>
  );
}

// ── Main claim content ───────────────────────────────────────
function ClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [code, setCode]         = useState(searchParams.get('code') ?? '');
  const [searched, setSearched] = useState(!!searchParams.get('code'));
  const [tank, setTank]         = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const normalized = code.toUpperCase().trim();
  const frag: FragRecord | null | undefined = searched
    ? (FRAG_REGISTRY[normalized] ?? null)
    : undefined;

  function handleLookup() {
    if (!normalized) return;
    setSearched(true);
  }

  async function handleClaim() {
    if (!frag || frag.alreadyClaimed || !tank) return;
    setClaiming(true);
    await new Promise((r) => setTimeout(r, 900));
    router.push(`/collection/${normalized}`);
  }

  return (
    <div className={styles.claimPage}>
      <div className={styles.claimInner}>

        {/* Icon + heading */}
        <div>
          <div className={styles.claimIconTile}>
            <IconQrcode size={22} stroke={1.5} />
          </div>
          <Text
            component="h1"
            style={{ fontSize: 22, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: '10px 0 0' }}
          >
            Claim a frag
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            Enter the RF code from your frag tag to inherit its full lineage.
          </Text>
        </div>

        <Divider />

        {/* Code input */}
        <Stack gap={8}>
          <Text size="sm" fw={600}>RF code</Text>
          <Group gap={8} wrap="nowrap">
            <TextInput
              className={styles.codeInput}
              placeholder="RF-XXXX"
              value={code}
              onChange={(e) => { setCode(e.currentTarget.value); setSearched(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              maxLength={7}
              style={{ flex: 1 }}
            />
            <Button onClick={handleLookup} disabled={!normalized}>
              Look up
            </Button>
          </Group>
        </Stack>

        {/* Not found */}
        {searched && frag === null && (
          <Paper p="md" style={{ background: 'var(--mantine-color-red-0)', border: '1px solid var(--mantine-color-red-3)' }}>
            <Group gap={10}>
              <IconAlertCircle size={20} color="var(--mantine-color-red-7)" style={{ flexShrink: 0 }} />
              <Stack gap={2}>
                <Text size="sm" fw={600} style={{ color: 'var(--mantine-color-red-8)' }}>Code not found</Text>
                <Text size="xs" c="dimmed">
                  <strong>{normalized}</strong> isn't registered. Check the tag and try again.
                </Text>
              </Stack>
            </Group>
          </Paper>
        )}

        {/* Already claimed */}
        {frag?.alreadyClaimed && (
          <Paper p="md" style={{ background: 'var(--mantine-color-orange-0)', border: '1px solid var(--mantine-color-orange-3)' }}>
            <Group gap={10}>
              <IconAlertCircle size={20} color="var(--mantine-color-orange-7)" style={{ flexShrink: 0 }} />
              <Stack gap={2}>
                <Text size="sm" fw={600} style={{ color: 'var(--mantine-color-orange-8)' }}>Already claimed</Text>
                <Text size="xs" c="dimmed">
                  {normalized} has already been registered to another keeper.
                </Text>
              </Stack>
            </Group>
          </Paper>
        )}

        {/* Found + unclaimed — full lineage display */}
        {frag && !frag.alreadyClaimed && (
          <>
            {/* Coral header */}
            <Paper p="md" style={{ background: 'var(--mantine-color-teal-0)', border: '1px solid var(--mantine-color-teal-3)' }}>
              <Group gap={12} wrap="nowrap">
                <CoralThumb rfCode={frag.rfCode} size={48} radius={8} />
                <Stack gap={4} style={{ flex: 1 }}>
                  <Group gap={6}>
                    <Text size="sm" fw={700}>{frag.name}</Text>
                    <CategoryBadge category={frag.category} />
                  </Group>
                  <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>{frag.species}</Text>
                  <Group gap={4}>
                    <IconLeaf size={11} color="var(--mantine-color-teal-7)" />
                    <Text size="xs" style={{ color: 'var(--mantine-color-teal-7)' }}>
                      Fragged by {frag.fraggedBy} · Gen {frag.generation} lineage
                    </Text>
                  </Group>
                </Stack>
              </Group>
            </Paper>

            {/* Full lineage chain */}
            <Paper withBorder p="md">
              <Group gap={6} mb={12}>
                <ThemeIcon size={18} radius="xl" color="ocean" variant="light">
                  <IconShield size={11} />
                </ThemeIcon>
                <Text style={EYEBROW}>verified lineage you'll inherit</Text>
              </Group>
              <LineageChain steps={frag.lineage} />
              <Divider my="sm" />
              <Text size="xs" c="dimmed" ta="center">
                This chain is permanent — it cannot be modified after claiming.
              </Text>
            </Paper>

            {/* Tank select */}
            <Stack gap={8}>
              <Text size="sm" fw={600}>Add to tank</Text>
              <Select
                placeholder="Select a tank…"
                data={TANKS}
                value={tank}
                onChange={setTank}
              />
            </Stack>
          </>
        )}

        {/* CTA */}
        <Box>
          <Button
            fullWidth
            size="md"
            style={{ height: 44 }}
            disabled={!frag || frag.alreadyClaimed || !tank}
            loading={claiming}
            onClick={handleClaim}
          >
            Claim this frag
          </Button>
          {(!frag || frag.alreadyClaimed) && (
            <Text size="xs" c="dimmed" ta="center" mt={8}>
              {frag?.alreadyClaimed ? 'This code has already been claimed' : 'Enter a valid RF code to continue'}
            </Text>
          )}
        </Box>

      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense>
      <ClaimContent />
    </Suspense>
  );
}
