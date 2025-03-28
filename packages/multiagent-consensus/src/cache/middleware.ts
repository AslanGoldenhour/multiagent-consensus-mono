/**
 * Caching middleware for LLM providers.
 */
import { generateCacheKey } from './utils';
import { CacheConfig } from './types';
import { getCacheAdapter } from './adapters/factory';
import { LLMProvider } from '../types/provider';

/**
 * Response type returned by LLM providers
 */
type ProviderResponse = {
  text: string;
  model?: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
};

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

// Global telemetry object to track cache performance
const globalTelemetry: CacheTelemetry = {
  hits: 0,
  misses: 0,
  timeSaved: 0,
};

/**
 * Create a caching middleware function that intercepts provider calls
 * @param config The cache configuration
 * @returns A middleware object with provider wrapping and Vercel AI SDK support
 */
export function createCachingMiddleware(config: CacheConfig) {
  const adapter = config.enabled
    ? getCacheAdapter(config.adapter || 'memory', config.adapterOptions)
    : null;
  const ttl = config.ttl || 3600; // Default TTL of 1 hour

  // Function to wrap providers (existing functionality)
  function wrapProviderWithCaching(provider: LLMProvider): LLMProvider {
    // If caching is disabled, return a pass-through wrapper
    if (!config.enabled) {
      return provider; // Return provider as-is without wrapping
    }

    // Create a wrapped version of the provider
    const wrappedProvider: LLMProvider = {
      name: provider.name,
      supportedModels: provider.supportedModels,

      // Override the generateResponse method to include caching
      async generateResponse(
        model: string,
        prompt: string,
        options?: {
          temperature?: number;
          maxTokens?: number;
          systemMessage?: string;
          [key: string]: any;
        }
      ) {
        // Generate a cache key from the request parameters
        const cacheKey = generateCacheKey({
          provider: provider.name,
          model,
          prompt,
          options,
        });

        // If bypass is enabled, we'll still check the cache for metrics but won't use the cached result
        const bypassCache = config.bypass === true;

        // If bustCache is enabled, we'll ignore and replace any cached result
        const bustCache = config.bustCache === true;

        // Start timing the request
        const startTime = Date.now();

        // If not bypassing or busting the cache, check if we have a cached response
        if (!bypassCache && !bustCache && adapter) {
          try {
            const cachedValue = await adapter.get(cacheKey);

            if (cachedValue) {
              // We have a cache hit
              const processingTime = Date.now() - startTime;
              globalTelemetry.hits += 1;
              globalTelemetry.timeSaved += processingTime;

              // Parse the cached response
              const cachedResponse = JSON.parse(cachedValue);

              // Return the cached response
              return cachedResponse;
            }
          } catch (error) {
            // Log cache retrieval error but continue with the actual request
            console.warn(`Cache retrieval error: ${error}`);
          }
        }

        // No cache hit, or bypass/bustCache is enabled, so make the actual provider call
        globalTelemetry.misses += 1;
        const actualStartTime = Date.now();
        const response = await provider.generateResponse(model, prompt, options);
        const actualDuration = Date.now() - actualStartTime;

        // If not bypassing, cache the response
        if (!bypassCache && adapter) {
          try {
            // Store the response in the cache
            await adapter.set(cacheKey, JSON.stringify(response), ttl);
          } catch (error) {
            // Log cache storage error but don't fail the request
            console.warn(`Cache storage error: ${error}`);
          }
        }

        // Return the actual response
        return response;
      },
    };

    return wrappedProvider;
  }

  // Vercel AI SDK compatible middleware functions
  // These are used directly by the tests

  /**
   * Wraps a generate function with caching
   * This is compatible with Vercel AI SDK middleware pattern
   */
  async function wrapGenerate({
    doGenerate,
    params,
  }: {
    doGenerate: () => Promise<any>;
    params: any;
  }) {
    // If caching is disabled, directly call the generate function
    if (!config.enabled || !adapter) {
      return doGenerate();
    }

    // Generate cache key
    const cacheKey = generateCacheKey(params);

    // Check if we should bypass or bust the cache
    const bypassCache = config.bypass === true;
    const bustCache = config.bustCache === true;

    // Check for a cached value if we're not bypassing or busting the cache
    if (!bypassCache && !bustCache) {
      try {
        const startTime = Date.now();
        const cachedValue = await adapter.get(cacheKey);

        if (cachedValue) {
          // We have a cache hit, increment stats
          const processingTime = Date.now() - startTime;
          globalTelemetry.hits += 1;
          globalTelemetry.timeSaved += processingTime;

          // Handle both string and object cache values
          // If it's a string, try to parse it as JSON
          // If it's already an object, use it directly
          return typeof cachedValue === 'string' ? JSON.parse(cachedValue) : cachedValue;
        }
      } catch (error) {
        console.warn(`Cache retrieval error: ${error}`);
      }
    }

    // If we get here, it's a cache miss or we're bypassing/busting the cache
    globalTelemetry.misses += 1;

    // Call the actual generation function
    const response = await doGenerate();

    // Save to cache if appropriate
    if (!bypassCache && adapter) {
      try {
        await adapter.set(cacheKey, response, ttl);
      } catch (error) {
        console.warn(`Cache storage error: ${error}`);
      }
    }

    return response;
  }

  /**
   * Wraps a stream function with caching
   * This is compatible with Vercel AI SDK middleware pattern
   */
  async function wrapStream({ doStream, params }: { doStream: () => Promise<any>; params: any }) {
    // If caching is disabled, directly call the stream function
    if (!config.enabled || !adapter) {
      return doStream();
    }

    // Generate cache key with streaming flag
    const cacheKey = generateCacheKey({
      ...params,
      streaming: true,
    });

    // Check if we should bypass or bust the cache
    const bypassCache = config.bypass === true;
    const bustCache = config.bustCache === true;

    // If not bypassing or busting the cache, check if we have a cached response
    if (!bypassCache && !bustCache) {
      try {
        const startTime = Date.now();
        const cachedValue = await adapter.get(cacheKey);

        if (cachedValue) {
          // Cache hit - return cached value without calling doStream
          const processingTime = Date.now() - startTime;
          globalTelemetry.hits += 1;
          globalTelemetry.timeSaved += processingTime;

          // Handle both string and object cache values
          return typeof cachedValue === 'string' ? JSON.parse(cachedValue) : cachedValue;
        }
      } catch (error) {
        console.warn(`Cache retrieval error: ${error}`);
      }
    }

    // Cache miss, bypass, or error - generate stream response
    globalTelemetry.misses += 1;
    const response = await doStream();

    // Cache response (unless bypassing)
    if (!bypassCache && adapter) {
      try {
        await adapter.set(cacheKey, response, ttl);
      } catch (error) {
        console.warn(`Cache storage error: ${error}`);
      }
    }

    return response;
  }

  // Return object with all middleware functions
  return {
    wrapProviderWithCaching,
    wrapGenerate,
    wrapStream,
  };
}

/**
 * Gets the telemetry data from the caching middleware
 * @returns The telemetry data
 */
export function getCacheTelemetry(): CacheTelemetry {
  // Return a copy of the telemetry data
  return { ...globalTelemetry };
}
