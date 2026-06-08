/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable fetch cache so InsForge polling always gets fresh data
  experimental: {
    fetchCacheKeyPrefix: 'no-cache',
  },
};

export default nextConfig;
