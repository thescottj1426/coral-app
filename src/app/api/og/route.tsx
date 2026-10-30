import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const CATEGORY_COLORS: Record<string, { fg: string; bg: string }> = {
  SPS: { fg: '#3b5bdb', bg: '#edf2ff' },
  LPS: { fg: '#099268', bg: '#e6fcf5' },
  SOFTIE: { fg: '#6741d9', bg: '#f3f0ff' },
  ZOA: { fg: '#e67700', bg: '#fff9db' },
  ANEMONE: { fg: '#c2255c', bg: '#fff0f6' },
  OTHER: { fg: '#495057', bg: '#f1f3f5' },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 15, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#868e96', fontFamily: 'monospace' }}>
        {label}
      </span>
      <span style={{ fontSize: 26, fontWeight: 700, color: '#212529' }}>{value}</span>
    </div>
  );
}

/** A coral's share card: photo on the left, its lineage facts on the right. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = url.searchParams;
  const title = p.get('title') ?? 'Coral Chest';
  const rfCode = p.get('rfCode') ?? '';
  const category = p.get('category') ?? '';
  const username = p.get('username') ?? '';
  const species = p.get('species') ?? '';
  const gen = p.get('gen');
  const origin = p.get('origin') ?? '';
  const verified = p.get('verified') === '1';
  const hue = parseInt(p.get('hue') ?? '200', 10);
  // Only this site's own image proxy, so the card can't be pointed at arbitrary URLs.
  const photoPath = p.get('photo');
  const photo = photoPath?.startsWith('/api/image?') ? `${url.origin}${photoPath}` : null;

  const catColors = CATEGORY_COLORS[category] ?? null;
  const stop1 = `hsl(${hue}, 55%, 45%)`;
  const stop2 = `hsl(${(hue + 30) % 360}, 60%, 25%)`;

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', background: '#f1f3f5', padding: 28, fontFamily: 'sans-serif' }}>
        <div
          style={{
            display: 'flex',
            flex: 1,
            background: '#ffffff',
            borderRadius: 28,
            overflow: 'hidden',
            border: `6px solid ${verified ? '#12b886' : '#2f66cc'}`,
          }}
        >
          <div style={{ width: 520, height: '100%', display: 'flex', background: `linear-gradient(135deg, ${stop1}, ${stop2})` }}>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" width={520} height={562} style={{ objectFit: 'cover', width: 520, height: '100%' }} />
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 44px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#2f66cc' }}>Coral Chest</span>
              {catColors && (
                <span
                  style={{
                    background: catColors.bg, color: catColors.fg, padding: '6px 16px', borderRadius: 99,
                    fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}
                >
                  {category}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: title.length > 22 ? 48 : 62, fontWeight: 800, color: '#212529', lineHeight: 1.05 }}>
                {title}
              </span>
              {species && <span style={{ fontSize: 24, fontStyle: 'italic', color: '#868e96' }}>{species}</span>}
              {rfCode && (
                <span style={{ fontSize: 22, fontFamily: 'monospace', letterSpacing: '0.12em', color: '#495057', marginTop: 6 }}>
                  {rfCode}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 40 }}>
              {gen !== null && <Row label="Lineage" value={gen === '0' ? 'Original' : `Gen ${gen}`} />}
              {origin && <Row label={verified ? 'Verified farm' : 'Origin'} value={`@${origin}`} />}
              {username && <Row label="Keeper" value={`@${username}`} />}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
