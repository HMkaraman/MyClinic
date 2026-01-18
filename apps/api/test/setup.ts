// Jest setup file for API tests

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/myclinic_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Increase timeout for async tests
jest.setTimeout(30000);

// Mock Redis service globally
jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  }));
  return RedisMock;
});

// Silence console during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
