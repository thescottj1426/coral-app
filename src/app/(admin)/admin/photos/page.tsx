import { Box, Stack, Text } from '@mantine/core';
import { getPendingPhotos } from '@/app/actions/admin';
import { PhotoQueueClient } from './PhotoQueueClient';

export const dynamic = 'force-dynamic';

export default async function AdminPhotosPage() {
  const photos = await getPendingPhotos();

  return (
    <Box p="lg" maw={1100}>
      <Stack gap="xl">
        <Stack gap={4}>
          <Text
            component="h1"
            style={{ fontSize: 24, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            Photo Queue
          </Text>
          <Text size="sm" c="dimmed">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} pending review
          </Text>
        </Stack>
        <PhotoQueueClient photos={photos} />
      </Stack>
    </Box>
  );
}
