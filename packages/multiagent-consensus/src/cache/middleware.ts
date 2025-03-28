/**
 * Caching middleware for the Vercel AI SDK.
 */
import type { LanguageModelV1Middleware } from 'ai';
import { generateCacheKey } from './utils';
import { CacheAdapter, CacheConfig } from './types';
import { getCacheAdapter } from './adapters/factory';

/**
 * Interface for telemetry data collected by the caching middleware.
 */
export interface CacheTelemetry {
  /** Number of cache hits (responses served from cache) */
  hits: number;
  /** Number of cache misses (responses generated from models) */
  misses: number;
  /** Total response time saved due to cache hits (ms) */
  timeSaved: number;
}

/**
 * Creates a caching middleware for the Vercel AI SDK.
 * This middleware intercepts requests to language models and caches responses.
 * @param config The cache configuration.
 * @returns A middleware for the Vercel AI SDK.
 */
export function createCachingMiddleware(config: CacheConfig): LanguageModelV1Middleware {
  // If caching is disabled, return a pass-through middleware
  if (!config.enabled) {
    return {
      wrapGenerate: async ({ doGenerate }) => doGenerate(),
      wrapStream: async ({ doStream }) => doStream(),
    };
  }

  // Initialize the cache adapter
  const adapter = getCacheAdapter(config.adapter, config.adapterOptions);

  // Initialize telemetry
  const telemetry: CacheTelemetry = {
    hits: 0,
    misses: 0,
    timeSaved: 0,
  };

  return {
    /**
     * Middleware for non-streaming completions.
     */
    wrapGenerate: async ({ doGenerate, params }) => {
      try {
        // Create a simple cache key from the stringified parameters
        // This handles any parameter structure without relying on specific properties
        const cacheKey = generateCacheKey(params);

        // Try to get the response from cache
        const cachedResponse = await adapter.get(cacheKey);

        if (cachedResponse) {
          // Cache hit
          telemetry.hits += 1;
          telemetry.timeSaved += 500; // Estimate time saved
          return cachedResponse;
        }

        // Cache miss - generate response
        telemetry.misses += 1;
        const startTime = Date.now();
        const response = await doGenerate();

        // Store in cache with configured TTL
        await adapter.set(cacheKey, response, config.ttl);

        return response;
      } catch (error) {
        // If caching fails for any reason, fall back to direct generation
        console.warn('Caching middleware encountered an error:', error);
        return doGenerate();
      }
    },

    /**
     * Middleware for streaming completions.
     */
    wrapStream: async ({ doStream, params }) => {
      try {
        // Create a simple cache key from the stringified parameters
        const cacheKey = generateCacheKey(params);

        // Try to get the response from cache
        const cachedResponse = await adapter.get(cacheKey);

        if (cachedResponse) {
          // Cache hit
          telemetry.hits += 1;
          telemetry.timeSaved += 1000; // Streaming typically takes longer
          return cachedResponse;
        }

        // Cache miss - generate streaming response
        telemetry.misses += 1;
        const response = await doStream();

        // For streaming, we store the stream controller in the cache
        await adapter.set(cacheKey, response, config.ttl);

        return response;
      } catch (error) {
        // If caching fails for any reason, fall back to direct streaming
        console.warn('Caching middleware encountered an error:', error);
        return doStream();
      }
    },
  };
}

/**
 * Gets the telemetry data from a caching middleware.
 * @param middleware The caching middleware.
 * @returns The telemetry data, or null if the middleware doesn't collect telemetry.
 */
export function getCacheTelemetry(_middleware: LanguageModelV1Middleware): CacheTelemetry | null {
  // In a real implementation, we would need a way to access the telemetry data
  return null;
}
