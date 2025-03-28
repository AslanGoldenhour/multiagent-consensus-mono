import { createCachingMiddleware } from '../middleware';
import { MemoryCacheAdapter } from '../adapters/memory';
import { generateCacheKey } from '../utils';
import type { LanguageModelV1Middleware } from 'ai';

describe('Caching Middleware', () => {
  // Keep track of adapters created during tests
  const adapters: MemoryCacheAdapter[] = [];

  // Create a helper to register adapters for cleanup
  const createAdapter = () => {
    const adapter = new MemoryCacheAdapter();
    adapters.push(adapter);
    return adapter;
  };

  // Clean up all adapters after each test
  afterEach(() => {
    adapters.forEach(adapter => adapter.destroy());
    adapters.length = 0;
  });

  test('should pass through when caching is disabled', async () => {
    const middleware = createCachingMiddleware({ enabled: false }) as any;

    const mockDoGenerate = jest.fn().mockResolvedValue({ text: 'response' });
    const mockParams = {
      model: 'test-model',
      prompt: 'Hello',
    };

    const result = await middleware.wrapGenerate({
      doGenerate: mockDoGenerate,
      params: mockParams,
    });

    expect(mockDoGenerate).toHaveBeenCalled();
    expect(result).toEqual({ text: 'response' });
  });

  test('should return cached response if available', async () => {
    // Create adapter with pre-populated cache
    const adapter = createAdapter();

    // Use the same params we'll use in the test
    const mockParams = {
      model: 'test-model',
      prompt: 'Hello',
    };

    // Generate key using the same method the middleware will use
    const cacheKey = generateCacheKey(mockParams);

    const cachedResponse = { text: 'cached response' };
    await adapter.set(cacheKey, cachedResponse);

    const middleware = createCachingMiddleware({
      enabled: true,
      adapter,
    }) as any;

    const mockDoGenerate = jest.fn().mockResolvedValue({ text: 'fresh response' });

    const result = await middleware.wrapGenerate({
      doGenerate: mockDoGenerate,
      params: mockParams,
    });

    // The mock should not have been called because we used the cache
    expect(mockDoGenerate).not.toHaveBeenCalled();
    expect(result).toEqual(cachedResponse);
  });

  test('should cache response on cache miss', async () => {
    const adapter = createAdapter();
    const middleware = createCachingMiddleware({
      enabled: true,
      adapter,
      ttl: 60,
    }) as any;

    const freshResponse = { text: 'fresh response' };
    const mockDoGenerate = jest.fn().mockResolvedValue(freshResponse);
    const mockParams = {
      model: 'test-model',
      prompt: 'Hello',
    };

    // First call - should be a cache miss
    const result1 = await middleware.wrapGenerate({
      doGenerate: mockDoGenerate,
      params: mockParams,
    });

    expect(mockDoGenerate).toHaveBeenCalled();
    expect(result1).toEqual(freshResponse);

    // Reset mock for next call
    mockDoGenerate.mockClear();

    // Second call with same params - should be a cache hit
    const result2 = await middleware.wrapGenerate({
      doGenerate: mockDoGenerate,
      params: mockParams,
    });

    // The mock should not have been called the second time
    expect(mockDoGenerate).not.toHaveBeenCalled();
    expect(result2).toEqual(freshResponse);
  });

  test('should handle streaming responses', async () => {
    const adapter = createAdapter();
    const middleware = createCachingMiddleware({
      enabled: true,
      adapter,
    }) as any;

    const mockStreamResponse = { stream: {} };
    const mockDoStream = jest.fn().mockResolvedValue(mockStreamResponse);
    const mockParams = {
      model: 'test-model',
      prompt: 'Hello',
    };

    // First call - should be a cache miss
    const result1 = await middleware.wrapStream({
      doStream: mockDoStream,
      params: mockParams,
    });

    expect(mockDoStream).toHaveBeenCalled();
    expect(result1).toEqual(mockStreamResponse);

    // Reset mock for next call
    mockDoStream.mockClear();

    // Second call with same params - should be a cache hit
    const result2 = await middleware.wrapStream({
      doStream: mockDoStream,
      params: mockParams,
    });

    // The mock should not have been called the second time
    expect(mockDoStream).not.toHaveBeenCalled();
    expect(result2).toEqual(mockStreamResponse);
  });

  test('should take different parameter values into account for cache key', async () => {
    const adapter = createAdapter();
    const middleware = createCachingMiddleware({
      enabled: true,
      adapter,
    }) as any;

    // Create a mockDoGenerate function that returns different responses
    const mockDoGenerate1 = jest.fn().mockResolvedValue({ text: 'response 1' });
    const mockDoGenerate2 = jest.fn().mockResolvedValue({ text: 'response 2' });

    // First call with one set of params
    const result1 = await middleware.wrapGenerate({
      doGenerate: mockDoGenerate1,
      params: {
        model: 'test-model',
        prompt: 'Hello',
        systemPrompt: 'System 1',
      },
    });

    expect(result1).toEqual({ text: 'response 1' });
    expect(mockDoGenerate1).toHaveBeenCalled();

    // Second call with different params
    const result2 = await middleware.wrapGenerate({
      doGenerate: mockDoGenerate2,
      params: {
        model: 'test-model',
        prompt: 'Hello',
        systemPrompt: 'System 2',
      },
    });

    // Should be different because params are different
    expect(result2).toEqual({ text: 'response 2' });
    expect(mockDoGenerate2).toHaveBeenCalled();
  });
});
