'use client';

import {
  Modal,
  Stack,
  Autocomplete,
  Textarea,
  TextInput,
  Select,
  SegmentedControl,
  Button,
  Group,
  Text,
  Divider,
} from '@mantine/core';
import { useForm, schemaResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { updateSpecimen } from '@/app/actions/specimens';
import type { SpecimenDetail } from '@/app/actions/specimens';
import { CORAL_SPECIES, CORAL_COMMON_NAMES } from '@/lib/coralSpecies';

const schema = z.object({
  name:      z.string().min(1, 'Name is required'),
  species:   z.string().optional(),
  category:  z.enum(['SPS', 'LPS', 'SOFTIE', 'ZOA', 'ANEMONE', 'OTHER']),
  origin:    z.string().min(1, 'Origin is required'),
  notes:     z.string().optional(),
  tankName:  z.string().optional(),
  lightPar:  z.string().optional(),
  flowLevel: z.string().optional(),
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

interface EditSpecimenModalProps {
  opened: boolean;
  onClose: () => void;
  specimen: SpecimenDetail;
}

export function EditSpecimenModal({ opened, onClose, specimen }: EditSpecimenModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    validate: schemaResolver(schema),
    initialValues: {
      name:      specimen.name,
      species:   specimen.species ?? '',
      category:  (specimen.category as FormValues['category']) ?? 'SPS',
      origin:    specimen.origin ?? '',
      notes:     specimen.notes ?? '',
      tankName:  specimen.tankName ?? '',
      lightPar:  specimen.lightPar ?? '',
      flowLevel: specimen.flowLevel ?? '',
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues({
        name:      specimen.name,
        species:   specimen.species ?? '',
        category:  (specimen.category as FormValues['category']) ?? 'SPS',
        origin:    specimen.origin ?? '',
        notes:     specimen.notes ?? '',
        tankName:  specimen.tankName ?? '',
        lightPar:  specimen.lightPar ?? '',
        flowLevel: specimen.flowLevel ?? '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  async function handleSubmit(values: FormValues) {
    setLoading(true);
    try {
      await updateSpecimen(specimen.id, values);
      router.refresh();
      onClose();
      notifications.show({
        title: 'Specimen updated',
        message: `${values.name} has been saved.`,
        color: 'teal',
      });
    } catch {
      notifications.show({
        title: 'Something went wrong',
        message: 'Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={2}>
          <Text style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16 }}>
            Edit specimen
          </Text>
          <Text size="xs" c="dimmed">RF code: {specimen.rfCode}</Text>
        </Stack>
      }
      size={480}
      styles={{
        header: { paddingBottom: 12, borderBottom: '1px solid var(--mantine-color-default-border)' },
        body:   { paddingTop: 20 },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <div>
            <Text style={{ ...EYEBROW, marginBottom: 10 }}>identity</Text>
            <Stack gap="sm">
              <Autocomplete
                label="Common name"
                placeholder="e.g. Oregon Tort"
                withAsterisk
                data={CORAL_COMMON_NAMES}
                limit={10}
                {...form.getInputProps('name')}
              />
              <Autocomplete
                label="Species"
                placeholder="e.g. Acropora tortuosa"
                styles={{ input: { fontStyle: 'italic' } }}
                data={CORAL_SPECIES}
                limit={8}
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
                { value: 'OTHER',   label: 'Other' },
              ]}
              {...form.getInputProps('category')}
            />
          </div>

          <Divider />

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

          <Divider />

          <div>
            <Text style={{ ...EYEBROW, marginBottom: 10 }}>tank &amp; husbandry</Text>
            <Stack gap="sm">
              <TextInput
                label="Tank / system"
                placeholder="e.g. Main display"
                {...form.getInputProps('tankName')}
              />
              <TextInput
                label="Light (PAR / intensity)"
                placeholder="e.g. 180 PAR, medium-high"
                {...form.getInputProps('lightPar')}
              />
              <TextInput
                label="Flow level"
                placeholder="e.g. Medium-high"
                {...form.getInputProps('flowLevel')}
              />
            </Stack>
          </div>

          <Group gap="sm" pt={4}>
            <Button variant="default" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" style={{ flex: 2 }} loading={loading}>
              Save changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
