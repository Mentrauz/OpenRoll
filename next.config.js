/** @type {import('next').NextConfig} */

let nextConfig = {
  images: {
    unoptimized: false, // Enable Next.js image optimization
    formats: ['image/webp', 'image/avif'], // Use modern image formats
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-image-domain.com',
      },
    ],
  },
  // Enable React strict mode
  reactStrictMode: true,
  // Configure compression
  compress: true,
  // Configure ESM packages
  transpilePackages: ['@react-pdf/renderer'],

  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: {
    position: 'bottom-right',
    autoPrerender: false
  },
  // Configure Turbopack for development
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      // Replace framer-motion with a no-op shim
      'framer-motion': './lib/no-motion.tsx',
    },
  },

  // Add webpack optimization for production builds
  webpack: (config, { isServer, dev }) => {
    const path = require('path');
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            enforce: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
          // Separate heavy libraries
          xlsx: {
            test: /[\\/]node_modules[\\/](xlsx-js-style)[\\/]/,
            name: 'xlsx',
            chunks: 'async',
            enforce: true,
          },
          pdf: {
            test: /[\\/]node_modules[\\/](jspdf)[\\/]/,
            name: 'pdf',
            chunks: 'async',
            enforce: true,
          },
        },
      };
    }

    // Add performance optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optimize lodash imports
      'lodash': 'lodash-es',
      // Replace framer-motion with a no-op shim
      'framer-motion': path.resolve(__dirname, 'lib/no-motion.tsx'),
    };

    return config;
  },
  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // Add performance headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ];
  },
  env: {
    SUREPASS_API_KEY: process.env.SUREPASS_API_KEY,
  },
}

// Enable bundle analyzer if ANALYZE is true
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  })
  nextConfig = withBundleAnalyzer(nextConfig)
}

module.exports = nextConfig