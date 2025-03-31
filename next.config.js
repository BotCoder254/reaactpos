/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  // Handle image domains if you're using next/image
  images: {
    domains: ['your-domain.com'],
  },
  // Enable experimental features if needed
  experimental: {
    // Add experimental features here
  }
}

module.exports = nextConfig 