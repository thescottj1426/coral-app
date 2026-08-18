import type { NextConfig } from "next";

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
      { source: '/', destination: '/collection', permanent: false },
      { source: '/dashboard', destination: '/collection', permanent: false },
      { source: '/corals', destination: '/collection', permanent: true },
      { source: '/corals/:path*', destination: '/collection/:path*', permanent: true },
      { source: '/u/:username', destination: '/users/:username', permanent: false },
    ];
  },
};

export default nextConfig;
