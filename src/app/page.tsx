import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Group, Stack, Text, Button, SimpleGrid } from '@mantine/core';
import { IconSeeding, IconArrowsShuffle, IconShare3 } from '@tabler/icons-react';
import { getExploreSpecimens } from '@/app/actions/explore';
import { siteUrl } from '@/lib/siteUrl';

const BASE = siteUrl();

// Rebuilt hourly so newly added corals appear as crawlable links.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Coral Chest — trace the lineage of every coral',
  description:
    'A public registry for reef corals. Log specimens, trace frags back to the mother colony, and give every coral a permanent, shareable page.',
  alternates: { canonical: BASE },
  openGraph: {
    title: 'Coral Chest — trace the lineage of every coral',
    description:
      'Log specimens, trace frags back to the mother colony, and give every coral a permanent, shareable page.',
    url: BASE,
    type: 'website',
  },
};

export default async function LandingPage() {
  // Internal links are how a crawler reaches /coral/* at all. Without them the
  // sitemap lists orphan URLs with no path in from anywhere.
  let recent: Awaited<ReturnType<typeof getExploreSpecimens>> = [];
  try {
    recent = (await getExploreSpecimens()).slice(0, 12);
  } catch {
    // Landing page must render even if the database is unreachable.
  }

  return (
    <Box style={{ minHeight: '100vh', background: 'var(--mantine-color-body)' }}>
      {/* Top bar */}
      <Box style={{ borderBottom: '1px solid var(--mantine-color-default-border)', padding: '14px 24px' }}>
        <Group justify="space-between" align="center">
          <Group gap={8} align="center">
            <Box style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              background: 'linear-gradient(135deg, oklch(0.65 0.20 40), oklch(0.48 0.20 250))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconSeeding size={13} stroke={2.2} color="#fff" />
            </Box>
            <Text style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16 }}>
              Coral Chest
            </Text>
          </Group>
          <Group gap="xs">
            <Button component="a" href="/sign-in" variant="default" size="xs">Sign in</Button>
            <Button component="a" href="/sign-up" size="xs">Join free</Button>
          </Group>
        </Group>
      </Box>

      {/* Hero */}
      <Box style={{
        background: 'linear-gradient(150deg, oklch(0.22 0.08 30) 0%, oklch(0.17 0.06 240) 100%)',
        padding: '100px 24px 88px',
        textAlign: 'center',
      }}>
        <Stack gap="lg" align="center" maw={580} mx="auto">
          <Text
            component="h1"
            style={{
              fontFamily: 'var(--font-sora)',
              fontWeight: 800,
              fontSize: 'clamp(32px, 6vw, 54px)',
              color: '#fff',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Every coral has a story.
            <br />
            <span style={{ color: 'oklch(0.80 0.16 55)' }}>Trace it.</span>
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.60)', fontSize: 17, lineHeight: 1.65, maxWidth: 440 }}>
            The collector's log for reef hobbyists. Log specimens, record their lineage, and share your chest with the hobby.
          </Text>
          <Group gap="sm" mt={8}>
            <Button component="a" href="/sign-up" size="md" variant="white" color="dark" radius="md">
                Start your chest →
              </Button>
            <Button component="a" href="/explore" size="md" variant="outline" radius="md"
                style={{ color: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.25)' }}>
                Browse specimens
              </Button>
          </Group>
        </Stack>
      </Box>

      {/* Features */}
      <Box maw={820} mx="auto" px="xl" py={80}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          {[
            {
              icon: IconSeeding,
              hue: 200,
              title: 'Log',
              body: 'Add every specimen with photos, species, origin, and a unique RF code printed right on the tag.',
            },
            {
              icon: IconArrowsShuffle,
              hue: 160,
              title: 'Trace',
              body: 'Pass frags and watch the lineage build automatically. Every child knows its parent.',
            },
            {
              icon: IconShare3,
              hue: 40,
              title: 'Share',
              body: 'Every specimen gets a public page with full SEO. Share the link — no account needed to view.',
            },
          ].map(({ icon: Icon, hue, title, body }) => (
            <Stack key={title} gap={12} align="center" style={{ textAlign: 'center' }}>
              <Box style={{
                width: 48, height: 48, borderRadius: 14,
                background: `oklch(0.95 0.04 ${hue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color={`oklch(0.45 0.18 ${hue})`} />
              </Box>
              <Text fw={700} style={{ fontFamily: 'var(--font-sora)', fontSize: 16 }}>{title}</Text>
              <Text size="sm" c="dimmed" style={{ lineHeight: 1.65 }}>{body}</Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Box>

      {/* What is a Coral Chest */}
      <Box style={{ background: 'var(--mantine-color-default)', borderTop: '1px solid var(--mantine-color-default-border)', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Box maw={640} mx="auto" px="xl" py={72} style={{ textAlign: 'center' }}>
          <Text
            component="h2"
            style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 24, margin: '0 0 16px', lineHeight: 1.2 }}
          >
            What&apos;s a Coral Chest?
          </Text>
          <Text c="dimmed" style={{ lineHeight: 1.75, fontSize: 15 }}>
            Think of it as a digital cabinet of curiosities for your reef. Every coral you add gets a unique RF code.
            Pass frags to other hobbyists — the lineage follows automatically. Years from now, every specimen in
            the hobby can trace itself back to its origin.
          </Text>
        </Box>
      </Box>

      {/* Recently logged — the crawl path into individual coral pages */}
      {recent.length > 0 && (
        <Box maw={900} mx="auto" px="xl" py={64}>
          <Text
            component="h2"
            style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 22, margin: '0 0 6px', textAlign: 'center' }}
          >
            Recently logged corals
          </Text>
          <Text c="dimmed" size="sm" style={{ textAlign: 'center', marginBottom: 24 }}>
            Every specimen gets its own page — no account needed to view.
          </Text>
          <Group gap={8} justify="center">
            {recent.map((c) => (
              <Link
                key={c.id}
                href={`/coral/${c.rfCode ?? c.id}`}
                style={{
                  textDecoration: 'none', color: 'inherit',
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600,
                }}
              >
                {c.name}
                {c.species && <Text span c="dimmed" fw={400} fs="italic"> · {c.species}</Text>}
              </Link>
            ))}
          </Group>
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/explore" style={{ color: 'var(--mantine-primary-color-filled)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Browse all specimens →
            </Link>
          </Text>
        </Box>
      )}

      {/* Bottom CTA */}
      <Box style={{ textAlign: 'center', padding: '72px 24px' }}>
        <Stack gap="md" align="center">
          <Text
            component="h2"
            style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 22, margin: 0 }}
          >
            Start your chest — it&apos;s free.
          </Text>
          <Text c="dimmed" size="sm">No credit card. No catch. Just your collection.</Text>
          <Button component="a" href="/sign-up" size="md" radius="md">Create account →</Button>
        </Stack>
      </Box>

      {/* Footer */}
      <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', padding: '20px 24px', textAlign: 'center' }}>
        <Text size="xs" c="dimmed">
          © {new Date().getFullYear()} Coral Chest · Free for hobbyists
        </Text>
      </Box>
    </Box>
  );
}
