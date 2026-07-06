'use client';

import { useState, useTransition } from 'react';
import {
  Button, Drawer, TextInput, Textarea, Switch,
  Stack, Group, Text, Chip,
} from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { updateProfile } from '@/app/actions/users';
import type { UpdateProfileData } from '@/app/actions/users';

const SPECIALTIES = ['SPS', 'LPS', 'Softie', 'Zoa', 'Anemone'];

interface Props {
  initial: {
    displayName: string | null;
    bio: string | null;
    location: string | null;
    isSeller: boolean;
    shopName: string | null;
    shopBio: string | null;
    specialty: string[] | null;
  };
}

export function EditProfileButton({ initial }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initial.displayName ?? '');
  const [bio, setBio] = useState(initial.bio ?? '');
  const [location, setLocation] = useState(initial.location ?? '');
  const [isSeller, setIsSeller] = useState(initial.isSeller);
  const [shopName, setShopName] = useState(initial.shopName ?? '');
  const [shopBio, setShopBio] = useState(initial.shopBio ?? '');
  const [specialty, setSpecialty] = useState<string[]>(initial.specialty ?? []);

  function handleSave() {
    const data: UpdateProfileData = {
      displayName: displayName.trim() || undefined,
      bio: bio.trim(),
      location: location.trim(),
      isSeller,
      shopName: isSeller ? shopName.trim() : undefined,
      shopBio: isSeller ? shopBio.trim() : undefined,
      specialty,
    };
    startTransition(async () => {
      try {
        await updateProfile(data);
        notifications.show({ message: 'Profile updated', color: 'teal' });
        setOpen(false);
        router.refresh();
      } catch {
        notifications.show({ message: 'Could not save profile', color: 'red' });
      }
    });
  }

  return (
    <>
      <Button variant="default" size="sm" leftSection={<IconEdit size={14} />} onClick={() => setOpen(true)}>
        Edit profile
      </Button>

      <Drawer
        opened={open}
        onClose={() => setOpen(false)}
        title={<Text fw={700}>Edit profile</Text>}
        position="right"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Display name"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.currentTarget.value)}
          />
          <Textarea
            label="Bio"
            placeholder="Tell the community about your tank…"
            value={bio}
            onChange={(e) => setBio(e.currentTarget.value)}
            autosize
            minRows={3}
          />
          <TextInput
            label="Location"
            placeholder="Minneapolis, MN"
            value={location}
            onChange={(e) => setLocation(e.currentTarget.value)}
          />

          <div>
            <Text size="sm" fw={500} mb={6}>Specialties</Text>
            <Chip.Group multiple value={specialty} onChange={setSpecialty}>
              <Group gap={6} wrap="wrap">
                {SPECIALTIES.map((s) => (
                  <Chip key={s} value={s} size="sm" radius="xl">{s}</Chip>
                ))}
              </Group>
            </Chip.Group>
          </div>

          <Switch
            label="I sell frags"
            checked={isSeller}
            onChange={(e) => setIsSeller(e.currentTarget.checked)}
          />

          {isSeller && (
            <>
              <TextInput
                label="Shop name"
                placeholder="Your Frag Lab"
                value={shopName}
                onChange={(e) => setShopName(e.currentTarget.value)}
              />
              <Textarea
                label="Shop bio"
                placeholder="What you grow and how you ship…"
                value={shopBio}
                onChange={(e) => setShopBio(e.currentTarget.value)}
                autosize
                minRows={2}
              />
            </>
          )}

          <Group justify="flex-end" pt={4}>
            <Button variant="default" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSave} loading={isPending}>Save</Button>
          </Group>
        </Stack>
      </Drawer>
    </>
  );
}
