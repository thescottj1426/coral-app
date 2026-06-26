import { headers } from 'next/headers';
import { Box } from '@mantine/core';
import { getAllThreads } from '@/app/actions/discussions';
import { getMySpecimens } from '@/app/actions/specimens';
import { auth } from '@/lib/auth';
import { DiscussHub } from '@/components/discussion/DiscussHub';

export const dynamic = 'force-dynamic';

export default async function DiscussPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  const [threads, mySpecimens] = await Promise.all([
    getAllThreads(),
    session?.user
      ? getMySpecimens().catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <Box maw={1360} p="lg">
      <DiscussHub
        threads={threads}
        mySpecimens={mySpecimens}
        isLoggedIn={!!session?.user}
      />
    </Box>
  );
}
