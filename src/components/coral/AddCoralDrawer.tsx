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
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useForm, schemaResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import { z } from 'zod';

const schema = z.object({
  name:     z.string().min(1, 'Coral name is required'),
  species:  z.string().optional(),
  category: z.enum(['SPS', 'LPS', 'SOFTIE', 'ZOA', 'ANEMONE']),
  origin:   z.string().min(1, 'Origin is required'),
  tank:     z.string().min(1, 'Select a tank'),
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

interface AddCoralDrawerProps {
  opened: boolean;
  onClose: () => void;
  /** Pre-select a tank (e.g. when opened from tank detail page) */
  defaultTank?: string;
}

export function AddCoralDrawer({ opened, onClose, defaultTank }: AddCoralDrawerProps) {
  const form = useForm<FormValues>({
    validate: schemaResolver(schema),
    initialValues: {
      name:     '',
      species:  '',
      category: 'SPS',
      origin:   'Aquacultured',
      tank:     defaultTank ?? '',
      notes:    '',
    },
  });

  function handleSubmit(values: FormValues) {
    // Stub — Prisma + Neon write goes here
    console.log('Add coral:', values);
    notifications.show({
      title: 'Coral added',
      message: `${values.name} has been added to your bench.`,
      color: 'teal',
    });
    form.reset();
    onClose();
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={480}
      title={
        <Stack gap={2}>
          <Text style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16 }}>
            Add coral
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
            <Dropzone
              onDrop={() => {}}
              accept={IMAGE_MIME_TYPE}
              maxSize={8 * 1024 * 1024}
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

          {/* Category */}
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
            <Stack gap="sm">
              <Select
                label="Origin"
                withAsterisk
                data={[
                  'Aquacultured',
                  'Maricultured',
                  'Wild-caught',
                  'Tank-bred',
                ]}
                {...form.getInputProps('origin')}
              />
              <Select
                label="Tank"
                placeholder="Select a tank"
                withAsterisk
                data={[
                  { value: '1', label: 'The 90 (Reef · 90 gal)' },
                  { value: '2', label: 'Nano Brain Pico (Nano · 16 gal)' },
                ]}
                {...form.getInputProps('tank')}
              />
            </Stack>
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

          {/* Actions */}
          <Box pt={4}>
            <Group gap="sm">
              <Button variant="default" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" style={{ flex: 2 }}>
                Add coral
              </Button>
            </Group>
          </Box>

        </Stack>
      </form>
    </Drawer>
  );
}
