'use client';

import {
  TextInput,
  Textarea,
  Select,
  Button,
  Text,
  Title,
  Chip,
} from '@mantine/core';
import { useForm, schemaResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import styles from './onboarding.module.css';

const SPECIALTIES = ['SPS', 'LPS', 'Softie', 'Zoa', 'Anemone'] as const;

const SHIPPING_OPTIONS = [
  { value: 'local', label: 'Local pickup only' },
  { value: 'local_ships', label: 'Local + ships' },
  { value: 'nationwide', label: 'Ships nationwide' },
];

const schema = z.object({
  shopName: z.string().min(1, { message: 'Shop name is required' }),
  bio: z.string().optional(),
  specialties: z.array(z.string()).min(1, { message: 'Pick at least one specialty' }),
  location: z.string().optional(),
  shipping: z.string().min(1, { message: 'Select a shipping option' }),
});

type FormValues = z.infer<typeof schema>;

export function SellerSetupForm() {
  const router = useRouter();

  const form = useForm<FormValues>({
    validate: schemaResolver(schema),
    initialValues: {
      shopName: '',
      bio: '',
      specialties: [],
      location: '',
      shipping: '',
    },
  });

  function handleSubmit(values: FormValues) {
    // Seller profile creation via Prisma/Neon goes here
    console.log('create seller', values);
    notifications.show({
      title: 'Shop opened!',
      message: `"${values.shopName}" is live in the Farmers directory.`,
      color: 'teal',
    });
    router.push('/');
  }

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <Title order={1} style={{ fontSize: 26 }}>
          Set up your shop
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          This is your page in the Farmers directory.
        </Text>
      </div>

      <form
        className={`${styles.formWrap} ${styles.sellerFormWrap}`}
        onSubmit={form.onSubmit(handleSubmit)}
      >
        <TextInput
          label="Shop name"
          placeholder="Maya's Frag Lab"
          autoFocus
          {...form.getInputProps('shopName')}
        />

        <Textarea
          label="Bio"
          placeholder="Hobbyist-grown SPS out of a 90g mixed reef. Everything aquacultured, everything traceable."
          rows={3}
          {...form.getInputProps('bio')}
        />

        <div>
          <Text size="sm" fw={500} mb={6}>
            Specialties
          </Text>
          <Chip.Group multiple {...form.getInputProps('specialties')}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SPECIALTIES.map((cat) => (
                <Chip key={cat} value={cat} size="sm" radius="xl">
                  {cat}
                </Chip>
              ))}
            </div>
          </Chip.Group>
          {form.errors.specialties && (
            <Text size="xs" c="red" mt={4}>
              {form.errors.specialties}
            </Text>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <TextInput
            label="Location"
            placeholder="Minneapolis, MN"
            {...form.getInputProps('location')}
          />
          <Select
            label="Shipping"
            placeholder="Select…"
            data={SHIPPING_OPTIONS}
            {...form.getInputProps('shipping')}
          />
        </div>

        <Button type="submit" fullWidth mt={6}>
          Open shop →
        </Button>

        <Text size="xs" c="dimmed" className={styles.sellerFootnote}>
          The Verified badge is granted by admins after a review — keep good trades.
        </Text>
      </form>
    </>
  );
}
