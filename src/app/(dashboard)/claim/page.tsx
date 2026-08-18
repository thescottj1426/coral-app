'use client';

import { useState, Suspense, useTransition, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import {
  Box,
  Text,
  TextInput,
  Button,
  Paper,
  Stack,
  Group,
  Divider,
  Badge,
  ThemeIcon,
  Alert,
} from '@mantine/core';
import {
  IconQrcode,
  IconAlertCircle,
  IconLeaf,
  IconShield,
  IconArrowRight,
  IconCheck,
} from '@tabler/icons-react';
import { CoralThumb } from '@/components/coral/CoralThumb';
import { lookupParentCoral, claimFrag, type ParentCoralInfo, type LineageNode } from '@/app/actions/lineage';
import styles from '@/components/coral/coral.module.css';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

type ChainStep =
  | { kind: 'ancestor'; node: LineageNode }
  | { kind: 'parent'; coral: ParentCoralInfo }
  | { kind: 'you' };

function LineageChain({ parent }: { parent: ParentCoralInfo }) {
  // unclaimed_frag: lineage already includes fragger — just append "You"
  // parent_coral: append the parent itself then "You"
  const steps: ChainStep[] =
    parent.fragKind === 'unclaimed_frag'
      ? [
          ...parent.ancestors.map((a) => ({ kind: 'ancestor' as const, node: a })),
          { kind: 'you' },
        ]
      : [
          ...parent.ancestors.map((a) => ({ kind: 'ancestor' as const, node: a })),
          { kind: 'parent', coral: parent },
          { kind: 'you' },
        ];

  return (
    <Stack gap={0}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isClaiming = step.kind === 'you';

        const rfCode =
          step.kind === 'ancestor' ? step.node.rfCode :
          step.kind === 'parent' ? step.coral.rfCode :
          null;
        const label =
          step.kind === 'ancestor' ? `@${step.node.ownerUsername}` :
          step.kind === 'parent' ? `@${step.coral.ownerUsername}` :
          'You';
        const hue =
          step.kind === 'ancestor' ? step.node.identityHue :
          step.kind === 'parent' ? step.coral.identityHue :
          null;
        const depth =
          step.kind === 'ancestor' ? step.node.depth :
          step.kind === 'parent' ? 0 :
          steps.length - 1;
        const sub =
          step.kind === 'parent' ? 'fragger' :
          step.kind === 'you' ? 'will be yours' :
          undefined;

        return (
          <div key={i}>
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
              {isClaiming ? (
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    border: '2px dashed var(--mantine-color-ocean-4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 10, color: 'var(--mantine-color-ocean-6)', fontWeight: 700 }}>YOU</Text>
                </div>
              ) : (
                <CoralThumb rfCode={rfCode ?? label} size={36} />
              )}

              <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" fw={600} truncate style={{ flex: 1 }}>{label}</Text>
                  {rfCode && (
                    <Text size="xs" style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', color: 'var(--mantine-color-dimmed)', flexShrink: 0 }}>
                      {rfCode}
                    </Text>
                  )}
                </Group>
                <Text style={EYEBROW}>
                  Gen {depth}{sub ? ` · ${sub}` : ''}
                </Text>
              </Stack>

              {isClaiming && (
                <Badge variant="light" color="ocean" size="xs" radius="xl" style={{ flexShrink: 0 }}>Claiming</Badge>
              )}
            </Group>

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

function ClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [parent, setParent] = useState<ParentCoralInfo | null | undefined>(
    searchParams.get('code') ? undefined : undefined
  );
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isLooking, startLookup] = useTransition();
  const [isClaiming, startClaim] = useTransition();

  const normalized = code.toUpperCase().trim();

  useEffect(() => {
    if (searchParams.get('code')) handleLookup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLookup() {
    if (!normalized) return;
    setLookupError(null);
    setParent(undefined);
    startLookup(async () => {
      const result = await lookupParentCoral(normalized);
      if (!result) {
        setLookupError(`No coral found with RF code ${normalized}`);
        setParent(null);
      } else {
        setParent(result);
      }
    });
  }

  function handleClaim() {
    if (!parent) return;
    setClaimError(null);
    startClaim(async () => {
      const result = await claimFrag(parent.rfCode);
      if ('error' in result) {
        setClaimError(result.error);
      } else {
        track('frag_claimed');
        router.push(`/collection/${result.coralRfCode}`);
      }
    });
  }

  return (
    <div className={styles.claimPage}>
      <div className={styles.claimInner}>

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
            Enter the RF code on your frag tag to inherit its full lineage.
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
              onChange={(e) => { setCode(e.currentTarget.value); setParent(undefined); setLookupError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              maxLength={7}
              style={{ flex: 1 }}
            />
            <Button onClick={handleLookup} disabled={!normalized} loading={isLooking}>
              Look up
            </Button>
          </Group>
        </Stack>

        {/* Not found */}
        {lookupError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {lookupError}
          </Alert>
        )}

        {/* Found */}
        {parent && (
          <>
            <Paper p="md" style={{ background: 'var(--mantine-color-teal-0)', border: '1px solid var(--mantine-color-teal-3)' }}>
              <Group gap={12} wrap="nowrap">
                <CoralThumb rfCode={parent.rfCode} size={48} radius={8} />
                <Stack gap={4} style={{ flex: 1 }}>
                  <Text size="sm" fw={700}>{parent.name}</Text>
                  {parent.species && (
                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>{parent.species}</Text>
                  )}
                  <Group gap={4}>
                    <IconLeaf size={11} color="var(--mantine-color-teal-7)" />
                    <Text size="xs" style={{ color: 'var(--mantine-color-teal-7)' }}>
                      {parent.fragKind === 'unclaimed_frag'
                        ? `Pre-registered frag · Gen ${parent.ancestors.length + 1}`
                        : `Fragged by @${parent.ownerUsername}${parent.ancestors.length > 0 ? ` · Gen ${parent.ancestors.length + 1} lineage` : ''}`
                      }
                    </Text>
                  </Group>
                </Stack>
              </Group>
            </Paper>

            <Paper withBorder p="md">
              <Group gap={6} mb={12}>
                <ThemeIcon size={18} radius="xl" color="ocean" variant="light">
                  <IconShield size={11} />
                </ThemeIcon>
                <Text style={EYEBROW}>lineage you'll inherit</Text>
              </Group>
              <LineageChain parent={parent} />
              <Divider my="sm" />
              <Text size="xs" c="dimmed" ta="center">
                This chain is permanent and cannot be modified after claiming.
              </Text>
            </Paper>

            {claimError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {claimError}
              </Alert>
            )}
          </>
        )}

        {/* CTA */}
        <Box>
          <Button
            fullWidth
            size="md"
            style={{ height: 44 }}
            disabled={!parent}
            loading={isClaiming}
            leftSection={parent ? <IconCheck size={16} /> : undefined}
            onClick={handleClaim}
          >
            Claim this frag
          </Button>
          {!parent && (
            <Text size="xs" c="dimmed" ta="center" mt={8}>
              Enter a valid RF code to continue
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
