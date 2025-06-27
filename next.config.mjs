/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    esmExternals: false,
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/store',
        destination: '/services?tab=browse',
        permanent: true,
      },
      {
        source: '/admin/orders',
        destination: '/services?tab=orders',
        permanent: true,
      },
      {
        source: '/admin/orders/:path*',
        destination: '/admin/orders/:path*',
        permanent: false,
      },
      {
        source: '/admin/sales',
        destination: '/services?tab=analytics',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;