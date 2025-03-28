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
 * Configuration for the caching system.
 */
export interface CacheConfig {
  /**
   * Whether caching is enabled.
   */
  enabled: boolean;

  /**
   * The cache adapter to use.
   * Can be a string identifier for built-in adapters, or a custom adapter instance.
   */
  adapter?: BuiltInCacheAdapterType | CacheAdapter;

  /**
   * Default TTL (time-to-live) in seconds for cached items.
   */
  ttl?: number;

  /**
   * Options for the adapter.
   */
  adapterOptions?: CacheAdapterOptions;
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
