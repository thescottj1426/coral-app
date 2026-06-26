'use client';

import { Title, Text, Card, Badge, Button } from '@mantine/core';
import {
  IconDroplet,
  IconTruck,
  IconCheck,
} from '@tabler/icons-react';
import styles from './onboarding.module.css';

type Path = 'hobbyist' | 'seller';

interface PathChoiceProps {
  selected: Path;
  onSelect: (p: Path) => void;
  onContinue: () => void;
}

const HOBBYIST_BULLETS = [
  'Unlimited corals in your collection',
  'RF codes + lineage tracing',
  'Public profile and shareable coral pages',
];

const SELLER_BULLETS = [
  'Shop page in the Farmers directory',
  'List frags for sale or trade',
  'Eligible for the Verified badge',
];

function PathCard({
  icon,
  title,
  desc,
  bullets,
  badge,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  bullets: string[];
  badge: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`${styles.pathCard} ${selected ? styles.pathCardSelected : ''}`}
      withBorder
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className={styles.pathCardHeader}>
        <span
          className={`${styles.pathIconTile} ${
            selected ? styles.pathIconSelected : styles.pathIconDefault
          }`}
        >
          {icon}
        </span>
        {badge}
      </div>

      <div>
        <Text fw={600} size="md">
          {title}
        </Text>
        <Text c="dimmed" size="sm" mt={2}>
          {desc}
        </Text>
      </div>

      <div className={styles.bulletList}>
        {bullets.map((b) => (
          <span key={b} className={styles.bullet}>
            <IconCheck
              size={13}
              stroke={2.4}
              color={selected ? 'var(--mantine-color-ocean-6)' : 'var(--mantine-color-gray-5)'}
              style={{ flexShrink: 0 }}
            />
            {b}
          </span>
        ))}
      </div>
    </Card>
  );
}

export function PathChoice({ selected, onSelect, onContinue }: PathChoiceProps) {
  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <Title order={1} style={{ fontSize: 26 }}>
          How will you reef?
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          Both are free. You can opt into selling anytime from settings.
        </Text>
      </div>

      <div className={styles.pathGrid}>
        <PathCard
          icon={<IconDroplet size={19} />}
          title="Hobbyist"
          desc="Catalog your tanks and corals, trace lineage, follow other reefers."
          bullets={HOBBYIST_BULLETS}
          badge={
            selected === 'hobbyist' ? (
              <Badge variant="light" radius="xl" size="sm">
                Selected
              </Badge>
            ) : null
          }
          selected={selected === 'hobbyist'}
          onClick={() => onSelect('hobbyist')}
        />

        <PathCard
          icon={<IconTruck size={19} />}
          title="Seller"
          desc="Everything in Hobbyist, plus a shop profile and listings."
          bullets={SELLER_BULLETS}
          badge={
            selected === 'seller' ? (
              <Badge variant="light" radius="xl" size="sm">
                Selected
              </Badge>
            ) : (
              <Badge
                variant="light"
                radius="xl"
                size="sm"
                color="gray"
              >
                Free for now
              </Badge>
            )
          }
          selected={selected === 'seller'}
          onClick={() => onSelect('seller')}
        />
      </div>

      <Button w={240} onClick={onContinue}>
        Continue as {selected === 'hobbyist' ? 'Hobbyist' : 'Seller'}
      </Button>
    </>
  );
}
