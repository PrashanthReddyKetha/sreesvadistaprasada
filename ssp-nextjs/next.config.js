/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    // Cache each transformed image for 30 days instead of the default 60s.
    // This is the primary lever for reducing Vercel Image Optimization usage.
    minimumCacheTTL: 2592000,
    // Fewer breakpoints → fewer unique size variants per image.
    deviceSizes: [640, 828, 1080, 1920],
    // Only generate WebP; dropping AVIF halves the number of format variants.
    formats: ['image/webp'],
  },
  // Allow JSX in .jsx files imported from pages/components
  transpilePackages: [],
}

module.exports = nextConfig
