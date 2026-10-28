/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The repo root also holds a lockfile (legacy frontend); pin the root to this app.
  turbopack: { root: __dirname },
  images: {
    // Only the hosts we actually serve images from — a '**' wildcard turns
    // /_next/image into an open optimisation proxy anyone can abuse.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'sreesvadistaprasada.com' },
    ],
    // Cache each transformed image for 30 days instead of the default 60s.
    // This is the primary lever for reducing Vercel Image Optimization usage.
    minimumCacheTTL: 2592000,
    // Fewer breakpoints → fewer unique size variants per image.
    deviceSizes: [640, 828, 1080, 1920],
    // Only generate WebP; dropping AVIF halves the number of format variants.
    formats: ['image/webp'],
    // Next 16 only serves the qualities listed here; the hero slider asks for 80.
    qualities: [75, 80],
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
      // Google has shown this address for the gongura guide; the article lives at /gongura
      { source: '/what-is-gongura', destination: '/gongura', permanent: true },
      // Dishes renamed in the menu: Search Console still reports the old addresses as 404
      { source: '/prasada/starters-and-evening-delights/mirchi-bhajji', destination: '/prasada/starters-and-evening-delights/mirchi-bhajji-3pcs', permanent: true },
      { source: '/breakfast/idli-vada/ghee-karam-idli', destination: '/breakfast/idli-vada/ghee-karam-idli-3-pcs', permanent: true },
      { source: '/breakfast/dosas/masala-dosa-2-pcs', destination: '/breakfast/dosas/masala-dosa', permanent: true },
      { source: '/svadista/curries/andhra-chicken-curry', destination: '/svadista/curries/spicy-andhra-chicken-curry', permanent: true },
    ]
  },
}

module.exports = nextConfig
