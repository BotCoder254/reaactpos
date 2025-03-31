/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-domain.com'],
    unoptimized: true // Add this for static exports
  },
  // Ensure proper static file handling
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  // Cache static files
  staticPageGenerationTimeout: 90,
  // Enable experimental features if needed
  experimental: {
    // Add experimental features here
  }
}

module.exports = nextConfig 