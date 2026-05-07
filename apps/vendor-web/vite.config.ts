import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 3001,
    proxy: {
      '/api/auth': { target: 'http://localhost:4001', rewrite: (p) => p.replace('/api/auth', '/auth') },
      '/api/vendors': { target: 'http://localhost:4003', rewrite: (p) => p.replace('/api/vendors', '/vendors') },
      '/api/bookings': { target: 'http://localhost:4004', rewrite: (p) => p.replace('/api/bookings', '/bookings') },
      '/api/payments': { target: 'http://localhost:4005', rewrite: (p) => p.replace('/api/payments', '/payments') },
      '/api/reviews': { target: 'http://localhost:4009', rewrite: (p) => p.replace('/api/reviews', '/reviews') },
      '/api/notifications': { target: 'http://localhost:4008', rewrite: (p) => p.replace('/api/notifications', '/notifications') },
      '/api/media': { target: 'http://localhost:4012', rewrite: (p) => p.replace('/api/media', '/media') },
    },
  },
});
