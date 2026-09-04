import { describe, it, expect } from 'vitest';
import { stageLabel, effectiveGeneration } from './coralStage';

describe('stageLabel', () => {
  it.each([
    ['MOTHER_COLONY', 'Mother colony'],
    ['COLONY', 'Colony'],
    ['MINI_COLONY', 'Mini colony'],
    ['FRAG', 'Frag'],
    ['MICRO_FRAG', 'Micro frag'],
  ] as const)('labels %s', (stage, label) => {
    expect(stageLabel(stage)).toBe(label);
  });

  it.each([null, undefined])('returns null for %s', (input) => {
    expect(stageLabel(input)).toBeNull();
  });
});

describe('effectiveGeneration', () => {
  // A coral imported from a farm carries prior generations in
  // generationFromMother; in-app depth stacks on top of that offset.
  it('adds in-app depth to the root offset', () => {
    expect(effectiveGeneration(2, 3)).toBe(5);
  });

  it.each([null, undefined])('treats a %s offset as zero', (offset) => {
    expect(effectiveGeneration(2, offset)).toBe(2);
  });

  it('handles a zero offset', () => {
    expect(effectiveGeneration(4, 0)).toBe(4);
  });

  it('returns the offset itself at depth zero', () => {
    expect(effectiveGeneration(0, 3)).toBe(3);
  });

  it('is zero for a root coral with no prior generations', () => {
    expect(effectiveGeneration(0, null)).toBe(0);
  });
});
