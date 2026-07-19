import { Box, Stack, Text } from '@mantine/core';
import { getPendingPhotos, getPhotoHistory } from '@/app/actions/admin';
import { PhotosPageClient } from './PhotosPageClient';

export const dynamic = 'force-dynamic';

export default async function AdminPhotosPage() {
  const [pending, history] = await Promise.all([
    getPendingPhotos(),
    getPhotoHistory(200),
  ]);

  return (
    <Box p="lg" maw={1100}>
      <Stack gap="xl">
        <Stack gap={4}>
          <Text
            component="h1"
            style={{ fontSize: 24, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            Photos
          </Text>
          <Text size="sm" c="dimmed">
            {pending.length} pending · {history.length} reviewed
          </Text>
        </Stack>
        <PhotosPageClient pending={pending} history={history} />
      </Stack>
    </Box>
  );
}
