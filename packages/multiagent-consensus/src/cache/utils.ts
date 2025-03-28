/**
 * Utility functions for the caching system.
 */
import { CacheKeyOptions } from './types';

/**
 * Sorts an object's entries to ensure consistent serialization.
 * @param obj The object to sort.
 * @returns A new object with sorted entries.
 */
export function sortObjectEntries<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};

  for (const key of sortedKeys) {
    const value = obj[key];

    // Recursively sort nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sortObjectEntries(value);
    } else if (Array.isArray(value)) {
      // Sort array contents if they're objects
      result[key] = value.map(item =>
        item && typeof item === 'object' ? sortObjectEntries(item) : item
      );
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Generates a deterministic cache key from request parameters.
 * @param options The options to generate a key from.
 * @returns A string key for caching.
 */
export function generateCacheKey(options: CacheKeyOptions | Record<string, any>): string {
  // Filter out undefined values and empty strings
  const filteredOptions = Object.entries(options).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>
  );

  // Sort the object to ensure consistent serialization
  const sortedOptions = sortObjectEntries(filteredOptions);

  // Normalize arrays if present (e.g., sort model names)
  if (Array.isArray(sortedOptions.models)) {
    sortedOptions.models = [...sortedOptions.models].sort();
  }

  // Create a deterministic JSON string
  return JSON.stringify(sortedOptions);
}

/**
 * Creates a consistent hash from a string.
 * Useful for shortening long cache keys.
 * @param str The string to hash.
 * @returns A hash string.
 */
export function createHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString(16);

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString(16);
}
