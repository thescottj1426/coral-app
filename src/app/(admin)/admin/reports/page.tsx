import { Box, Stack, Text } from '@mantine/core';
import { getOpenReports } from '@/app/actions/admin';
import { ReportsClient } from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const reports = await getOpenReports();

  return (
    <Box p="lg" maw={1100}>
      <Stack gap="xl">
        <Stack gap={4}>
          <Text
            component="h1"
            style={{ fontSize: 24, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            Reports Queue
          </Text>
          <Text size="sm" c="dimmed">
            {reports.length} open report{reports.length !== 1 ? 's' : ''}
          </Text>
        </Stack>
        <ReportsClient reports={reports} />
      </Stack>
    </Box>
  );
}
