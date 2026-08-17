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
  experimental: {
    // Force back/forward and re-visit navigations to always re-fetch page data
    // instead of reusing the Router Cache. Without this, admin availability
    // changes (e.g. hiding a menu item) can keep showing stale items to anyone
    // who navigates back to a menu page they'd already visited this session.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
}

module.exports = nextConfig
