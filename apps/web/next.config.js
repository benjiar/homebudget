/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/ui"], // Ensure shared UI package is transpiled
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true, // Consider removing this for stricter builds
  },
  // If using App Router and need to specify experimental features:
  // experimental: {
  //   typedRoutes: true, // Example for typed routes
  // },
  // output: 'standalone', // Uncomment for Docker deployment if needed
};

module.exports = nextConfig; 