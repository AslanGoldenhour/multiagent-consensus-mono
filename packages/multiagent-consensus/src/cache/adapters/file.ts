/**
 * File-based cache adapter implementation.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CacheAdapter, CacheAdapterOptions } from '../types';

/**
 * Interface for file cache entry structure.
 */
interface FileCacheEntry {
  /** The stored value */
  value: any;
  /** Expiration timestamp in milliseconds, or null for no expiry */
  expiry: number | null;
  /** Creation timestamp */
  created: number;
}

/**
 * Options specific to the file cache adapter.
 */
export interface FileCacheAdapterOptions extends CacheAdapterOptions {
  /** Directory where cache files will be stored */
  cacheDir?: string;

  /** Whether to create the cache directory if it doesn't exist */
  createDirIfNotExists?: boolean;

  /** Maximum age of expired cache files to keep before cleanup (in seconds) */
  maxAge?: number;
}

/**
 * File-based cache adapter implementation.
 * Stores cache entries as JSON files.
 */
export class FileCacheAdapter implements CacheAdapter {
  private options: Required<
    Pick<FileCacheAdapterOptions, 'cacheDir' | 'defaultTtl' | 'maxAge' | 'createDirIfNotExists'>
  >;
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new FileCacheAdapter instance.
   * @param options Configuration options for the adapter.
   */
  constructor(options?: FileCacheAdapterOptions) {
    this.options = {
      cacheDir: options?.cacheDir ?? path.join(process.cwd(), '.cache'),
      defaultTtl: options?.defaultTtl ?? 3600, // Default: 1 hour
      maxAge: options?.maxAge ?? 86400, // Default: 1 day
      createDirIfNotExists: options?.createDirIfNotExists ?? true,
    };

    this.ensureCacheDir();
    this.startCleanupInterval();
  }

  /**
   * Ensures the cache directory exists.
   * @private
   */
  private ensureCacheDir(): void {
    try {
      if (this.options.createDirIfNotExists && !fs.existsSync(this.options.cacheDir)) {
        fs.mkdirSync(this.options.cacheDir, { recursive: true });
      } else if (!fs.existsSync(this.options.cacheDir)) {
        throw new Error(`Cache directory does not exist: ${this.options.cacheDir}`);
      }
    } catch (error) {
      console.error('Error ensuring cache directory exists:', error);
    }
  }

  /**
   * Gets the filesystem path for a cache key.
   * @param key The cache key.
   * @returns The filesystem path.
   * @private
   */
  private getFilePath(key: string): string {
    // Create a deterministic filename from the key
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return path.join(this.options.cacheDir, `${hash}.json`);
  }

  /**
   * Retrieves a value from the cache.
   * @param key The cache key to retrieve.
   * @returns The cached value, or null if not found or expired.
   */
  async get(key: string): Promise<any | null> {
    try {
      const filePath = this.getFilePath(key);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return null;
      }

      // Read and parse the file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const entry: FileCacheEntry = JSON.parse(fileContent);

      // Check if the entry has expired
      if (entry.expiry !== null && entry.expiry < Date.now()) {
        // Delete the expired file asynchronously
        fs.promises.unlink(filePath).catch(err => {
          console.error(`Error deleting expired cache file: ${filePath}`, err);
        });
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('Error retrieving from file cache:', error);
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
      const filePath = this.getFilePath(key);
      const effectiveTtl = ttl ?? this.options.defaultTtl;
      const expiry = effectiveTtl > 0 ? Date.now() + effectiveTtl * 1000 : null;

      const entry: FileCacheEntry = {
        value,
        expiry,
        created: Date.now(),
      };

      // Write to a temporary file first, then rename for atomicity
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(entry), 'utf8');
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      console.error('Error storing in file cache:', error);
    }
  }

  /**
   * Deletes a value from the cache.
   * @param key The cache key to delete.
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting from file cache:', error);
    }
  }

  /**
   * Clears all values from the cache.
   */
  async clear(): Promise<void> {
    try {
      const cacheDir = this.options.cacheDir;
      if (!fs.existsSync(cacheDir)) {
        return;
      }

      const files = fs.readdirSync(cacheDir);
      for (const file of files) {
        if (file.endsWith('.json') || file.endsWith('.tmp')) {
          const filePath = path.join(cacheDir, file);
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Error clearing file cache:', error);
    }
  }

  /**
   * Cleans up expired cache entries.
   * @private
   */
  private cleanupExpired(): void {
    try {
      const cacheDir = this.options.cacheDir;
      if (!fs.existsSync(cacheDir)) {
        return;
      }

      const now = Date.now();
      const files = fs.readdirSync(cacheDir);

      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }

        const filePath = path.join(cacheDir, file);
        try {
          const stats = fs.statSync(filePath);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const entry: FileCacheEntry = JSON.parse(fileContent);

          // Check if the entry has expired
          if (entry.expiry !== null && entry.expiry < now) {
            // Also check if the file is older than maxAge
            const fileAge = now - stats.mtimeMs;
            const maxAgeMs = this.options.maxAge * 1000;

            if (fileAge > maxAgeMs) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (err) {
          // If we can't read/parse the file, it may be corrupted, so delete it
          console.error(`Error reading cache file ${filePath}, deleting it:`, err);
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkErr) {
            console.error(`Failed to delete corrupted cache file ${filePath}:`, unlinkErr);
          }
        }
      }
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  /**
   * Starts the periodic cleanup of expired entries.
   * @private
   */
  private startCleanupInterval(): void {
    // Check for expired entries every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 3600000); // 1 hour
  }

  /**
   * Cleans up resources used by the adapter.
   * Should be called when the adapter is no longer needed.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
