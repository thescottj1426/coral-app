'use client';

import { Box, Group, Text, Stack, Paper, Anchor, Breadcrumbs } from '@mantine/core';
import Link from 'next/link';
import { PedigreeTree, type TreeNode } from '@/components/coral/PedigreeTree';

const RF_CODE = 'RF-4F2K';

// Guide chars per column: ' ' = nothing, '_' = vertical pipe │, 't' = T-branch ├, 'l' = L-branch └
// Tree shape:
//   RF-001A
//   └─ RF-2K8D
//      └─ RF-4F2K (You)
//         ├─ RF-8B2X
//         │  ├─ RF-C3KP
//         │  └─ RF-D7NQ
//         └─ RF-9D4T
const TREE: TreeNode[] = [
  { rfCode: 'RF-001A', name: 'Oregon Tort', owner: 'Reef Raft MN',  claimed: true,  guides: '' },
  { rfCode: 'RF-2K8D', name: 'Oregon Tort', owner: 'Tidal Gardens', claimed: true,  guides: 'l' },
  { rfCode: 'RF-4F2K', name: 'Oregon Tort', owner: 'Maya Okafor',   claimed: true,  isYou: true, guides: ' l' },
  { rfCode: 'RF-8B2X', name: 'Oregon Tort', owner: 'Nick Tran',     claimed: true,  guides: '  t' },
  { rfCode: 'RF-C3KP', name: 'Oregon Tort', owner: 'Sasha Kim',     claimed: true,  guides: '  _t' },
  { rfCode: 'RF-D7NQ', name: 'Oregon Tort', owner: '',              claimed: false, guides: '  _l' },
  { rfCode: 'RF-9D4T', name: 'Oregon Tort', owner: '',              claimed: false, guides: '  l' },
];

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

export default function PedigreePage() {
  const claimed = TREE.filter((n) => n.claimed).length;
  const total = TREE.length;
  const maxDepth = Math.max(...TREE.map((n) => n.guides.length));

  return (
    <Box p="lg" maw={900}>
      {/* Breadcrumb */}
      <Breadcrumbs mb="md" style={{ fontSize: 13 }}>
        <Anchor component={Link} href="/">Home</Anchor>
        <Anchor component={Link} href={`/corals/${RF_CODE}`}>Oregon Tort</Anchor>
        <Text size="sm" c="dimmed">Pedigree</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" mb="lg">
        <div>
          <Text
            component="h1"
            style={{ fontSize: 22, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            Pedigree tree
          </Text>
          <Text size="sm" c="dimmed" mt={2}>
            Oregon Tort · {RF_CODE} · full lineage
          </Text>
        </div>

        {/* Stats */}
        <Group gap="xl">
          <Stack gap={0} align="center">
            <Text style={{ fontFamily: 'var(--font-sora)', fontSize: 20, fontWeight: 700 }}>
              {claimed}
            </Text>
            <Text style={EYEBROW}>claimed</Text>
          </Stack>
          <Stack gap={0} align="center">
            <Text style={{ fontFamily: 'var(--font-sora)', fontSize: 20, fontWeight: 700 }}>
              {total}
            </Text>
            <Text style={EYEBROW}>total frags</Text>
          </Stack>
          <Stack gap={0} align="center">
            <Text style={{ fontFamily: 'var(--font-sora)', fontSize: 20, fontWeight: 700 }}>
              {maxDepth + 1}
            </Text>
            <Text style={EYEBROW}>generations</Text>
          </Stack>
        </Group>
      </Group>

      <Paper withBorder p="lg">
        <Text style={{ ...EYEBROW, display: 'block', marginBottom: 12 }}>
          full tree · {total} nodes
        </Text>
        <PedigreeTree nodes={TREE} />
      </Paper>
    </Box>
  );
}
