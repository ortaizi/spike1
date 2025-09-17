/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  transpilePackages: ['@spike/database', '@spike/shared', '@spike/ui'],
  images: {
    domains: ['images.unsplash.com', 'lh3.googleusercontent.com'],
  },
  i18n: {
    locales: ['he', 'en'],
    defaultLocale: 'he',
    localeDetection: false,
  },
  webpack: (config, { dev, isServer }) => {
    // Memory optimizations for development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    // Simplified fallback configuration
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      global: false,
    };

    return config;
  },
  // Reduce memory usage
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
