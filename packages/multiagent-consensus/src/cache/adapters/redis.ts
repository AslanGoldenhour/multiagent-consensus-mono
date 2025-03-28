/**
 * Redis cache adapter implementation using Upstash.
 */
import { Redis } from '@upstash/redis';
import { CacheAdapter, CacheAdapterOptions } from '../types';

/**
 * Options specific to the Redis cache adapter.
 */
export interface RedisCacheAdapterOptions extends CacheAdapterOptions {
  /** Redis URL (including protocol, host, and port) */
  url?: string;

  /** Authentication token for Redis */
  token?: string;

  /** Prefix for cache keys to avoid collisions with other applications */
  prefix?: string;
}

/**
 * Redis cache adapter implementation using Upstash Redis.
 * Provides a Redis-backed implementation of the CacheAdapter interface.
 */
export class RedisCacheAdapter implements CacheAdapter {
  private redis: Redis;
  private options: Required<Pick<RedisCacheAdapterOptions, 'defaultTtl' | 'prefix'>>;

  /**
   * Creates a new RedisCacheAdapter instance.
   * @param options Configuration options for the adapter.
   */
  constructor(options?: RedisCacheAdapterOptions) {
    // Initialize Redis client from options or environment variables
    this.redis = new Redis({
      url: options?.url || process.env.REDIS_URL || '',
      token: options?.token || process.env.REDIS_TOKEN || '',
    });

    this.options = {
      defaultTtl: options?.defaultTtl ?? 3600, // Default: 1 hour
      prefix: options?.prefix ?? process.env.REDIS_PREFIX ?? 'consensus:',
    };
  }

  /**
   * Generates a prefixed key to avoid collisions with other applications.
   * @param key The original cache key.
   * @returns A prefixed key for use with Redis.
   * @private
   */
  private getPrefixedKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }

  /**
   * Retrieves a value from the cache.
   * @param key The cache key to retrieve.
   * @returns The cached value, or null if not found.
   */
  async get(key: string): Promise<any | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const value = await this.redis.get(prefixedKey);
      return value === null ? null : JSON.parse(String(value));
    } catch (error) {
      console.error('Error retrieving from Redis cache:', error);
      return null;
    }
  }

  /**
   * Stores a value in the cache.
   * @param key The cache key to store.
   * @param value The value to store.
   * @param ttl Optional time-to-live in seconds. Uses the default if not specified.
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const effectiveTtl = ttl ?? this.options.defaultTtl;
      const serializedValue = JSON.stringify(value);

      if (effectiveTtl > 0) {
        // Set with expiration
        await this.redis.set(prefixedKey, serializedValue, { ex: effectiveTtl });
      } else {
        // Set without expiration
        await this.redis.set(prefixedKey, serializedValue);
      }
    } catch (error) {
      console.error('Error storing in Redis cache:', error);
    }
  }

  /**
   * Deletes a value from the cache.
   * @param key The cache key to delete.
   */
  async delete(key: string): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      await this.redis.del(prefixedKey);
    } catch (error) {
      console.error('Error deleting from Redis cache:', error);
    }
  }

  /**
   * Clears all values from the cache with the configured prefix.
   * Note: This uses the Redis SCAN command to find and delete keys,
   * which may not be atomic for very large datasets.
   */
  async clear(): Promise<void> {
    try {
      const prefix = this.options.prefix;
      let cursor = 0;
      let keys: string[] = [];

      // Use SCAN to find all keys with the prefix
      do {
        const result = await this.redis.scan(cursor, { match: `${prefix}*`, count: 100 });
        cursor = Number(result[0]); // Ensure cursor is a number
        keys = keys.concat(result[1] as string[]);
      } while (cursor !== 0);

      // Delete all found keys if there are any
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing Redis cache:', error);
    }
  }
}
