import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 3002,
    proxy: {
      // Admin BFF routes (stats, revenue, reports) → user-service
      '/api/admin': { target: 'http://localhost:4002', rewrite: (p) => p.replace('/api/admin', '/users/admin') },
      // Service-specific routes
      '/api/auth': { target: 'http://localhost:4001', rewrite: (p) => p.replace('/api/auth', '/auth') },
      '/api/users': { target: 'http://localhost:4002', rewrite: (p) => p.replace('/api/users', '/users') },
      '/api/vendors': { target: 'http://localhost:4003', rewrite: (p) => p.replace('/api/vendors', '/vendors') },
      '/api/bookings': { target: 'http://localhost:4004', rewrite: (p) => p.replace('/api/bookings', '/bookings') },
      '/api/payments': { target: 'http://localhost:4005', rewrite: (p) => p.replace('/api/payments', '/payments') },
      '/api/reviews': { target: 'http://localhost:4009', rewrite: (p) => p.replace('/api/reviews', '/reviews') },
    },
  },
});
