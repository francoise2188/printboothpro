/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'localhost', 
      'printboothpro.com', 
      'www.printboothpro.com',
      'printboothpro.vercel.app',
      'vercel.app'
    ],
    unoptimized: true
  },
  env: {
    // Use NEXT_PUBLIC_BASE_URL as the primary URL
    // This should be set to https://printboothpro.com in Vercel
    NEXT_PUBLIC_SITE_URL: 'https://printboothpro.com'
  },
  // Add headers to ensure HTTPS and prevent caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ],
      }
    ]
  },
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
}

module.exports = nextConfig
