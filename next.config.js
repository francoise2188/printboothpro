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
      'printbooth-pro.vercel.app', 
      'printbooth-pro-git-camera-test.vercel.app',
      'printbooth-pro-git-camera-test-francoise-tonetos-projects.vercel.app',
      'printbooth-62zcllyci-francoise-tonetos-projects.vercel.app',
      'vercel.app'
    ],
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
      : 'https://printboothpro.com'
  },
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
  // Update rewrites to handle all routes properly
  async rewrites() {
    return [
      {
        source: '/event/:path*',
        destination: '/event/:path*',
      },
      {
        source: '/test-camera',
        destination: '/test-camera',
      },
      {
        source: '/subscription',
        destination: '/subscription',
      }
    ]
  },
}

module.exports = nextConfig
