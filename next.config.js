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
    domains: ['localhost', 'printboothpro.com', 'printbooth-pro.vercel.app'],
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://printboothpro.com'
  },
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
  // Update rewrites to handle event routes properly
  async rewrites() {
    return [
      {
        source: '/event/:path*',
        destination: '/event/:path*',
      }
    ]
  },
}

module.exports = nextConfig
