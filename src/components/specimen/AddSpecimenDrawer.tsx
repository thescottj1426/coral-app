'use client';

import {
  Drawer,
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
  Box,
  Image,
  CloseButton,
} from '@mantine/core';
import { useForm, schemaResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
import { useState } from 'react';
import { track } from '@vercel/analytics';
import { z } from 'zod';
import { CORAL_SPECIES, CORAL_COMMON_NAMES } from '@/lib/coralSpecies';

export const CORAL_STAGES = [
  { value: 'MOTHER_COLONY', label: 'Mother colony' },
  { value: 'COLONY',        label: 'Colony' },
  { value: 'MINI_COLONY',   label: 'Mini colony' },
  { value: 'FRAG',          label: 'Frag' },
  { value: 'MICRO_FRAG',    label: 'Micro frag' },
] as const;

const schema = z.object({
  name:      z.string().min(1, 'Name is required'),
  species:   z.string().optional(),
  category:  z.enum(['SPS', 'LPS', 'SOFTIE', 'ZOA', 'ANEMONE', 'OTHER']),
  origin:    z.string().min(1, 'Origin is required'),
  notes:     z.string().optional(),
  tankName:  z.string().optional(),
  lightPar:  z.string().optional(),
  flowLevel: z.string().optional(),
  stage:     z.enum(['MOTHER_COLONY', 'COLONY', 'MINI_COLONY', 'FRAG', 'MICRO_FRAG']),
  // Where it came from. Required so nothing enters the collection as an orphan.
  sourceKind:           z.enum(['own', 'outside', 'original']),
  parentId:             z.string().optional(),
  sourceColony:         z.string().optional(),
  vendor:               z.string().optional(),
  generationFromMother: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.sourceKind === 'own' && !v.parentId) {
    ctx.addIssue({ code: 'custom', path: ['parentId'], message: 'Pick which coral it was cut from' });
  }
  if (v.sourceKind === 'outside' && !v.sourceColony?.trim() && !v.vendor?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['vendor'], message: 'Add the farm or the source colony so its lineage is recorded' });
  }
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
  /** The user's own corals, so a new specimen can be linked to what it was cut from. */
  ownCorals?: Array<{ id: string; name: string; rfCode: string | null }>;
}

export function AddSpecimenDrawer({ opened, onClose, onSubmit, ownCorals = [] }: AddSpecimenDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const form = useForm<FormValues>({
    validate: schemaResolver(schema),
    initialValues: {
      name:      '',
      species:   '',
      category:  'SPS',
      origin:    'Aquacultured',
      notes:     '',
      tankName:  '',
      lightPar:  '',
      flowLevel: '',
      stage:     'FRAG',
      sourceKind: 'outside',
      parentId:   '',
      sourceColony: '',
      vendor:       '',
      generationFromMother: '',
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      notifications.show({ title: 'File too large', message: 'Max 8 MB', color: 'red' });
      return;
    }
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = '';
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
      track('specimen_added', { category: values.category, hasPhoto: !!photoUrl });

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
      trapFocus={false}
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
                <Image src={preview} alt="Preview" radius="md" h={160} w="100%" fit="cover" />
                <CloseButton
                  size="sm"
                  onClick={clearPhoto}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 999 }}
                />
              </Box>
            ) : (
              <Box
                component="label"
                htmlFor="specimen-photo-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  minHeight: 100,
                  border: '2px dashed var(--mantine-color-default-border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  padding: '20px 16px',
                }}
              >
                <input
                  id="specimen-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <IconPhoto size={22} stroke={1.5} color="var(--mantine-color-dimmed)" />
                <Text size="sm" fw={500}>Click to browse</Text>
                <Text size="xs" c="dimmed">PNG, JPG, WEBP up to 8 MB</Text>
              </Box>
            )}
            {!preview && (
              <Text size="xs" c="orange" mt={4}>
                No photo added — specimens with photos get noticed more in Explore. You can add one later too.
              </Text>
            )}
          </div>

          <Divider />

          {/* Identity */}
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

          {/* Propagation */}
          <div>
            <Text style={{ ...EYEBROW, marginBottom: 10 }}>propagation</Text>
            <Stack gap="sm">
              <Select
                label="What is it right now?"
                withAsterisk
                data={CORAL_STAGES.map(s => ({ value: s.value, label: s.label }))}
                allowDeselect={false}
                {...form.getInputProps('stage')}
              />

              <div>
                <Text size="sm" fw={500} mb={6}>
                  Where did it come from? <Text span c="red" size="sm">*</Text>
                </Text>
                <SegmentedControl
                  fullWidth
                  data={[
                    { value: 'own',      label: 'Cut from mine' },
                    { value: 'outside',  label: 'From outside' },
                    { value: 'original', label: 'Original' },
                  ]}
                  {...form.getInputProps('sourceKind')}
                />
              </div>

              {form.values.sourceKind === 'own' && (
                <Select
                  label="Cut from which coral?"
                  placeholder={ownCorals.length ? 'Pick one of your corals' : 'You have no corals yet'}
                  searchable
                  disabled={ownCorals.length === 0}
                  data={ownCorals.map(c => ({
                    value: c.id,
                    label: c.rfCode ? `${c.name} · ${c.rfCode}` : c.name,
                  }))}
                  {...form.getInputProps('parentId')}
                />
              )}

              {form.values.sourceKind === 'outside' && (
                <>
                  <TextInput
                    label="Farm or seller"
                    placeholder="e.g. World Wide Corals"
                    description="Shown publicly on this coral's page — use a business name, not a person."
                    {...form.getInputProps('vendor')}
                  />
                  <TextInput
                    label="Mother colony it came from"
                    placeholder="e.g. WWC Homewrecker mother"
                    description="Shown publicly."
                    {...form.getInputProps('sourceColony')}
                  />
                  <TextInput
                    label="Generations from that mother"
                    placeholder="e.g. 2 if it's an F2"
                    inputMode="numeric"
                    {...form.getInputProps('generationFromMother')}
                  />
                </>
              )}

              {form.values.sourceKind === 'original' && (
                <Text size="xs" c="dimmed">
                  Recorded as an original — generation 0, with no parent above it.
                </Text>
              )}
            </Stack>
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

          <Divider />

          {/* Tank & husbandry */}
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
