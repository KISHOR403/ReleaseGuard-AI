/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@releaseguard/shared'],
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
