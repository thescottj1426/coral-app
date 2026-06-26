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
      { source: '/', destination: '/dashboard', permanent: false },
      { source: '/corals', destination: '/collection', permanent: true },
      { source: '/corals/:path*', destination: '/collection/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
