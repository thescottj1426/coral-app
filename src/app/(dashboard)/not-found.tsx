import Link from 'next/link';
import { Button, Container, Title, Text, Stack } from '@mantine/core';

export default function DashboardNotFound() {
  return (
    <Container size="sm" py={80} ta="center">
      <Stack gap="md" align="center">
        <Title order={2} style={{ fontFamily: 'var(--font-sora)' }}>Not found</Title>
        <Text c="dimmed" size="sm">
          That specimen isn&apos;t here — it may be unclaimed, private, or the link is out of date.
        </Text>
        <Link href="/collection">
          <Button component="a" variant="default" size="sm">Back to your collection</Button>
        </Link>
      </Stack>
    </Container>
  );
}
