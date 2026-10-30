'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, Button, Group } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { track } from '@vercel/analytics';
import styles from './certificate.module.css';

// Client-side so the page itself stays cached: reading searchParams on the
// server would render it per request.
export function WelcomeBanner({ name }: { name: string }) {
  const welcome = useSearchParams().get('welcome') === '1';
  if (!welcome) return null;
  return (
    <Alert color="teal" variant="light" className={styles.noPrint} mb="md">
      {name} is in your collection, with its full history. This certificate is yours to print or share.
    </Alert>
  );
}

export function CertificateActions({ rfCode }: { rfCode: string }) {
  useEffect(() => {
    track('certificate_viewed');
  }, []);

  return (
    <Group justify="center" mt="lg" className={styles.noPrint}>
      <Button leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
        Print or save as PDF
      </Button>
      <a href={`/coral/${rfCode}`} style={{ textDecoration: 'none' }}>
        <Button component="span" variant="default">Back to coral</Button>
      </a>
    </Group>
  );
}
