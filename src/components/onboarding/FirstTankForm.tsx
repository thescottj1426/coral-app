'use client';

import { useRef } from 'react';
import {
  TextInput,
  NumberInput,
  SegmentedControl,
  Button,
  Text,
  Title,
  Stack,
  Group,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload } from '@tabler/icons-react';
import { useForm, schemaResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import styles from './onboarding.module.css';

const schema = z.object({
  name: z.string().min(1, { message: 'Tank name is required' }),
  volume: z.number().min(1, { message: 'Enter a volume' }).optional(),
  type: z.enum(['Reef', 'FOWLR', 'Nano', 'Frag']),
});

type FormValues = z.infer<typeof schema>;

export function FirstTankForm() {
  const router = useRouter();
  const openRef = useRef<() => void>(null);

  const form = useForm<FormValues>({
    validate: schemaResolver(schema),
    initialValues: {
      name: '',
      volume: undefined,
      type: 'Reef',
    },
  });

  function handleSubmit(values: FormValues) {
    // Tank creation via Prisma/Neon goes here
    console.log('create tank', values);
    notifications.show({
      title: 'Tank created!',
      message: `"${values.name}" is ready. Start adding corals.`,
      color: 'teal',
    });
    router.push('/');
  }

  function handleSkip() {
    router.push('/');
  }

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <Title order={1} style={{ fontSize: 26 }}>
          Set up your first tank
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          Corals live in tanks — you need at least one to start your collection.
        </Text>
      </div>

      <form
        className={`${styles.formWrap} ${styles.tankFormWrap}`}
        onSubmit={form.onSubmit(handleSubmit)}
      >
        <TextInput
          label="Tank name"
          placeholder="The 90"
          autoFocus
          {...form.getInputProps('name')}
        />

        <div className={styles.volumeTypeRow}>
          <NumberInput
            label="Volume"
            placeholder="90"
            suffix=" gal"
            min={1}
            {...form.getInputProps('volume')}
          />
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Type
            </Text>
            <SegmentedControl
              data={['Reef', 'FOWLR', 'Nano', 'Frag']}
              {...form.getInputProps('type')}
            />
          </Stack>
        </div>

        <div>
          <Text size="sm" fw={500} mb={4}>
            Photo{' '}
            <Text span c="dimmed" fw={400}>
              (optional)
            </Text>
          </Text>
          <Dropzone
            openRef={openRef}
            onDrop={(files) => console.log('dropped', files)}
            accept={IMAGE_MIME_TYPE}
            className={styles.dropzone}
          >
            <Stack align="center" justify="center" gap={4} style={{ minHeight: 110, pointerEvents: 'none' }}>
              <IconUpload size={20} color="var(--mantine-color-gray-5)" />
              <Text size="sm">
                <Text span fw={600}>
                  Drag a photo
                </Text>{' '}
                or click to browse
              </Text>
              <Text size="xs" c="dimmed">
                Uploads go straight to your gallery
              </Text>
            </Stack>
          </Dropzone>
        </div>

        <Group className={styles.tankActions} grow>
          <Button variant="default" onClick={handleSkip} style={{ flex: 1 }}>
            Skip for now
          </Button>
          <Button type="submit" style={{ flex: 2 }}>
            Create tank →
          </Button>
        </Group>
      </form>
    </>
  );
}
