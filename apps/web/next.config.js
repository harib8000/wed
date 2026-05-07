/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['weddingos-dev-media.s3.ap-south-1.amazonaws.com', 'via.placeholder.com', 'images.unsplash.com', 'randomuser.me'],
  },
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: 'http://localhost:4001/auth/:path*' },
      { source: '/api/users/:path*', destination: 'http://localhost:4002/users/:path*' },
      { source: '/api/vendors/:path*', destination: 'http://localhost:4003/vendors/:path*' },
      { source: '/api/bookings/:path*', destination: 'http://localhost:4004/bookings/:path*' },
      { source: '/api/payments/:path*', destination: 'http://localhost:4005/payments/:path*' },
      { source: '/api/execution/:path*', destination: 'http://localhost:4006/execution/:path*' },
      { source: '/api/notifications/:path*', destination: 'http://localhost:4008/notifications/:path*' },
      { source: '/api/reviews/:path*', destination: 'http://localhost:4009/reviews/:path*' },
      { source: '/api/search/:path*', destination: 'http://localhost:4011/search/:path*' },
      { source: '/api/media/:path*', destination: 'http://localhost:4012/media/:path*' },
    ];
  },
};

module.exports = nextConfig;
