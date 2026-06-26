import { notFound } from 'next/navigation';
import { Box, Group, Text, Stack, Paper, Anchor, Breadcrumbs, Badge } from '@mantine/core';
import Link from 'next/link';
import { getSpecimen } from '@/app/actions/specimens';
import { getLineage, getChildren } from '@/app/actions/lineage';
import { ClaimParentForm } from './ClaimParentForm';
import { coralIdentityGradient } from '@/theme/theme';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PedigreePage({ params }: Props) {
  const { id } = await params;
  const [specimen, ancestors, children] = await Promise.all([
    getSpecimen(id),
    getLineage(id),
    getChildren(id),
  ]);

  if (!specimen) notFound();

  return (
    <Box p="lg" maw={900}>
      <Breadcrumbs mb="md" style={{ fontSize: 13 }}>
        <Anchor component={Link} href="/collection">Collection</Anchor>
        <Anchor component={Link} href={`/collection/${specimen.rfCode ?? specimen.id}`}>
          {specimen.name}
        </Anchor>
        <Text size="sm" c="dimmed">Pedigree</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" mb="lg">
        <div>
          <Text
            component="h1"
            style={{ fontSize: 22, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            Pedigree
          </Text>
          <Text size="sm" c="dimmed" mt={2}>
            {specimen.name} · {specimen.rfCode ?? specimen.id}
          </Text>
        </div>
        <Group gap="xl">
          <Stack gap={0} align="center">
            <Text style={{ fontFamily: 'var(--font-sora)', fontSize: 20, fontWeight: 700 }}>
              {ancestors.length}
            </Text>
            <Text style={EYEBROW}>ancestors</Text>
          </Stack>
          <Stack gap={0} align="center">
            <Text style={{ fontFamily: 'var(--font-sora)', fontSize: 20, fontWeight: 700 }}>
              {children.length}
            </Text>
            <Text style={EYEBROW}>frags given</Text>
          </Stack>
        </Group>
      </Group>

      {/* Lineage chain */}
      <Paper withBorder p="lg" mb="md">
        <Text style={{ ...EYEBROW, display: 'block', marginBottom: 16 }}>lineage chain</Text>

        {ancestors.length === 0 && (
          <Text size="sm" c="dimmed">No known ancestors. Link a parent RF code below to start building the chain.</Text>
        )}

        <Stack gap={0}>
          {ancestors.map((node, i) => (
            <div key={node.id}>
              <Group gap={12} align="center">
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: coralIdentityGradient(node.rfCode ?? node.id),
                    flexShrink: 0,
                  }}
                />
                <Stack gap={2} style={{ flex: 1 }}>
                  <Anchor
                    component={Link}
                    href={`/collection/${node.rfCode ?? node.id}`}
                    size="sm"
                    fw={600}
                  >
                    {node.name}
                  </Anchor>
                  <Group gap={6}>
                    {node.rfCode && (
                      <Text style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', fontSize: 11 }} c="dimmed">
                        {node.rfCode}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">@{node.ownerUsername}</Text>
                  </Group>
                </Stack>
                <Badge size="xs" variant="light" color="ocean">
                  Gen {ancestors.length - i}
                </Badge>
              </Group>
              <Box style={{ width: 2, height: 20, background: 'var(--mantine-color-default-border)', marginLeft: 17, marginTop: 4, marginBottom: 4 }} />
            </div>
          ))}

          {/* Current specimen */}
          <Group gap={12} align="center">
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: coralIdentityGradient(specimen.rfCode ?? specimen.id),
                flexShrink: 0,
                outline: '2px solid var(--mantine-color-ocean-5)',
                outlineOffset: 2,
              }}
            />
            <Stack gap={2} style={{ flex: 1 }}>
              <Text size="sm" fw={700}>{specimen.name}</Text>
              <Group gap={6}>
                {specimen.rfCode && (
                  <Text style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', fontSize: 11 }} c="dimmed">
                    {specimen.rfCode}
                  </Text>
                )}
                <Text size="xs" c="dimmed">@{specimen.ownerUsername} · you</Text>
              </Group>
            </Stack>
            <Badge size="xs" variant="filled" color="ocean">Current</Badge>
          </Group>

          {/* Children */}
          {children.length > 0 && (
            <>
              <Box style={{ width: 2, height: 20, background: 'var(--mantine-color-default-border)', marginLeft: 17, marginTop: 4, marginBottom: 4 }} />
              {children.map((child) => (
                <div key={child.id}>
                  <Group gap={12} align="center">
                    <Box
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: coralIdentityGradient(child.rfCode ?? child.id),
                        flexShrink: 0,
                      }}
                    />
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Anchor
                        component={Link}
                        href={`/collection/${child.rfCode ?? child.id}`}
                        size="sm"
                        fw={600}
                      >
                        {child.name}
                      </Anchor>
                      <Group gap={6}>
                        {child.rfCode && (
                          <Text style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', fontSize: 11 }} c="dimmed">
                            {child.rfCode}
                          </Text>
                        )}
                        <Text size="xs" c="dimmed">@{child.ownerUsername}</Text>
                      </Group>
                    </Stack>
                    <Badge size="xs" variant="light" color="teal">Frag</Badge>
                  </Group>
                </div>
              ))}
            </>
          )}
        </Stack>
      </Paper>

      {/* Claim parent form */}
      <ClaimParentForm specimenId={specimen.id} />
    </Box>
  );
}
