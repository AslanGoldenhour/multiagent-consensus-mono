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
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create the adapter
    adapter = new RedisCacheAdapter({
      url: 'https://fake-redis-url',
      token: 'fake-token',
      prefix: 'test:',
    });

    // Get the mocked Redis instance
    mockRedis = (Redis as jest.Mock).mock.results[0].value;
  });

  test('should initialize with options', () => {
    expect(Redis).toHaveBeenCalledWith({
      url: 'https://fake-redis-url',
      token: 'fake-token',
    });
  });

  test('should initialize with environment variables if options not provided', () => {
    // Save original env
    const originalEnv = process.env;

    // Set environment variables
    process.env.REDIS_URL = 'https://env-redis-url';
    process.env.REDIS_TOKEN = 'env-token';
    process.env.REDIS_PREFIX = 'env:';

    try {
      // Create adapter without options
      new RedisCacheAdapter();

      // Should use env vars
      expect(Redis).toHaveBeenLastCalledWith({
        url: 'https://env-redis-url',
        token: 'env-token',
      });
    } finally {
      // Restore original env
      process.env = originalEnv;
    }
  });

  test('should get a value from Redis', async () => {
    const mockValue = JSON.stringify({ data: 'test-value' });
    mockRedis.get.mockResolvedValue(mockValue);

    const result = await adapter.get('test-key');

    expect(mockRedis.get).toHaveBeenCalledWith('test:test-key');
    expect(result).toEqual({ data: 'test-value' });
  });

  test('should return null if Redis returns null', async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await adapter.get('missing-key');

    expect(mockRedis.get).toHaveBeenCalledWith('test:missing-key');
    expect(result).toBeNull();
  });

  test('should handle errors when getting values', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis error'));

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await adapter.get('error-key');

    expect(consoleSpy).toHaveBeenCalled();
    expect(result).toBeNull();

    consoleSpy.mockRestore();
  });

  test('should set a value in Redis with TTL', async () => {
    await adapter.set('test-key', { data: 'test-value' }, 60);

    expect(mockRedis.set).toHaveBeenCalledWith(
      'test:test-key',
      JSON.stringify({ data: 'test-value' }),
      { ex: 60 }
    );
  });

  test('should set a value in Redis without TTL if ttl is 0', async () => {
    await adapter.set('test-key', { data: 'test-value' }, 0);

    expect(mockRedis.set).toHaveBeenCalledWith(
      'test:test-key',
      JSON.stringify({ data: 'test-value' })
    );
  });

  test('should delete a value from Redis', async () => {
    await adapter.delete('test-key');

    expect(mockRedis.del).toHaveBeenCalledWith('test:test-key');
  });

  test('should clear all values with prefix from Redis', async () => {
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
    // Mock scan to return no keys
    mockRedis.scan.mockResolvedValueOnce([0, []]);

    await adapter.clear();

    expect(mockRedis.scan).toHaveBeenCalledTimes(1);
    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});
