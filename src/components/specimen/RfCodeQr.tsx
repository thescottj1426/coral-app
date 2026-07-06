'use client';

import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Center } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconQrcode } from '@tabler/icons-react';
import QRCode from 'qrcode';

interface Props {
  rfCode: string;
}

export function RfCodeQr({ rfCode }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!opened) return;
    QRCode.toDataURL(rfCode, { width: 240, margin: 2 }).then(setDataUrl);
  }, [opened, rfCode]);

  return (
    <>
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

      <Modal opened={opened} onClose={close} title={`RF code · ${rfCode}`} size="xs" centered>
        <Stack align="center" gap="sm" pb="md">
          {dataUrl ? (
            <img src={dataUrl} alt={`QR code for ${rfCode}`} width={240} height={240} />
          ) : (
            <Center h={240} w={240}>
              <Text size="xs" c="dimmed">Generating…</Text>
            </Center>
          )}
          <Text ff="monospace" size="sm" fw={700}>{rfCode}</Text>
          <Text size="xs" c="dimmed" ta="center">
            Scan to look up this specimen
          </Text>
        </Stack>
      </Modal>
    </>
  );
}
