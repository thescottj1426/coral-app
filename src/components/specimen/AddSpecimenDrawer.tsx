'use client';

import {
  Drawer,
  Stack,
  TextInput,
  Textarea,
  Select,
  SegmentedControl,
  Button,
  Group,
  Text,
  Divider,
  Box,
  Image,
  CloseButton,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useForm, schemaResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { z } from 'zod';

const schema = z.object({
  name:     z.string().min(1, 'Name is required'),
  species:  z.string().optional(),
  category: z.enum(['SPS', 'LPS', 'SOFTIE', 'ZOA', 'ANEMONE']),
  origin:   z.string().min(1, 'Origin is required'),
  notes:    z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

interface AddSpecimenDrawerProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues & { photoUrl?: string; photoKey?: string }) => Promise<void>;
}

export function AddSpecimenDrawer({ opened, onClose, onSubmit }: AddSpecimenDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    validate: schemaResolver(schema),
    initialValues: {
      name:     '',
      species:  '',
      category: 'SPS',
      origin:   'Aquacultured',
      notes:    '',
    },
  });

  function handleDrop(files: File[]) {
    const file = files[0];
    if (!file) return;
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPendingFile(null);
    setPreview(null);
  }

  function handleClose() {
    clearPhoto();
    form.reset();
    onClose();
  }

  async function handleSubmit(values: FormValues) {
    setLoading(true);
    try {
      let photoUrl: string | undefined;
      let photoKey: string | undefined;

      if (pendingFile) {
        const fd = new FormData();
        fd.append('file', pendingFile);

        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(error ?? 'Photo upload failed');
        }
        const data = await res.json();
        photoUrl = data.url;
        photoKey = data.key;
      }

      await onSubmit({ ...values, photoUrl, photoKey });

      clearPhoto();
      form.reset();
      notifications.show({
        title: 'Specimen added',
        message: `${values.name} has been added to your collection.`,
        color: 'teal',
      });
    } catch (err) {
      notifications.show({
        title: 'Something went wrong',
        message: err instanceof Error ? err.message : 'Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="right"
      size={480}
      title={
        <Stack gap={2}>
          <Text style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16 }}>
            Add specimen
          </Text>
          <Text size="xs" c="dimmed">A unique RF code will be generated on save.</Text>
        </Stack>
      }
      styles={{
        header: { paddingBottom: 12, borderBottom: '1px solid var(--mantine-color-default-border)' },
        body:   { paddingTop: 20 },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">

          {/* Photo upload */}
          <div>
            <Text style={{ ...EYEBROW, marginBottom: 6 }}>photo</Text>
            {preview ? (
              <Box style={{ position: 'relative' }}>
                <Image
                  src={preview}
                  alt="Preview"
                  radius="md"
                  style={{ width: '100%', height: 160, objectFit: 'cover' }}
                />
                <CloseButton
                  size="sm"
                  onClick={clearPhoto}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    borderRadius: 999,
                  }}
                />
              </Box>
            ) : (
              <Dropzone
                onDrop={handleDrop}
                accept={IMAGE_MIME_TYPE}
                maxSize={8 * 1024 * 1024}
                maxFiles={1}
                styles={{ root: { minHeight: 100 } }}
              >
                <Group justify="center" gap="xs" style={{ minHeight: 80, pointerEvents: 'none' }} align="center">
                  <Dropzone.Accept><IconUpload size={22} stroke={1.5} color="var(--mantine-color-ocean-6)" /></Dropzone.Accept>
                  <Dropzone.Reject><IconX size={22} stroke={1.5} color="var(--mantine-color-red-6)" /></Dropzone.Reject>
                  <Dropzone.Idle><IconPhoto size={22} stroke={1.5} color="var(--mantine-color-dimmed)" /></Dropzone.Idle>
                  <Stack gap={2} align="center">
                    <Text size="sm" fw={500}>Drop a photo or click to browse</Text>
                    <Text size="xs" c="dimmed">PNG, JPG up to 8 MB</Text>
                  </Stack>
                </Group>
              </Dropzone>
            )}
          </div>

          <Divider />

          {/* Identity */}
          <div>
            <Text style={{ ...EYEBROW, marginBottom: 10 }}>identity</Text>
            <Stack gap="sm">
              <TextInput
                label="Common name"
                placeholder="e.g. Oregon Tort"
                withAsterisk
                {...form.getInputProps('name')}
              />
              <TextInput
                label="Species"
                placeholder="e.g. Acropora tortuosa"
                styles={{ input: { fontStyle: 'italic' } }}
                {...form.getInputProps('species')}
              />
            </Stack>
          </div>

          <div>
            <Text size="sm" fw={500} mb={6}>Category <Text span c="red" size="sm">*</Text></Text>
            <SegmentedControl
              fullWidth
              data={[
                { value: 'SPS',     label: 'SPS' },
                { value: 'LPS',     label: 'LPS' },
                { value: 'SOFTIE',  label: 'Softie' },
                { value: 'ZOA',     label: 'Zoa' },
                { value: 'ANEMONE', label: 'Anemone' },
              ]}
              {...form.getInputProps('category')}
            />
          </div>

          <Divider />

          {/* Provenance */}
          <div>
            <Text style={{ ...EYEBROW, marginBottom: 10 }}>provenance</Text>
            <Select
              label="Origin"
              withAsterisk
              data={['Aquacultured', 'Maricultured', 'Wild-caught', 'Tank-bred']}
              {...form.getInputProps('origin')}
            />
          </div>

          <Divider />

          {/* Notes */}
          <div>
            <Text style={{ ...EYEBROW, marginBottom: 10 }}>keeper notes</Text>
            <Textarea
              placeholder="Lighting, flow, placement, first impressions…"
              autosize
              minRows={3}
              maxRows={6}
              {...form.getInputProps('notes')}
            />
          </div>

          <Box pt={4}>
            <Group gap="sm">
              <Button variant="default" style={{ flex: 1 }} onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" style={{ flex: 2 }} loading={loading}>
                {loading ? 'Uploading…' : 'Add specimen'}
              </Button>
            </Group>
          </Box>

        </Stack>
      </form>
    </Drawer>
  );
}
