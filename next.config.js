/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  // Serve lib files as static assets
  async rewrites() {
    return [
      {
        source: "/lib/:path*",
        destination: "/api/lib/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
