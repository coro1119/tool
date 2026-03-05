/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // ISR 타임아웃 방지
  staticPageGenerationTimeout: 120,
}

module.exports = nextConfig
