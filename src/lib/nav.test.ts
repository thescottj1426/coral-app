import { describe, it, expect } from 'vitest';
import { NAV_ITEMS } from './nav';

describe('NAV_ITEMS', () => {
  // The bug this exists for: the landing page shipped Explore, Lineage and
  // Farms as three separate links that all pointed at /explore.
  it('sends every label to a different place', () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('has no duplicate labels', () => {
    const labels = NAV_ITEMS.map((i) => i.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('links to app-internal routes', () => {
    for (const { href } of NAV_ITEMS) expect(href.startsWith('/')).toBe(true);
  });

  it('labels every destination', () => {
    for (const { label } of NAV_ITEMS) expect(label.trim()).not.toBe('');
  });
});
