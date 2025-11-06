/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export
  images: {
    unoptimized: true // Required for static export
  },
  // Remove trailing slashes for clean URLs
  trailingSlash: true,
};

export default nextConfig;