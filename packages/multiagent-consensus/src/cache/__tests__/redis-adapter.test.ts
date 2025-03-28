import { RedisCacheAdapter } from '../adapters/redis';
import { Redis } from '@upstash/redis';

// Mock the Redis class
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
  })),
}));

describe('RedisCacheAdapter', () => {
  let adapter: RedisCacheAdapter;
  // Use a more specific type for mockRedis
  let mockRedis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    scan: jest.Mock;
  };
  // Cast to unknown first to satisfy TypeScript
  const MockRedis = Redis as unknown as jest.Mock;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create the adapter
    adapter = new RedisCacheAdapter({
      url: 'https://fake-redis-url',
      token: 'fake-token',
      prefix: 'test:',
    });
  });

  test('should initialize Redis client lazily when first used', async () => {
    // Initially Redis should not be called
    expect(MockRedis).not.toHaveBeenCalled();

    // Force initialization by calling a method
    await adapter.get('test-key');

    // Now Redis should be called with the right params
    expect(MockRedis).toHaveBeenCalledWith({
      url: 'https://fake-redis-url',
      token: 'fake-token',
    });

    // Get the mocked Redis instance after it's been initialized
    mockRedis = MockRedis.mock.results[0].value as typeof mockRedis;
    expect(mockRedis.get).toHaveBeenCalled();
  });

  test('should initialize with environment variables if options not provided', async () => {
    // Save original env
    const originalEnv = process.env;

    // Set environment variables
    process.env.REDIS_URL = 'https://env-redis-url';
    process.env.REDIS_TOKEN = 'env-token';
    process.env.REDIS_PREFIX = 'env:';

    try {
      // Create adapter without options
      const envAdapter = new RedisCacheAdapter();

      // Redis client should not be initialized yet
      expect(MockRedis).not.toHaveBeenCalled();

      // Force initialization
      await envAdapter.get('test-key');

      // Should use env vars
      expect(MockRedis).toHaveBeenLastCalledWith({
        url: 'https://env-redis-url',
        token: 'env-token',
      });
    } finally {
      // Restore original env
      process.env = originalEnv;
    }
  });

  test('should get a value from Redis', async () => {
    // Initialize adapter and get mock instance
    await adapter.get('init-key');
    mockRedis = MockRedis.mock.results[0].value as typeof mockRedis;

    // Set up mock for the actual test
    const mockValue = { data: 'test-value' };
    mockRedis.get.mockResolvedValue(mockValue);

    const result = await adapter.get('test-key');

    expect(mockRedis.get).toHaveBeenCalledWith('test:test-key');
    expect(result).toEqual(mockValue);
  });

  test('should return null if Redis returns null', async () => {
    // Initialize adapter and get mock instance
    await adapter.get('init-key');
    mockRedis = MockRedis.mock.results[0].value as typeof mockRedis;

    mockRedis.get.mockResolvedValue(null);

    const result = await adapter.get('missing-key');

    expect(mockRedis.get).toHaveBeenCalledWith('test:missing-key');
    expect(result).toBeNull();
  });

  test('should handle errors when getting values', async () => {
    // Initialize adapter and get mock instance
    await adapter.get('init-key');
    mockRedis = MockRedis.mock.results[0].value as typeof mockRedis;

    mockRedis.get.mockRejectedValue(new Error('Redis error'));

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await adapter.get('error-key');

    expect(consoleSpy).toHaveBeenCalled();
    expect(result).toBeNull();

    consoleSpy.mockRestore();
  });

  test('should set a value in Redis with TTL', async () => {
    // Initialize adapter and get mock instance
    await adapter.get('init-key');
    mockRedis = MockRedis.mock.results[0].value as typeof mockRedis;

    const testValue = { data: 'test-value' };
    await adapter.set('test-key', testValue, 60);

    expect(mockRedis.set).toHaveBeenCalledWith('test:test-key', testValue, { ex: 60 });
  });

  test('should set a value in Redis without TTL if ttl is 0', async () => {
    // Initialize adapter and get mock instance
    await adapter.get('init-key');
    mockRedis = MockRedis.mock.results[0].value as typeof mockRedis;

    const testValue = { data: 'test-value' };
    await adapter.set('test-key', testValue, 0);

    expect(mockRedis.set).toHaveBeenCalledWith('test:test-key', testValue);
  });

  test('should delete a value from Redis', async () => {
    // Initialize adapter and get mock instance
    await adapter.get('init-key');
    mockRedis = MockRedis.mock.results[0].value as typeof mockRedis;

    await adapter.delete('test-key');

    expect(mockRedis.del).toHaveBeenCalledWith('test:test-key');
  });

  test('should clear all values with prefix from Redis', async () => {
    // Initialize adapter and get mock instance
    await adapter.get('init-key');
    mockRedis = MockRedis.mock.results[0].value as typeof mockRedis;

    // Mock scan to return some keys
    const mockKeys = ['test:key1', 'test:key2', 'test:key3'];
    mockRedis.scan
      .mockResolvedValueOnce([100, mockKeys.slice(0, 2)]) // First batch with cursor 100
      .mockResolvedValueOnce([0, mockKeys.slice(2)]); // Second batch with cursor 0

    await adapter.clear();

    // Should perform two scans
    expect(mockRedis.scan).toHaveBeenCalledTimes(2);

    // Should delete all found keys
    expect(mockRedis.del).toHaveBeenCalledWith(...mockKeys);
  });

  test('should not call del if no keys found during clear', async () => {
    // Initialize adapter and get mock instance
    await adapter.get('init-key');
    mockRedis = MockRedis.mock.results[0].value as typeof mockRedis;

    // Mock scan to return no keys
    mockRedis.scan.mockResolvedValueOnce([0, []]);

    await adapter.clear();

    expect(mockRedis.scan).toHaveBeenCalledTimes(1);
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  test('should log error if Redis connection options are missing', async () => {
    // Create adapter with no connection options
    const invalidAdapter = new RedisCacheAdapter({
      prefix: 'test:',
      // No URL or token
    });

    // Mock implementation to force an error in getRedisClient
    // @ts-expect-error - Accessing private method for testing purposes
    invalidAdapter.getRedisClient = jest.fn().mockImplementation(() => {
      throw new Error('Redis connection information missing');
    });

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Should return null and log error instead of throwing
    const result = await invalidAdapter.get('test-key');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Error retrieving from Redis cache');

    consoleSpy.mockRestore();
  });
});
