import Link from 'next/link';
import { Box, Stack, Text, SimpleGrid, Paper, Group } from '@mantine/core';
import { searchSpecimens } from '@/app/actions/explore';
import { CategoryBadge } from '@/components/specimen/CategoryBadge';
import { CoralCardPhoto } from '@/components/coral/CoralCardPhoto';
import type { CoralCategory } from '@/theme/theme';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const results = q.trim() ? await searchSpecimens(q) : [];

  return (
    <Box p="lg" maw={1200}>
      <Stack gap={4} mb="xl">
        <Text
          component="h1"
          style={{ fontSize: 22, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
        >
          {q.trim() ? `Results for "${q}"` : 'Search'}
        </Text>
        {q.trim() && (
          <Text style={EYEBROW}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </Text>
        )}
      </Stack>

      {!q.trim() && (
        <Text c="dimmed" size="sm">
          Search for specimens, species, collectors, or RF codes using the bar above.
        </Text>
      )}

      {q.trim() && results.length === 0 && (
        <Text c="dimmed" size="sm">No results for &ldquo;{q}&rdquo;.</Text>
      )}

      {results.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
          {results.map((s) => (
            <Link key={s.id} href={`/coral/${s.rfCode ?? s.id}`} style={{ textDecoration: 'none' }}>
              <Paper withBorder style={{ overflow: 'hidden', display: 'block' }}>
                <CoralCardPhoto coverPhotoUrl={s.coverPhotoUrl} rfCode={s.rfCode ?? s.id} height={72} />
                <Box p="xs">
                  <Group gap={4} mb={2} wrap="nowrap">
                    <Text size="sm" fw={600} truncate style={{ flex: 1 }}>{s.name}</Text>
                    {s.category && s.category !== 'OTHER' && (
                      <CategoryBadge category={s.category as CoralCategory} />
                    )}
                  </Group>
                  {s.species && (
                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }} truncate>{s.species}</Text>
                  )}
                  <Text size="xs" c="dimmed">@{s.ownerUsername}</Text>
                  {s.rfCode && (
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                      {s.rfCode}
                    </Text>
                  )}
                </Box>
              </Paper>
            </Link>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
