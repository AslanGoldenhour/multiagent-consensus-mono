/**
 * In-memory cache adapter implementation.
 */
import { CacheAdapter, CacheAdapterOptions } from '../types';

interface CacheEntry {
  value: any;
  expiry: number | null; // Timestamp in ms, or null for no expiry
}

/**
 * In-memory cache adapter implementation.
 * Stores cache entries in a Map in memory.
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, CacheEntry>;
  private options: Required<Pick<CacheAdapterOptions, 'maxSize' | 'defaultTtl'>>;
  private expiryCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new MemoryCacheAdapter instance.
   * @param options Configuration options for the adapter.
   */
  constructor(options?: CacheAdapterOptions) {
    this.cache = new Map<string, CacheEntry>();
    this.options = {
      maxSize: options?.maxSize ?? 1000,
      defaultTtl: options?.defaultTtl ?? 3600, // Default: 1 hour
    };

    // Set up automatic expiry check
    this.startExpiryCheck();
  }

  /**
   * Retrieves a value from the cache.
   * @param key The cache key to retrieve.
   * @returns The cached value, or null if not found or expired.
   */
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if the entry has expired
    if (entry.expiry !== null && entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Stores a value in the cache.
   * @param key The cache key to store.
   * @param value The value to store.
   * @param ttl Optional time-to-live in seconds. Uses the default if not specified.
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const effectiveTtl = ttl ?? this.options.defaultTtl;
    const expiry = effectiveTtl > 0 ? Date.now() + effectiveTtl * 1000 : null;

    this.cache.set(key, { value, expiry });

    // Ensure we don't exceed max size
    if (this.options.maxSize > 0 && this.cache.size > this.options.maxSize) {
      this.evictOldest();
    }
  }

  /**
   * Deletes a value from the cache.
   * @param key The cache key to delete.
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clears all values from the cache.
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Cleans up resources used by the adapter.
   * Should be called when the adapter is no longer needed.
   */
  destroy(): void {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
      this.expiryCheckInterval = null;
    }
  }

  /**
   * Gets the current size of the cache.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Evicts the oldest entries from the cache when it exceeds maxSize.
   * Uses a simple LRU-like approach by removing entries from the beginning of the Map.
   * @private
   */
  private evictOldest(): void {
    // Maps maintain insertion order, so the first entries are the oldest
    const keysIterator = this.cache.keys();
    const oldestKey = keysIterator.next().value;

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Starts a periodic check for expired entries.
   * @private
   */
  private startExpiryCheck(): void {
    // Check for expired entries every minute
    this.expiryCheckInterval = setInterval(() => {
      const now = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiry !== null && entry.expiry < now) {
          this.cache.delete(key);
        }
      }
    }, 60000); // 1 minute
  }
}
