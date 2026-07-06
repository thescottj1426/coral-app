'use client';

import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Paper,
  Divider,
  Anchor,
  ThemeIcon,
} from '@mantine/core';
import {
  IconShare,
  IconLeaf,
  IconEdit,
  IconTrash,
  IconShield,
  IconScissors,
  IconTag,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FragModal } from '@/components/specimen/FragModal';
import { EditSpecimenModal } from '@/components/specimen/EditSpecimenModal';
import { ListFragModal } from '@/components/specimen/ListFragModal';
import { SpecimenThumb } from '@/components/specimen/SpecimenThumb';
import { PhotoLightbox } from '@/components/specimen/PhotoLightbox';
import { deleteSpecimen } from '@/app/actions/specimens';
import type { SpecimenDetail } from '@/app/actions/specimens';

interface Props {
  specimen: SpecimenDetail;
  isOwner?: boolean;
}

export function SpecimenActions({ specimen }: Props) {
  const router = useRouter();
  const [fragOpened, { open: openFrag, close: closeFrag }] = useDisclosure(false);
  const myGeneration = 0;

  async function handleDelete() {
    if (!confirm(`Delete "${specimen.name}"? This cannot be undone.`)) return;
    await deleteSpecimen(specimen.id);
    router.push('/collection');
  }

  return (
    <>
      <FragModal
        opened={fragOpened}
        onClose={closeFrag}
        parentId={specimen.id}
        parentRfCode={specimen.rfCode ?? specimen.id}
        parentName={specimen.name}
        parentGeneration={myGeneration}
      />

      <Group gap="xs">
        <Button size="xs" variant="white" leftSection={<IconEdit size={12} />}>
          Edit
        </Button>
        <Button size="xs" variant="white" leftSection={<IconShare size={12} />}>
          Share
        </Button>
      </Group>

      <Group gap="xs" ml="auto" style={{ display: 'none' }}>
        <Button
          variant="light"
          color="teal"
          size="xs"
          leftSection={<IconScissors size={12} />}
          onClick={openFrag}
        >
          Frag this specimen
        </Button>
        <Button
          component={Link}
          href={`/collection/${specimen.rfCode ?? specimen.id}/pedigree`}
          variant="light"
          size="xs"
          leftSection={<IconLeaf size={12} />}
        >
          Pedigree
        </Button>
      </Group>
    </>
  );
}

export function MetaStripActions({ specimen, isOwner }: Props) {
  const router = useRouter();
  const [fragOpened, { open: openFrag, close: closeFrag }] = useDisclosure(false);
  const [listOpened, { open: openList, close: closeList }] = useDisclosure(false);

  async function handleDelete() {
    if (!confirm(`Delete "${specimen.name}"? This cannot be undone.`)) return;
    await deleteSpecimen(specimen.id);
    router.push('/collection');
  }

  if (!isOwner) return null;

  return (
    <>
      <FragModal
        opened={fragOpened}
        onClose={closeFrag}
        parentId={specimen.id}
        parentRfCode={specimen.rfCode ?? specimen.id}
        parentName={specimen.name}
        parentGeneration={0}
      />
      <ListFragModal
        opened={listOpened}
        onClose={closeList}
        coralId={specimen.id}
        coralName={specimen.name}
      />
      <Group gap="xs" ml="auto">
        <Button
          variant="light"
          color="teal"
          size="xs"
          leftSection={<IconScissors size={12} />}
          onClick={openFrag}
        >
          Frag this specimen
        </Button>
        <Button
          variant="light"
          size="xs"
          leftSection={<IconTag size={12} />}
          onClick={openList}
        >
          List frags
        </Button>
        <Button
          component={Link}
          href={`/collection/${specimen.rfCode ?? specimen.id}/pedigree`}
          variant="light"
          size="xs"
          leftSection={<IconLeaf size={12} />}
        >
          Pedigree
        </Button>
        <Button
          variant="light"
          color="red"
          size="xs"
          leftSection={<IconTrash size={12} />}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Group>
    </>
  );
}

export function HeroActions({ specimen, isOwner }: Props) {
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  function handleShare() {
    const url = `${window.location.origin}/collection/${specimen.rfCode ?? specimen.id}`;
    navigator.clipboard.writeText(url).then(
      () => notifications.show({ message: 'Link copied to clipboard', color: 'teal' }),
      () => notifications.show({ message: url, color: 'gray', title: 'Share link' }),
    );
  }

  return (
    <>
      {isOwner && <EditSpecimenModal opened={editOpened} onClose={closeEdit} specimen={specimen} />}
      <Group gap="xs">
        {isOwner && (
          <Button size="xs" variant="white" leftSection={<IconEdit size={12} />} onClick={openEdit}>
            Edit
          </Button>
        )}
        <Button size="xs" variant="white" leftSection={<IconShare size={12} />} onClick={handleShare}>
          Share
        </Button>
      </Group>
    </>
  );
}

export function LineageSidebar({ specimen }: Props) {
  const EYEBROW: React.CSSProperties = {
    fontFamily: 'var(--font-ibm-plex-mono), monospace',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--mantine-color-dimmed)',
    fontWeight: 500,
  };

  return (
    <Paper withBorder p="md">
      <Group gap={6} mb={12}>
        <IconShield size={12} color="var(--mantine-color-ocean-6)" />
        <Text style={EYEBROW}>collector</Text>
      </Group>
      <Stack gap={6}>
        <Group gap={8} wrap="nowrap">
          <SpecimenThumb rfCode={specimen.rfCode ?? specimen.id} size={24} radius={4} />
          <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" fw={600} truncate>
              {specimen.ownerDisplayName ?? specimen.ownerUsername}
            </Text>
            <Text style={{ ...EYEBROW, fontSize: 9 }}>
              @{specimen.ownerUsername}
            </Text>
          </Stack>
          <Badge size="xs" variant="light" color="ocean" radius="xl">Owner</Badge>
        </Group>
      </Stack>
      <Divider my="sm" />
      <Anchor
        component={Link}
        href={`/u/${specimen.ownerUsername}`}
        size="xs"
        fw={600}
        style={{ display: 'block', textAlign: 'center' }}
      >
        View full collection →
      </Anchor>
    </Paper>
  );
}

interface HeroPhotoProps {
  photo: { id: string; url: string; status: string };
  specimenName: string;
  isOwner: boolean;
}

export function HeroPhoto({ photo, specimenName, isOwner }: HeroPhotoProps) {
  const [open, setOpen] = useState(false);
  const isPending = isOwner && photo.status === 'pending';

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{ position: 'absolute', inset: 0, cursor: 'zoom-in' }}
      >
        <Image src={photo.url} alt={specimenName} fill style={{ objectFit: 'cover' }} priority />
        {isPending && (
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
            <Badge color="yellow" variant="filled" size="sm" radius="sm">Pending Review</Badge>
          </div>
        )}
      </div>
      <PhotoLightbox
        photos={[photo]}
        initialIndex={0}
        currentIndex={0}
        onNavigate={() => {}}
        opened={open}
        onClose={() => setOpen(false)}
        specimenName={specimenName}
        isOwner={isOwner}
      />
    </>
  );
}
