import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithMantine } from '@/test/renderWithMantine';
import { FragRow } from './FragRow';

const { setFragRecipient, addSpecimenPhoto, show } = vi.hoisted(() => ({
  setFragRecipient: vi.fn<(id: string, recipient: string) => Promise<{ error?: string }>>(),
  addSpecimenPhoto: vi.fn(),
  show: vi.fn(),
}));

vi.mock('@/app/actions/lineage', () => ({ setFragRecipient }));
vi.mock('@/app/actions/specimens', () => ({ addSpecimenPhoto }));
vi.mock('@mantine/notifications', () => ({ notifications: { show } }));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  setFragRecipient.mockResolvedValue({});
});

describe('FragRow', () => {
  const unclaimed = { id: 'c1', rfCode: 'RF-BVHJ', kept: false };
  const kept = { id: 'c2', rfCode: 'RF-TFEG', kept: true };

  it('shows the RF code, which is what gets written on the plug', () => {
    renderWithMantine(<FragRow frag={unclaimed} index={0} />);
    expect(screen.getByText('RF-BVHJ')).toBeInTheDocument();
  });

  it('numbers rows from 1, not from the array index', () => {
    renderWithMantine(<FragRow frag={unclaimed} index={0} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  describe('unclaimed — someone else will claim this plug', () => {
    it('is labelled Unclaimed', () => {
      renderWithMantine(<FragRow frag={unclaimed} index={0} />);
      expect(screen.getByText('Unclaimed')).toBeInTheDocument();
    });

    it('offers a claim link to hand out', () => {
      renderWithMantine(<FragRow frag={unclaimed} index={0} />);
      expect(screen.getByLabelText('Copy claim link')).toBeInTheDocument();
    });

    it('asks who received it', () => {
      renderWithMantine(<FragRow frag={unclaimed} index={0} />);
      expect(screen.getByLabelText('Who received frag RF-BVHJ')).toBeInTheDocument();
    });

    it('records the recipient when the field loses focus', async () => {
      const user = userEvent.setup();
      renderWithMantine(<FragRow frag={unclaimed} index={0} />);

      await user.type(screen.getByLabelText('Who received frag RF-BVHJ'), 'Dave');
      await user.tab();

      expect(setFragRecipient).toHaveBeenCalledWith('c1', 'Dave');
    });

    it('surfaces a failed save instead of losing it silently', async () => {
      setFragRecipient.mockResolvedValueOnce({ error: 'Frag already claimed' });
      const user = userEvent.setup();
      renderWithMantine(<FragRow frag={unclaimed} index={0} />);

      await user.type(screen.getByLabelText('Who received frag RF-BVHJ'), 'Dave');
      await user.tab();

      expect(show).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Frag already claimed', color: 'red' })
      );
    });
  });

  describe('kept — already in your own collection', () => {
    it('is labelled Yours', () => {
      renderWithMantine(<FragRow frag={kept} index={1} />);
      expect(screen.getByText('Yours')).toBeInTheDocument();
    });

    it('links to the coral rather than asking who received it', () => {
      renderWithMantine(<FragRow frag={kept} index={1} />);
      expect(screen.getByRole('link', { name: /In your collection/ })).toHaveAttribute(
        'href',
        '/collection/RF-TFEG'
      );
    });

    // A kept frag has nothing to hand out. Showing either control would invite
    // giving away a plug that is already yours.
    it('offers no claim link', () => {
      renderWithMantine(<FragRow frag={kept} index={1} />);
      expect(screen.queryByLabelText('Copy claim link')).not.toBeInTheDocument();
    });

    it('does not ask who received it', () => {
      renderWithMantine(<FragRow frag={kept} index={1} />);
      expect(screen.queryByLabelText(/Who received/)).not.toBeInTheDocument();
    });
  });

  describe('after uploading a photo', () => {
    // The blank-photo bug: /api/upload used to return a direct S3 URL, the
    // bucket is private, and the thumbnail rendered as nothing.
    it('renders the returned url through the image proxy, never a raw S3 url', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ url: '/api/image?key=specimens%2Fu1%2Fx.jpg', key: 'specimens/u1/x.jpg' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      addSpecimenPhoto.mockResolvedValueOnce(undefined);

      const user = userEvent.setup();
      const { container } = renderWithMantine(<FragRow frag={unclaimed} index={0} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, new File(['x'], 'x.jpg', { type: 'image/jpeg' }));

      const img = await screen.findByAltText('Frag RF-BVHJ');
      const src = img.getAttribute('src') ?? '';
      expect(src).not.toContain('amazonaws.com');
      expect(decodeURIComponent(src)).toContain('/api/image');

      vi.unstubAllGlobals();
    });

    it('attaches the photo to the frag it was taken for', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ url: '/api/image?key=k', key: 'k' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      addSpecimenPhoto.mockResolvedValueOnce(undefined);

      const user = userEvent.setup();
      const { container } = renderWithMantine(<FragRow frag={unclaimed} index={0} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, new File(['x'], 'x.jpg', { type: 'image/jpeg' }));

      expect(addSpecimenPhoto).toHaveBeenCalledWith(
        expect.objectContaining({ specimenId: 'c1', photoKey: 'k' })
      );

      vi.unstubAllGlobals();
    });
  });

  it('always offers the code itself for copying', () => {
    renderWithMantine(<FragRow frag={kept} index={0} />);
    expect(screen.getByLabelText('Copy RF-TFEG')).toBeInTheDocument();
  });
});
