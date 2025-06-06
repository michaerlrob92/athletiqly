import { config } from '@/config/environment';
import { EventEmitter } from 'events';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Redis client for tests
jest.mock('ioredis', () => {
  const { EventEmitter } = require('events');
  class MockRedis extends EventEmitter {
    get = jest.fn();
    set = jest.fn();
    del = jest.fn();
    info = jest.fn();
    quit = jest.fn();
    disconnect = jest.fn();
    connect = jest.fn();
    flushdb = jest.fn();
  }
  return MockRedis;
});

// Mock logger to prevent console output during tests
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 