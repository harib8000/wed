// Global test setup — load test env vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/wedding_os_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.NODE_ENV = 'test';

module.exports = async () => {
  // Integration tests would spin up a test DB here via testcontainers
  // Kept lightweight for unit tests
};
