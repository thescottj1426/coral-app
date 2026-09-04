import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithMantine } from '@/test/renderWithMantine';
import { RemoveSpecimenModal } from './RemoveSpecimenModal';

const { deleteSpecimen, push, refresh, show } = vi.hoisted(() => ({
  deleteSpecimen: vi.fn<(id: string, status: string, note?: string) => Promise<void>>(),
  push: vi.fn(),
  refresh: vi.fn(),
  show: vi.fn(),
}));

vi.mock('@/app/actions/specimens', () => ({ deleteSpecimen }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock('@mantine/notifications', () => ({ notifications: { show } }));

beforeEach(() => {
  vi.clearAllMocks();
  deleteSpecimen.mockResolvedValue(undefined);
});

function open(onClose = vi.fn()) {
  renderWithMantine(
    <RemoveSpecimenModal opened onClose={onClose} specimenId="c1" specimenName="Homewrecker" />
  );
  return onClose;
}

describe('RemoveSpecimenModal', () => {
  it('names the coral being removed', () => {
    open();
    expect(screen.getByText(/Remove Homewrecker/)).toBeInTheDocument();
  });

  it('separates dying from selling from giving away', () => {
    open();
    expect(screen.getByLabelText('It died')).toBeInTheDocument();
    expect(screen.getByLabelText('I sold it')).toBeInTheDocument();
    expect(screen.getByLabelText('I gave it away')).toBeInTheDocument();
  });

  // The control this replaced said "This cannot be undone", which was false.
  // Someone who clicked it by accident most needs to know that.
  it('says the removal is reversible and keeps lineage', () => {
    open();
    expect(screen.getByText(/You can restore it at any time/)).toBeInTheDocument();
    expect(screen.getByText(/stays in the lineage/)).toBeInTheDocument();
  });

  it('defaults to died, the overwhelmingly common case', async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: /Remove from collection/ }));

    expect(deleteSpecimen).toHaveBeenCalledWith('c1', 'LOST', undefined);
  });

  it('records the disposition the keeper picked', async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByLabelText('I sold it'));
    await user.click(screen.getByRole('button', { name: /Remove from collection/ }));

    expect(deleteSpecimen).toHaveBeenCalledWith('c1', 'SOLD', undefined);
  });

  it('passes the note along when one is written', async () => {
    const user = userEvent.setup();
    open();
    await user.type(screen.getByLabelText(/Note/), "RTN'd after a heater failure");
    await user.click(screen.getByRole('button', { name: /Remove from collection/ }));

    expect(deleteSpecimen).toHaveBeenCalledWith('c1', 'LOST', "RTN'd after a heater failure");
  });

  // Whitespace is not a note, and storing it would show an empty reason on the
  // coral's history.
  it('treats a whitespace-only note as no note', async () => {
    const user = userEvent.setup();
    open();
    await user.type(screen.getByLabelText(/Note/), '   ');
    await user.click(screen.getByRole('button', { name: /Remove from collection/ }));

    expect(deleteSpecimen).toHaveBeenCalledWith('c1', 'LOST', undefined);
  });

  it('removes nothing when cancelled', async () => {
    const user = userEvent.setup();
    const onClose = open();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(deleteSpecimen).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('leaves the keeper on the page when the removal fails', async () => {
    deleteSpecimen.mockRejectedValueOnce(new Error('nope'));
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: /Remove from collection/ }));

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
    expect(push).not.toHaveBeenCalled();
  });
});
