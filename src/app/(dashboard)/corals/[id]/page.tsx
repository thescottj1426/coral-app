'use client';

import {
  Box,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Paper,
  Divider,
  Anchor,
  Avatar,
  ThemeIcon,
  SimpleGrid,
  NumberInput,
} from '@mantine/core';
import {
  IconShare,
  IconLeaf,
  IconEdit,
  IconSun,
  IconWind,
  IconThermometer,
  IconStack2,
  IconStarFilled,
  IconStar,
  IconChevronRight,
  IconShoppingCart,
  IconShield,
  IconScissors,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { CategoryBadge } from '@/components/coral/CategoryBadge';
import { LineageList, type LineageNode } from '@/components/coral/LineageList';
import { CoralThumb } from '@/components/coral/CoralThumb';
import { CommentSection } from '@/components/coral/CommentSection';
import { FragModal } from '@/components/coral/FragModal';
import { coralIdentityGradient } from '@/theme/theme';

// ── Stub data ───────────────────────────────────────────────
const RF_CODE = 'RF-4F2K';

const CORAL = {
  rfCode: RF_CODE,
  name: 'Oregon Tort',
  species: 'Acropora tortuosa',
  category: 'SPS' as const,
  origin: 'Aquacultured',
  addedDate: 'Jan 12, 2025',
  tank: 'The 90',
  notes:
    'Running at 350–380 PAR mid-column. Growth rate ~1 cm/month. First branching after 6 weeks in the tank. No visible pests at intake — dipped with CoralRx on arrival.',
};

const SPECS = [
  { label: 'Lighting',    value: '300–400 PAR',    icon: IconSun,         ok: true  },
  { label: 'Flow',        value: 'High',            icon: IconWind,        ok: true  },
  { label: 'Placement',   value: 'Mid / Upper',     icon: IconStack2,      ok: true  },
  { label: 'Temperature', value: '77–79 °F',        icon: IconThermometer, ok: true  },
  { label: 'Difficulty',  value: 'Intermediate',    icon: IconStarFilled,  ok: true  },
];

const LINEAGE: LineageNode[] = [
  { rfCode: 'RF-001A', name: 'Oregon Tort', owner: 'Reef Raft MN',  generation: 0 },
  { rfCode: 'RF-2K8D', name: 'Oregon Tort', owner: 'Tidal Gardens', generation: 1 },
  { rfCode: 'RF-4F2K', name: 'Oregon Tort', owner: 'Maya Okafor',   generation: 2, isYou: true },
];

const FRAGS = [
  { rfCode: 'RF-8B2X', claimedBy: 'Nick Tran',  ownerHue: 270, date: 'May 2026', claimed: true,  forSale: false, price: null },
  { rfCode: 'RF-9D4T', claimedBy: null,          ownerHue: 0,   date: null,       claimed: false, forSale: true,  price: 65  },
];

const LISTING = {
  price: 65,
  currency: 'USD',
  available: 1,
  seller: 'Maya Okafor',
  sellerHue: 160,
  verified: true,
  ships: 'USPS Priority · DOA guaranteed',
  size: '1–2" frag on a plug',
};

// ── Style constants ─────────────────────────────────────────
const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

function avatarBg(hue: number) {
  return `oklch(0.62 0.1 ${hue})`;
}

// ── Section components ──────────────────────────────────────
function SpecsCard() {
  return (
    <Paper withBorder p="md">
      <Text style={{ ...EYEBROW, display: 'block', marginBottom: 12 }}>care specs</Text>
      <SimpleGrid cols={3} spacing="xs">
        {SPECS.map((s) => {
          const Icon = s.icon;
          return (
            <Stack key={s.label} gap={4} align="center" style={{ textAlign: 'center' }}>
              <ThemeIcon size={32} variant="light" color="ocean" radius="md">
                <Icon size={15} />
              </ThemeIcon>
              <Text size="sm" fw={600} style={{ lineHeight: 1.2 }}>{s.value}</Text>
              <Text style={EYEBROW}>{s.label}</Text>
            </Stack>
          );
        })}
      </SimpleGrid>
    </Paper>
  );
}

function LineageCard() {
  return (
    <Paper withBorder p="md">
      <Group justify="space-between" align="center" mb={12}>
        <Group gap={6}>
          <IconLeaf size={13} color="var(--mantine-color-teal-6)" />
          <Text style={EYEBROW}>lineage · gen {Math.max(...LINEAGE.map(n => n.generation))}</Text>
        </Group>
        <Anchor component={Link} href={`/corals/${RF_CODE}/pedigree`} size="xs" fw={600}>
          Full tree →
        </Anchor>
      </Group>
      <LineageList nodes={LINEAGE} />
      <Divider my="sm" />
      <Group gap="xl" justify="center">
        <Stack gap={0} align="center">
          <Text size="sm" fw={700}>{LINEAGE.length}</Text>
          <Text style={EYEBROW}>generations</Text>
        </Stack>
        <Stack gap={0} align="center">
          <Text size="sm" fw={700}>{FRAGS.length}</Text>
          <Text style={EYEBROW}>frags cut</Text>
        </Stack>
        <Stack gap={0} align="center">
          <Text size="sm" fw={700}>{FRAGS.filter(f => f.claimed).length}</Text>
          <Text style={EYEBROW}>claimed</Text>
        </Stack>
      </Group>
    </Paper>
  );
}

function FragsCard() {
  return (
    <Paper withBorder p="md">
      <Group justify="space-between" align="center" mb={10}>
        <Text style={EYEBROW}>frags produced · {FRAGS.length}</Text>
        <Button variant="subtle" size="xs" leftSection={<IconEdit size={12} />}>
          Log frag
        </Button>
      </Group>
      <Stack gap={0}>
        {FRAGS.map((f, i) => (
          <Group
            key={f.rfCode}
            gap={10}
            py={12}
            wrap="nowrap"
            style={i > 0 ? { borderTop: '1px solid var(--mantine-color-default-border)' } : undefined}
          >
            {f.claimed ? (
              <CoralThumb rfCode={f.rfCode} size={36} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: 6,
                border: '1.5px dashed var(--mantine-color-gray-4)',
                flexShrink: 0,
              }} />
            )}
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Group gap={6} wrap="nowrap">
                <Text
                  size="sm"
                  fw={600}
                  style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}
                >
                  {f.rfCode}
                </Text>
                {f.forSale && f.price && (
                  <Badge variant="light" color="ocean" size="xs" radius="xl">
                    ${f.price} · For sale
                  </Badge>
                )}
              </Group>
              <Text size="xs" c="dimmed">
                {f.claimed
                  ? `Claimed by ${f.claimedBy} · ${f.date}`
                  : 'Unclaimed — available'}
              </Text>
            </Stack>
            {f.claimed ? (
              <Group gap={6} wrap="nowrap">
                <Avatar size={20} radius="xl" style={{ background: avatarBg(f.ownerHue) }}>
                  {f.claimedBy![0]}
                </Avatar>
                <Badge variant="light" color="teal" size="xs" radius="xl">Claimed</Badge>
              </Group>
            ) : (
              <Badge variant="light" color="gray" size="xs" radius="xl">Unclaimed</Badge>
            )}
            <IconChevronRight size={14} color="var(--mantine-color-gray-4)" style={{ flexShrink: 0 }} />
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

function CartCard() {
  const [qty, setQty] = useState<string | number>(1);
  return (
    <Paper
      withBorder
      p="md"
      style={{
        borderColor: 'var(--mantine-color-ocean-3)',
        background: 'var(--mantine-color-ocean-0)',
      }}
    >
      {/* Price */}
      <Group justify="space-between" align="flex-start" mb={4}>
        <Text style={{ fontSize: 28, fontFamily: 'var(--font-sora)', fontWeight: 700, lineHeight: 1 }}>
          ${LISTING.price}
          <Text span size="xs" c="dimmed" fw={400}> USD</Text>
        </Text>
        <Badge color="teal" variant="light" size="sm" radius="xl">
          {LISTING.available} available
        </Badge>
      </Group>
      <Text size="xs" c="dimmed" mb="md">{LISTING.size}</Text>

      {/* Seller */}
      <Group gap={8} mb="md">
        <Avatar size={28} radius="xl" style={{ background: avatarBg(LISTING.sellerHue) }}>
          {LISTING.seller[0]}
        </Avatar>
        <Stack gap={0}>
          <Group gap={4}>
            <Text size="xs" fw={600}>{LISTING.seller}</Text>
            {LISTING.verified && (
              <ThemeIcon size={14} radius="xl" color="ocean" variant="filled">
                <IconShield size={9} />
              </ThemeIcon>
            )}
          </Group>
          <Text size="xs" c="dimmed">Verified seller</Text>
        </Stack>
      </Group>

      <Divider mb="md" />

      {/* Qty + CTA */}
      <Stack gap={8}>
        <Group gap={8} wrap="nowrap">
          <NumberInput
            label="Qty"
            value={qty}
            onChange={setQty}
            min={1}
            max={LISTING.available}
            style={{ width: 80 }}
            size="sm"
          />
          <Button
            fullWidth
            leftSection={<IconShoppingCart size={15} />}
            style={{ alignSelf: 'flex-end' }}
          >
            Reserve frag
          </Button>
        </Group>
        <Group gap={6} mt={2}>
          <IconShield size={12} color="var(--mantine-color-teal-6)" />
          <Text size="xs" c="dimmed">{LISTING.ships}</Text>
        </Group>
      </Stack>
    </Paper>
  );
}

function KeeperNotesCard() {
  return (
    <Paper withBorder p="md">
      <Text style={{ ...EYEBROW, display: 'block', marginBottom: 8 }}>keeper notes</Text>
      <Text size="sm" style={{ lineHeight: 1.65, color: 'var(--mantine-color-text)' }}>
        {CORAL.notes}
      </Text>
    </Paper>
  );
}

// ── Page ────────────────────────────────────────────────────
export default function CoralDetailPage() {
  const hasSale = FRAGS.some(f => f.forSale);
  const [fragOpened, { open: openFrag, close: closeFrag }] = useDisclosure(false);
  const myGeneration = Math.max(...LINEAGE.map(n => n.generation));

  return (
    <Box maw={1100}>
      <FragModal
        opened={fragOpened}
        onClose={closeFrag}
        parentRfCode={RF_CODE}
        parentName={CORAL.name}
        parentGeneration={myGeneration}
      />
      {/* Hero banner */}
      <Box
        style={{
          height: 200,
          background: coralIdentityGradient(RF_CODE),
          position: 'relative',
        }}
      >
        {/* Gradient overlay for text legibility */}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
          }}
        />
        <Group
          style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}
          justify="space-between"
          align="flex-end"
          wrap="nowrap"
        >
          <Stack gap={4}>
            <Group gap={8}>
              <CategoryBadge category={CORAL.category} />
              <Badge variant="filled" size="sm" radius="xl"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', color: '#fff' }}
              >
                {CORAL.origin}
              </Badge>
            </Group>
            <Text
              component="h1"
              style={{ fontSize: 28, fontFamily: 'var(--font-sora)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1 }}
            >
              {CORAL.name}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontStyle: 'italic' }}>
              {CORAL.species}
            </Text>
          </Stack>
          <Group gap="xs">
            <Button size="xs" variant="white" leftSection={<IconEdit size={12} />}>Edit</Button>
            <Button size="xs" variant="white" leftSection={<IconShare size={12} />}>Share</Button>
          </Group>
        </Group>
      </Box>

      {/* Meta strip */}
      <Paper withBorder radius={0} px="xl" py="sm" style={{ borderLeft: 'none', borderRight: 'none' }}>
        <Group gap="xl" wrap="nowrap">
          <Stack gap={0}>
            <Text style={EYEBROW}>RF code</Text>
            <Text size="sm" fw={600} style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              {CORAL.rfCode}
            </Text>
          </Stack>
          <Stack gap={0}>
            <Text style={EYEBROW}>tank</Text>
            <Anchor component={Link} href="/tanks/1" size="sm" fw={600}>{CORAL.tank}</Anchor>
          </Stack>
          <Stack gap={0}>
            <Text style={EYEBROW}>added</Text>
            <Text size="sm" fw={600}>{CORAL.addedDate}</Text>
          </Stack>
          <Stack gap={0}>
            <Text style={EYEBROW}>lineage depth</Text>
            <Group gap={4}>
              <IconLeaf size={12} color="var(--mantine-color-teal-6)" />
              <Text size="sm" fw={600} c="teal.7">Gen {Math.max(...LINEAGE.map(n => n.generation))}</Text>
            </Group>
          </Stack>
          <Group gap="xs" ml="auto">
            <Button
              variant="light"
              color="teal"
              size="xs"
              leftSection={<IconScissors size={12} />}
              onClick={openFrag}
            >
              Frag this coral
            </Button>
            <Button
              component={Link}
              href={`/corals/${RF_CODE}/pedigree`}
              variant="light"
              size="xs"
              leftSection={<IconLeaf size={12} />}
            >
              Pedigree
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Main 2-col layout */}
      <Box p="lg">
        <Group gap="lg" align="flex-start" wrap="nowrap">
          {/* Left — main content */}
          <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
            <SpecsCard />
            <LineageCard />
            <FragsCard />
            <KeeperNotesCard />

            {/* Comments */}
            <Paper withBorder p="md">
              <Text style={{ ...EYEBROW, display: 'block', marginBottom: 12 }}>comments</Text>
              <CommentSection />
            </Paper>
          </Stack>

          {/* Right — sidebar */}
          <Stack gap="md" style={{ width: 280, flexShrink: 0 }}>
            {hasSale && <CartCard />}

            {/* Quick lineage summary for sidebar */}
            <Paper withBorder p="md">
              <Group gap={6} mb={12}>
                <IconShield size={12} color="var(--mantine-color-ocean-6)" />
                <Text style={EYEBROW}>verified lineage</Text>
              </Group>
              <Stack gap={6}>
                {LINEAGE.map((node, i) => (
                  <Group key={node.rfCode} gap={8} wrap="nowrap">
                    <CoralThumb rfCode={node.rfCode} size={24} radius={4} />
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" fw={600} truncate>{node.owner}</Text>
                      <Text style={{ ...EYEBROW, fontSize: 9 }}>
                        Gen {node.generation} · {node.rfCode}
                      </Text>
                    </Stack>
                    {node.isYou && (
                      <Badge size="xs" variant="light" color="ocean" radius="xl">You</Badge>
                    )}
                  </Group>
                ))}
              </Stack>
              <Divider my="sm" />
              <Anchor
                component={Link}
                href={`/corals/${RF_CODE}/pedigree`}
                size="xs"
                fw={600}
                style={{ display: 'block', textAlign: 'center' }}
              >
                Open full pedigree tree →
              </Anchor>
            </Paper>

            {/* Rating / care difficulty */}
            <Paper withBorder p="md">
              <Text style={{ ...EYEBROW, display: 'block', marginBottom: 10 }}>keeper difficulty</Text>
              <Group gap={4} mb={4}>
                {[1,2,3,4,5].map((n) => (
                  n <= 3
                    ? <IconStarFilled key={n} size={16} color="var(--mantine-color-yellow-5)" />
                    : <IconStar key={n} size={16} color="var(--mantine-color-gray-3)" />
                ))}
              </Group>
              <Text size="xs" c="dimmed">Intermediate — suitable for reefers with 6+ months experience keeping SPS.</Text>
            </Paper>
          </Stack>
        </Group>
      </Box>
    </Box>
  );
}
