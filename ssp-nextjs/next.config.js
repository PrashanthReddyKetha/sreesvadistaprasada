/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Only the hosts we actually serve images from — a '**' wildcard turns
    // /_next/image into an open optimisation proxy anyone can abuse.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'sreesvadistaprasada.com' },
      // Stragglers still referenced by a few menu items in the DB — migrate
      // those images to Firebase and then remove these entries.
      { protocol: 'https', hostname: 'imglink.cc' },
      { protocol: 'https', hostname: 'static.vecteezy.com' },
      { protocol: 'https', hostname: '*.edgeone.app' },
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
