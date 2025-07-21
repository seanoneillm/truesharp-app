/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore ESLint errors during build for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build (only if necessary)
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig