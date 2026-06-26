'use client';

import { Tabs, Badge } from '@mantine/core';
import type { ReactNode } from 'react';

interface Tab {
  value: string;
  label: string;
  count?: number;
  panel: ReactNode;
}

export function ProfileTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <Tabs defaultValue={tabs[0]?.value}>
      <Tabs.List mb="md">
        {tabs.map((t) => (
          <Tabs.Tab
            key={t.value}
            value={t.value}
            rightSection={
              t.count !== undefined ? (
                <Badge size="xs" variant="light">{t.count}</Badge>
              ) : undefined
            }
          >
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
        <Tabs.Panel key={t.value} value={t.value}>
          {t.panel}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
