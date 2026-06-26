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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? 'Polyp';
  const rfCode = searchParams.get('rfCode') ?? '';
  const category = searchParams.get('category') ?? '';
  const username = searchParams.get('username') ?? '';
  const hue = parseInt(searchParams.get('hue') ?? '200', 10);

  const catColors = CATEGORY_COLORS[category] ?? null;

  // Derive two gradient stops from the hue
  const stop1 = `hsl(${hue}, 55%, 38%)`;
  const stop2 = `hsl(${(hue + 30) % 360}, 60%, 22%)`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${stop1}, ${stop2})`,
          padding: 0,
          position: 'relative',
        }}
      >
        {/* Dark overlay for contrast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '60px 72px',
          }}
        >
          {/* Top: Polyp wordmark */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'sans-serif',
                fontWeight: 700,
                fontSize: 22,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '-0.3px',
              }}
            >
              polyp
            </span>
          </div>

          {/* Center: specimen info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {catColors && (
              <div
                style={{
                  display: 'inline-flex',
                  background: catColors.bg,
                  color: catColors.fg,
                  padding: '6px 16px',
                  borderRadius: 99,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  alignSelf: 'flex-start',
                }}
              >
                {category}
              </div>
            )}
            <span
              style={{
                fontFamily: 'sans-serif',
                fontWeight: 800,
                fontSize: 72,
                color: '#ffffff',
                lineHeight: 1.05,
                letterSpacing: '-1px',
              }}
            >
              {title}
            </span>
            {rfCode && (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 22,
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.12em',
                }}
              >
                {rfCode}
              </span>
            )}
          </div>

          {/* Bottom: collector */}
          {username && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `hsl(${(hue + 180) % 360}, 50%, 50%)`,
                  display: 'flex',
                }}
              />
              <span
                style={{
                  fontFamily: 'sans-serif',
                  fontSize: 18,
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500,
                }}
              >
                @{username}
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
