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
  // Canonical host is the apex domain (matches sitemap.ts, robots.ts and every
  // canonical/OG tag) — redirect www so Google consolidates ranking signals
  // onto one URL instead of splitting them across two hosts.
  // The service worker file must never be cached by the browser/CDN, or
  // updates to it (and the caches it manages) would take days to roll out.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.sreesvadistaprasada.com' }],
        destination: 'https://sreesvadistaprasada.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
