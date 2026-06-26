export type AnchorType = 'specimen' | 'line' | 'species' | 'photo' | 'listing' | 'log';

export const ANCHOR_TYPE_CONFIG = {
  specimen: { label: 'Specimen',        hue: null as null },
  line:     { label: 'Bloodline',        hue: 210 },
  species:  { label: 'Species / Morph',  hue: 140 },
  photo:    { label: 'Photo pin',        hue: 330 },
  listing:  { label: 'Listing',          hue: 40  },
  log:      { label: 'Care log',         hue: 190 },
} satisfies Record<AnchorType, { label: string; hue: number | null }>;

export const anchorTile  = (hue: number) =>
  `linear-gradient(135deg, oklch(0.72 0.13 ${hue}), oklch(0.5 0.15 ${hue}))`;
export const anchorInk   = (hue: number) => `oklch(0.55 0.16 ${hue})`;
export const anchorWash  = (hue: number) => `oklch(0.96 0.03 ${hue})`;
