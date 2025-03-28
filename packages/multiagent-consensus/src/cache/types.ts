/**
 * Type definitions for the caching system.
 */

/**
 * Interface for cache adapters.
 * Provides basic operations for interacting with a cache.
 */
export interface CacheAdapter {
  /**
   * Retrieves a value from the cache.
   * @param key - The cache key to retrieve.
   * @returns The cached value, or null if not found.
   */
  get(key: string): Promise<any | null>;

  /**
   * Stores a value in the cache.
   * @param key - The cache key to store.
   * @param value - The value to store.
   * @param ttl - Optional time-to-live in seconds.
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * Deletes a value from the cache.
   * @param key - The cache key to delete.
   */
  delete(key: string): Promise<void>;

  /**
   * Clears all values from the cache.
   */
  clear(): Promise<void>;
}

/**
 * Type for cache adapter factory functions.
 * Used to create cache adapters with specific options.
 */
export type CacheAdapterFactory = (options?: CacheAdapterOptions) => CacheAdapter;

/**
 * Built-in adapter types supported by the caching system.
 */
export type BuiltInCacheAdapterType = 'memory' | 'redis' | 'file';

/**
 * Options for cache adapters.
 */
export interface CacheAdapterOptions {
  /**
   * Maximum size for the cache (if applicable).
   */
  maxSize?: number;

  /**
   * Default TTL (time-to-live) in seconds.
   */
  defaultTtl?: number;

  /**
   * Additional adapter-specific options.
   */
  [key: string]: any;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /**
   * Whether caching is enabled
   */
  enabled: boolean;

  /**
   * Cache adapter to use
   * - memory: In-memory cache (default)
   * - file: File-based cache
   * - redis: Redis-based cache
   */
  adapter: 'memory' | 'file' | 'redis';

  /**
   * Cache time-to-live in seconds
   * Default: 3600 (1 hour)
   */
  ttl: number;

  /**
   * Whether to bypass the cache for this request
   * When true, the cache will be checked but not used, and the result will not be cached
   * Useful for getting fresh responses while still recording metrics
   */
  bypass?: boolean;

  /**
   * Whether to force a fresh response by ignoring and replacing any cached result
   * When true, existing cache entries will be invalidated and replaced with new responses
   * Useful for refreshing cached data
   */
  bustCache?: boolean;

  /**
   * Adapter-specific options
   */
  adapterOptions?: {
    /**
     * File adapter options
     */
    file?: {
      /**
       * Directory to store cache files
       * Default: ./cache
       */
      cacheDir?: string;

      /**
       * Whether to create cache directory if it doesn't exist
       * Default: true
       */
      createDirIfNotExists?: boolean;

      /**
       * How frequently to check for and clean expired cache entries (in ms)
       * Default: 3600000 (1 hour)
       */
      cleanupInterval?: number;
    };

    /**
     * Redis adapter options
     */
    redis?: {
      /**
       * Redis connection URL
       * Required if using REDIS_URL environment variable is not set
       */
      url?: string;

      /**
       * Redis token for authentication
       * Required if using REDIS_TOKEN environment variable is not set and URL doesn't include auth
       */
      token?: string;

      /**
       * Prefix for Redis keys
       * Default: multiagent:cache:
       */
      prefix?: string;
    };
  };
}

/**
 * Options used to generate a cache key.
 */
export interface CacheKeyOptions {
  /**
   * List of model identifiers.
   */
  models: string[];

  /**
   * The prompt text.
   */
  prompt: string;

  /**
   * Optional system prompt.
   */
  systemPrompt?: string;

  /**
   * Temperature setting for the model.
   */
  temperature?: number;

  /**
   * Maximum tokens to generate.
   */
  maxTokens?: number;

  /**
   * Top-p sampling value.
   */
  topP?: number;

  /**
   * Frequency penalty.
   */
  frequencyPenalty?: number;

  /**
   * Presence penalty.
   */
  presencePenalty?: number;

  /**
   * Whether to stream the response.
   */
  streaming?: boolean;

  /**
   * Additional parameters that affect responses.
   */
  [key: string]: any;
}
