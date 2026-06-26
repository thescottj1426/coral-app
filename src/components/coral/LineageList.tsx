'use client';

import { Text, Group, Stack } from '@mantine/core';
import { CoralThumb } from './CoralThumb';
import styles from './coral.module.css';

export interface LineageNode {
  rfCode: string;
  name: string;
  owner: string;
  generation: number;
  isYou?: boolean;
}

interface LineageListProps {
  nodes: LineageNode[];
}

export function LineageList({ nodes }: LineageListProps) {
  return (
    <div className={styles.linList}>
      {nodes.map((node, i) => {
        const isLast = i === nodes.length - 1;
        return (
          <div key={node.rfCode} className={styles.linRow}>
            {/* Rail: dot + stem */}
            <div className={styles.linRail}>
              <div className={`${styles.linDot} ${node.isYou ? styles.linDotYou : ''}`} />
              {!isLast && <div className={styles.linStem} />}
            </div>

            {/* Node content */}
            <div className={`${styles.linNode} ${node.isYou ? styles.linNodeYou : ''}`}>
              <CoralThumb rfCode={node.rfCode} size={32} />
              <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" fw={600} truncate style={{ flex: 1 }}>
                    {node.owner}
                  </Text>
                  <Text
                    size="xs"
                    style={{
                      fontFamily: 'var(--font-ibm-plex-mono), monospace',
                      flexShrink: 0,
                      color: 'var(--mantine-color-dimmed)',
                    }}
                  >
                    {node.rfCode}
                  </Text>
                </Group>
                <div className={styles.linGenLabel}>
                  Gen {node.generation} · {node.name}
                </div>
              </Stack>
            </div>
          </div>
        );
      })}
    </div>
  );
}
