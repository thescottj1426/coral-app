import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme/theme';

/**
 * Every component in this app renders under the real theme, so tests do too —
 * a component that reads `--mantine-color-ocean-6` or a theme colour behaves
 * differently under the default provider than under ours.
 */
export function renderWithMantine(ui: ReactNode) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}
