/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow production builds even with lint warnings/errors (linting runs separately in CI)
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['weddingos-dev-media.s3.ap-south-1.amazonaws.com', 'via.placeholder.com', 'images.unsplash.com', 'randomuser.me'],
  },
  async rewrites() {
    const gateway = process.env.API_GATEWAY_URL ?? 'http://localhost:8000/api/v1';
    const useGateway = process.env.USE_API_GATEWAY === 'true';

    // In production / staging, route through the Kong API gateway
    if (useGateway) {
      return [
        { source: '/api/:path*', destination: `${gateway}/:path*` },
      ];
    }

    // In local development, route directly to each service
    const authUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001';
    const userUrl = process.env.USER_SERVICE_URL ?? 'http://localhost:4002';
    const vendorUrl = process.env.VENDOR_SERVICE_URL ?? 'http://localhost:4003';
    const bookingUrl = process.env.BOOKING_SERVICE_URL ?? 'http://localhost:4004';
    const paymentUrl = process.env.PAYMENT_SERVICE_URL ?? 'http://localhost:4005';
    const executionUrl = process.env.EXECUTION_SERVICE_URL ?? 'http://localhost:4006';
    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:4008';
    const reviewUrl = process.env.REVIEW_SERVICE_URL ?? 'http://localhost:4009';
    const searchUrl = process.env.SEARCH_SERVICE_URL ?? 'http://localhost:4011';
    const mediaUrl = process.env.MEDIA_SERVICE_URL ?? 'http://localhost:4012';

    return [
      { source: '/api/auth/:path*', destination: `${authUrl}/auth/:path*` },
      { source: '/api/users/:path*', destination: `${userUrl}/users/:path*` },
      { source: '/api/vendors/:path*', destination: `${vendorUrl}/vendors/:path*` },
      { source: '/api/bookings/:path*', destination: `${bookingUrl}/bookings/:path*` },
      { source: '/api/payments/:path*', destination: `${paymentUrl}/payments/:path*` },
      { source: '/api/execution/:path*', destination: `${executionUrl}/execution/:path*` },
      { source: '/api/notifications/:path*', destination: `${notificationUrl}/notifications/:path*` },
      { source: '/api/reviews/:path*', destination: `${reviewUrl}/reviews/:path*` },
      { source: '/api/search/:path*', destination: `${searchUrl}/search/:path*` },
      { source: '/api/media/:path*', destination: `${mediaUrl}/media/:path*` },
    ];
  },
};

module.exports = nextConfig;
