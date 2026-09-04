'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { Modal, Stack, Text, Center, Button, CopyButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconQrcode, IconCheck, IconCopy } from '@tabler/icons-react';
import QRCode from 'qrcode';

interface Props {
  rfCode: string;
  variant?: 'icon' | 'button';
}

// The origin never changes for the life of the page, so there is nothing to
// subscribe to; the store exists only to keep server and client snapshots apart.
const subscribeToNothing = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => '';

export function RfCodeQr({ rfCode, variant = 'icon' }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [dataUrl, setDataUrl] = useState<string>('');
  // window is unavailable on the server, so the origin is read through a store
  // that returns '' during SSR and the real value once hydrated.
  const origin = useSyncExternalStore(subscribeToNothing, getOrigin, getServerOrigin);

  const shareUrl = origin ? `${origin}/coral/${rfCode}` : '';

  useEffect(() => {
    if (!opened || !shareUrl) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, { width: 240, margin: 2 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [opened, shareUrl]);

  return (
    <>
      {variant === 'button' ? (
        <Button onClick={open} variant="default" size="sm" leftSection={<IconQrcode size={15} />}>
          Share
        </Button>
      ) : (
        <button
          onClick={open}
          title="Show QR code"
          style={{
            background: 'none', border: 0, cursor: 'pointer', padding: '2px 4px',
            color: 'var(--mantine-color-dimmed)', borderRadius: 'var(--mantine-radius-sm)',
            display: 'inline-flex', alignItems: 'center',
          }}
        >
          <IconQrcode size={14} />
        </button>
      )}

      <Modal opened={opened} onClose={close} title={`Share · ${rfCode}`} size="xs" centered>
        <Stack align="center" gap="sm" pb="md">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`QR code for ${rfCode}`} width={240} height={240} />
          ) : (
            <Center h={240} w={240}>
              <Text size="xs" c="dimmed">Generating…</Text>
            </Center>
          )}
          <Text ff="monospace" size="sm" fw={700}>{rfCode}</Text>
          <Text size="xs" c="dimmed" ta="center" style={{ wordBreak: 'break-all' }}>
            {shareUrl}
          </Text>
          <CopyButton value={shareUrl} timeout={2000}>
            {({ copied, copy }) => (
              <Button
                onClick={copy}
                variant={copied ? 'light' : 'default'}
                color={copied ? 'teal' : undefined}
                size="xs"
                fullWidth
                disabled={!shareUrl}
                leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              >
                {copied ? 'Link copied' : 'Copy link'}
              </Button>
            )}
          </CopyButton>
          <Text size="xs" c="dimmed" ta="center">
            Scan or send this link to open the specimen&apos;s public page.
          </Text>
        </Stack>
      </Modal>
    </>
  );
}
