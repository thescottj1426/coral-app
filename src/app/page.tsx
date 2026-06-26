import Link from 'next/link';
import { Box, Group, Stack, Text, Button, SimpleGrid } from '@mantine/core';
import { IconLayoutGrid, IconLeaf, IconShare } from '@tabler/icons-react';

export default function LandingPage() {
  return (
    <Box style={{ minHeight: '100vh', background: 'var(--mantine-color-body)' }}>
      {/* Top bar */}
      <Box style={{ borderBottom: '1px solid var(--mantine-color-default-border)', padding: '14px 24px' }}>
        <Group justify="space-between" align="center">
          <Group gap={8} align="center">
            <Box
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.42 0.22 260))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconLayoutGrid size={13} stroke={2.2} color="#fff" />
            </Box>
            <Text style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16 }}>polyp</Text>
          </Group>
          <Group gap="xs">
            <Link href="/sign-in" style={{ textDecoration: 'none' }}>
              <Button component="a" variant="default" size="xs">Sign in</Button>
            </Link>
            <Link href="/sign-up" style={{ textDecoration: 'none' }}>
              <Button component="a" size="xs">Join free</Button>
            </Link>
          </Group>
        </Group>
      </Box>

      {/* Hero */}
      <Box
        style={{
          background: 'linear-gradient(160deg, oklch(0.26 0.05 220) 0%, oklch(0.18 0.04 250) 100%)',
          padding: '96px 24px 80px',
          textAlign: 'center',
        }}
      >
        <Stack gap="lg" align="center" maw={560} mx="auto">
          <Text
            component="h1"
            style={{
              fontFamily: 'var(--font-sora)',
              fontWeight: 800,
              fontSize: 'clamp(32px, 6vw, 52px)',
              color: '#fff',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Every coral has a story.
            <br />
            <span style={{ color: 'oklch(0.78 0.14 200)' }}>Trace it.</span>
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 17,
              lineHeight: 1.6,
              maxWidth: 420,
            }}
          >
            Log your reef specimens, record their lineage, and share your collection with the hobby.
          </Text>
          <Group gap="sm" mt={8}>
            <Link href="/sign-up" style={{ textDecoration: 'none' }}>
              <Button component="a" size="md" variant="white" color="dark" radius="md">
                Start your collection →
              </Button>
            </Link>
            <Link href="/explore" style={{ textDecoration: 'none' }}>
              <Button
                component="a"
                size="md"
                variant="outline"
                radius="md"
                style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Browse specimens
              </Button>
            </Link>
          </Group>
        </Stack>
      </Box>

      {/* Feature bullets */}
      <Box maw={800} mx="auto" px="xl" py={72}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          <Stack gap={10} align="center" style={{ textAlign: 'center' }}>
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'oklch(0.95 0.05 200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconLayoutGrid size={20} color="oklch(0.45 0.18 220)" />
            </Box>
            <Text fw={700} style={{ fontFamily: 'var(--font-sora)' }}>Log</Text>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
              Add every specimen with photos, species, origin, and RF code.
            </Text>
          </Stack>
          <Stack gap={10} align="center" style={{ textAlign: 'center' }}>
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'oklch(0.95 0.05 160)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconLeaf size={20} color="oklch(0.45 0.18 160)" />
            </Box>
            <Text fw={700} style={{ fontFamily: 'var(--font-sora)' }}>Trace</Text>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
              Link frags to parents and build a lineage chain across the hobby.
            </Text>
          </Stack>
          <Stack gap={10} align="center" style={{ textAlign: 'center' }}>
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'oklch(0.95 0.05 280)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconShare size={20} color="oklch(0.45 0.18 280)" />
            </Box>
            <Text fw={700} style={{ fontFamily: 'var(--font-sora)' }}>Share</Text>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
              Every specimen gets a public page. Share the link — no account needed to view.
            </Text>
          </Stack>
        </SimpleGrid>
      </Box>

      {/* Footer */}
      <Box
        style={{
          borderTop: '1px solid var(--mantine-color-default-border)',
          padding: '20px 24px',
          textAlign: 'center',
        }}
      >
        <Text size="xs" c="dimmed">© {new Date().getFullYear()} Polyp · Free for hobbyists</Text>
      </Box>
    </Box>
  );
}
