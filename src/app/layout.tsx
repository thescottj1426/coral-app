import type { Metadata } from 'next';
import { Sora, IBM_Plex_Mono, Instrument_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Providers } from './providers';
import { siteUrl } from '@/lib/siteUrl';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  // Without this, relative OG image URLs resolve against localhost in prod.
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Coral Chest — trace the lineage of every coral',
    template: '%s | Coral Chest',
  },
  description: 'The collector\'s log for reef hobbyists. Log specimens, trace lineage, share your chest.',
  // Set GOOGLE_SITE_VERIFICATION in Vercel to verify Search Console — no code change needed.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${ibmPlexMono.variable} ${instrumentSans.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
