/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Allow JSX in .jsx files imported from pages/components
  transpilePackages: [],
}

module.exports = nextConfig
