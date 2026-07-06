'use client';

import { useTransition } from 'react';
import { Modal, NumberInput, Textarea, Button, Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { createListing } from '@/app/actions/listings';

interface Props {
  opened: boolean;
  onClose: () => void;
  coralId: string;
  coralName: string;
}

export function ListFragModal({ opened, onClose, coralId, coralName }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    initialValues: { price: 0, qty: 1, notes: '' },
    validate: {
      price: (v) => (v <= 0 ? 'Price must be greater than 0' : null),
      qty: (v) => (v < 1 ? 'Qty must be at least 1' : null),
    },
  });

  function handleSubmit(values: typeof form.values) {
    startTransition(async () => {
      try {
        await createListing({ coralId, price: values.price, qty: values.qty, notes: values.notes || undefined });
        notifications.show({ message: `Listing created for ${coralName}`, color: 'teal' });
        form.reset();
        onClose();
      } catch {
        notifications.show({ message: 'Could not create listing', color: 'red' });
      }
    });
  }

  return (
    <Modal opened={opened} onClose={onClose} title="List frags for sale" size="sm">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">Listing for: <strong>{coralName}</strong></Text>
          <Group grow>
            <NumberInput
              label="Price ($)"
              min={1}
              placeholder="25"
              {...form.getInputProps('price')}
            />
            <NumberInput
              label="Qty available"
              min={1}
              placeholder="3"
              {...form.getInputProps('qty')}
            />
          </Group>
          <Textarea
            label="Notes (optional)"
            placeholder="Size, health, shipping details…"
            rows={3}
            {...form.getInputProps('notes')}
          />
          <Group justify="flex-end" mt={4}>
            <Button variant="default" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" loading={isPending}>Create listing</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
