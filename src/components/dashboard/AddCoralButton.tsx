'use client';

import { useState } from 'react';
import { Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { AddCoralDrawer } from '@/components/coral/AddCoralDrawer';

export function AddCoralButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AddCoralDrawer opened={open} onClose={() => setOpen(false)} />
      <Button leftSection={<IconPlus size={14} />} onClick={() => setOpen(true)}>
        Add coral
      </Button>
    </>
  );
}
