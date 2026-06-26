'use client';

import { Text, Group, Stack } from '@mantine/core';
import { CoralThumb } from './CoralThumb';
import styles from './coral.module.css';

export interface TreeNode {
  rfCode: string;
  name: string;
  owner: string;
  claimed: boolean;
  isYou?: boolean;
  /** Guide string: space-separated tokens per depth level.
   *  Each token: '' (nothing), '_' (vertical pipe), 't' (T-branch ├), 'l' (L-branch └)
   *  e.g. "_t" means: depth-0 = pipe, depth-1 = T-branch */
  guides: string;
}

const GUIDE_CLASS: Record<string, string> = {
  '_': styles.guideV,
  't': styles.guideT,
  'l': styles.guideL,
};

interface PedigreeTreeProps {
  nodes: TreeNode[];
}

export function PedigreeTree({ nodes }: PedigreeTreeProps) {
  return (
    <Stack gap={2}>
      {nodes.map((node) => {
        const guideParts = node.guides ? node.guides.split('') : [];

        return (
          <div
            key={node.rfCode}
            className={`${styles.treeRow} ${node.isYou ? styles.treeRowYou : ''} ${!node.claimed ? styles.treeGhost : ''}`}
          >
            {/* Guide lines */}
            {guideParts.length > 0 && (
              <div className={styles.treeGuides}>
                {guideParts.map((g, i) => (
                  <div
                    key={i}
                    className={`${styles.guideCell} ${GUIDE_CLASS[g] ?? ''}`}
                  />
                ))}
              </div>
            )}

            {/* Thumb */}
            {node.claimed ? (
              <CoralThumb rfCode={node.rfCode} size={36} />
            ) : (
              <div className={styles.ghostThumb} />
            )}

            {/* Info */}
            <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
              <Group gap={6} wrap="nowrap">
                <Text size="sm" fw={600} truncate style={{ flex: 1 }}>
                  {node.claimed ? node.owner : 'Unclaimed'}
                </Text>
                <Text
                  size="xs"
                  style={{
                    fontFamily: 'var(--font-ibm-plex-mono), monospace',
                    color: 'var(--mantine-color-dimmed)',
                    flexShrink: 0,
                  }}
                >
                  {node.rfCode}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" truncate>
                {node.name}
              </Text>
            </Stack>
          </div>
        );
      })}
    </Stack>
  );
}
