import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/image',
      },
    ],
  },
  async redirects() {
    return [
      // NOTE: '/' is deliberately NOT redirected. It serves the public landing
      // page, which is the only crawlable entry point into the coral pages —
      // redirecting it sent Googlebot straight to /sign-in.
      { source: '/dashboard', destination: '/collection', permanent: false },
      { source: '/corals', destination: '/collection', permanent: true },
      { source: '/corals/:path*', destination: '/collection/:path*', permanent: true },
      { source: '/u/:username', destination: '/users/:username', permanent: false },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: 'jsdev-nk',
  project: 'javascript-nextjs',

  // Source map upload. Without this, prod stack traces read t.js:1:4823
  // instead of specimens.ts:159. Needs SENTRY_AUTH_TOKEN in CI/Vercel.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,

  // Proxies events through your own domain so ad-blockers don't drop them.
  tunnelRoute: '/monitoring',

  silent: !process.env.CI,
});
