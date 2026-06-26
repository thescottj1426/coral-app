// theme.ts — Frag Bench Mantine v8 theme.
// Ships all three designed directions; switch with the DIRECTION constant.
// Usage:
//   import { theme, cssVariablesResolver } from './theme';
//   <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="auto">
//
// Fonts (load via next/font or Google Fonts):
//   A · Reef Lab    → Sora (600, 700)
//   B · Open Water  → Bricolage Grotesque (600, 700)
//   C · Specimen    → Space Grotesk (600, 700)
//   All directions  → IBM Plex Mono (400, 500) for RF codes & parameters

import {
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';

// ---------------------------------------------------------------------------
// 1. Pick a direction
// ---------------------------------------------------------------------------
export type Direction = 'reefLab' | 'openWater' | 'specimen';
const DIRECTION: Direction = 'reefLab';

// ---------------------------------------------------------------------------
// 2. Brand color scales (10 shades, Mantine convention; primaryShade 6 light / 8 dark)
// ---------------------------------------------------------------------------
const ocean: MantineColorsTuple = [
  '#edf3fe', '#d7e4fb', '#bcd2f7', '#9cbcf2', '#6b95e8',
  '#4a7dda', '#2f66cc', '#2a58b0', '#234a92', '#1b3a78',
];

const lagoon: MantineColorsTuple = [
  '#e0f6f9', '#c0ebf0', '#9bdde6', '#6fcad7', '#3fb0c2',
  '#239eb1', '#0e8da0', '#0b7285', '#085e6f', '#074a5a',
];

const coralfire: MantineColorsTuple = [
  '#fff0ea', '#ffded1', '#ffc4ad', '#fda685', '#f4875e',
  '#ec6a3d', '#e04f22', '#c2410f', '#9f350f', '#7c2a0e',
];

const DIRECTION_CONFIG: Record<
  Direction,
  { primaryColor: string; headingFont: string; defaultRadius: 'sm' | 'md' | 'lg' }
> = {
  reefLab: { primaryColor: 'ocean', headingFont: 'Sora', defaultRadius: 'md' },
  openWater: { primaryColor: 'lagoon', headingFont: 'Bricolage Grotesque', defaultRadius: 'lg' },
  specimen: { primaryColor: 'coralfire', headingFont: 'Space Grotesk', defaultRadius: 'sm' },
};

const dir = DIRECTION_CONFIG[DIRECTION];

// ---------------------------------------------------------------------------
// 3. Category colors — fixed across directions. Use via CSS vars
//    (--fb-cat-sps etc.) or the helpers below.
// ---------------------------------------------------------------------------
export const CATEGORY_COLORS = {
  SPS: { fg: '#3b5bdb', bg: '#edf2ff' },
  LPS: { fg: '#099268', bg: '#e6fcf5' },
  SOFTIE: { fg: '#6741d9', bg: '#f3f0ff' },
  ZOA: { fg: '#e67700', bg: '#fff9db' },
  ANEMONE: { fg: '#c2255c', bg: '#fff0f6' },
  OTHER: { fg: '#495057', bg: '#f1f3f5' },
} as const;

export type CoralCategory = keyof typeof CATEGORY_COLORS;

export const STATUS_COLORS = {
  ACTIVE: 'teal',
  RESERVED: 'yellow',
  PAUSED: 'gray',
} as const;

// ---------------------------------------------------------------------------
// 4. Theme
// ---------------------------------------------------------------------------
export const theme = createTheme({
  colors: { ocean, lagoon, coralfire },
  primaryColor: dir.primaryColor,
  primaryShade: { light: 6, dark: 5 },

  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',

  headings: {
    fontFamily: `var(--font-sora, "${dir.headingFont}"), -apple-system, sans-serif`,
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '26px', lineHeight: '1.25' },
      h2: { fontSize: '22px', lineHeight: '1.3' },
      h3: { fontSize: '17px', lineHeight: '1.35' },
    },
  },

  defaultRadius: dir.defaultRadius,
  cursorType: 'pointer',

  components: {
    Button: {
      defaultProps: { fw: 600 },
    },
    Paper: {
      defaultProps: { withBorder: true, radius: dir.defaultRadius === 'sm' ? 'md' : 'lg' },
    },
    Card: {
      defaultProps: { withBorder: true, radius: dir.defaultRadius === 'sm' ? 'md' : 'lg', padding: 'md' },
    },
    Badge: {
      defaultProps: { variant: 'light', radius: 'xl' },
    },
    Code: {
      styles: { root: { fontSize: 12, letterSpacing: '0.02em' } },
    },
    Table: {
      defaultProps: { verticalSpacing: 'sm', highlightOnHover: true },
    },
    Pagination: {
      defaultProps: { siblings: 1, boundaries: 1 },
    },
    Skeleton: {
      defaultProps: { radius: dir.defaultRadius },
    },
    Tooltip: {
      defaultProps: { withArrow: true },
    },
  },

  other: {
    direction: DIRECTION,
    categoryColors: CATEGORY_COLORS,
    appBg: { reefLab: '#f8f9fa', openWater: '#fafaf8', specimen: '#fafaf9' }[DIRECTION],
  },
});

// ---------------------------------------------------------------------------
// 5. CSS variables — category colors + app background, with dark-mode values.
// ---------------------------------------------------------------------------
export const cssVariablesResolver: CSSVariablesResolver = (t) => ({
  variables: {
    '--fb-radius': `var(--mantine-radius-${dir.defaultRadius})`,
  },
  light: {
    '--fb-app-bg': t.other.appBg as string,
    '--fb-cat-sps': CATEGORY_COLORS.SPS.fg,
    '--fb-cat-sps-bg': CATEGORY_COLORS.SPS.bg,
    '--fb-cat-lps': CATEGORY_COLORS.LPS.fg,
    '--fb-cat-lps-bg': CATEGORY_COLORS.LPS.bg,
    '--fb-cat-softie': CATEGORY_COLORS.SOFTIE.fg,
    '--fb-cat-softie-bg': CATEGORY_COLORS.SOFTIE.bg,
    '--fb-cat-zoa': CATEGORY_COLORS.ZOA.fg,
    '--fb-cat-zoa-bg': CATEGORY_COLORS.ZOA.bg,
    '--fb-cat-anemone': CATEGORY_COLORS.ANEMONE.fg,
    '--fb-cat-anemone-bg': CATEGORY_COLORS.ANEMONE.bg,
  },
  dark: {
    '--fb-app-bg': 'var(--mantine-color-dark-8)',
    '--fb-cat-sps': '#748ffc',
    '--fb-cat-sps-bg': 'rgba(116,143,252,0.12)',
    '--fb-cat-lps': '#38d9a9',
    '--fb-cat-lps-bg': 'rgba(56,217,169,0.12)',
    '--fb-cat-softie': '#9775fa',
    '--fb-cat-softie-bg': 'rgba(151,117,250,0.12)',
    '--fb-cat-zoa': '#ffa94d',
    '--fb-cat-zoa-bg': 'rgba(255,169,77,0.12)',
    '--fb-cat-anemone': '#f783ac',
    '--fb-cat-anemone-bg': 'rgba(247,131,172,0.12)',
  },
});

// ---------------------------------------------------------------------------
// 6. Generative identity tile (coral with no photo yet)
// ---------------------------------------------------------------------------
export function coralIdentityGradient(rfCode: string): string {
  let h = 0;
  for (const ch of rfCode) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, oklch(0.76 0.11 ${h}), oklch(0.5 0.13 ${h}))`;
}
