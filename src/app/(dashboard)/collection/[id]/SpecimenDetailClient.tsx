'use client';

import { useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Group,
  Button,
  Badge,
} from '@mantine/core';
import {
  IconShare,
  IconLeaf,
  IconEdit,
  IconArchive, IconArrowBackUp,
  IconScissors,
  IconTag,
  IconCamera,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FragModal } from '@/components/specimen/FragModal';
import { EditSpecimenModal } from '@/components/specimen/EditSpecimenModal';
import { ListFragModal } from '@/components/specimen/ListFragModal';
import { PhotoLightbox } from '@/components/specimen/PhotoLightbox';
import { restoreSpecimen, addSpecimenPhoto } from '@/app/actions/specimens';
import { RemoveSpecimenModal } from '@/components/specimen/RemoveSpecimenModal';
import type { SpecimenDetail } from '@/app/actions/specimens';

interface Props {
  specimen: SpecimenDetail;
  isOwner?: boolean;
}


export function MetaStripActions({ specimen, isOwner }: Props) {
  const router = useRouter();
  const [fragOpened, { open: openFrag, close: closeFrag }] = useDisclosure(false);
  const [listOpened, { open: openList, close: closeList }] = useDisclosure(false);

  const [removeOpened, { open: openRemove, close: closeRemove }] = useDisclosure(false);
  const removed = specimen.status !== 'ALIVE';

  async function handleRestore() {
    const res = await restoreSpecimen(specimen.id);
    if (res.error) {
      notifications.show({ title: 'Could not restore', message: res.error, color: 'red' });
      return;
    }
    notifications.show({
      title: 'Restored',
      message: `${specimen.name} is back in your collection.`,
      color: 'teal',
    });
    router.refresh();
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
        parentStage={specimen.stage ?? null}
        parentGeneration={0}
      />
      <ListFragModal
        opened={listOpened}
        onClose={closeList}
        coralId={specimen.id}
        coralName={specimen.name}
      />
      <RemoveSpecimenModal
        opened={removeOpened}
        onClose={closeRemove}
        specimenId={specimen.id}
        specimenName={specimen.name}
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
        {removed ? (
          <Button
            variant="light"
            color="teal"
            size="xs"
            leftSection={<IconArrowBackUp size={12} />}
            onClick={handleRestore}
          >
            Restore to collection
          </Button>
        ) : (
          <Button
            variant="light"
            color="gray"
            size="xs"
            leftSection={<IconArchive size={12} />}
            onClick={openRemove}
          >
            Remove
          </Button>
        )}
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


export function AddPhotoButton({ specimenId }: { specimenId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      notifications.show({ title: 'File too large', message: 'Max 8 MB', color: 'red' });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Upload failed');
      const { key, url } = await res.json();
      await addSpecimenPhoto({ specimenId, photoKey: key, photoUrl: url });
      notifications.show({ message: 'Photo added — pending review', color: 'teal' });
      router.refresh();
    } catch (err) {
      notifications.show({ title: 'Upload failed', message: err instanceof Error ? err.message : 'Please try again.', color: 'red' });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <Button
        size="xs"
        variant="default"
        leftSection={<IconCamera size={13} />}
        loading={loading}
        onClick={() => inputRef.current?.click()}
      >
        Add photo
      </Button>
    </>
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
