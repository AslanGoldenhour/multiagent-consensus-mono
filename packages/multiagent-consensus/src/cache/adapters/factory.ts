/**
 * Factory functions for creating cache adapters.
 */
import { CacheAdapter, CacheAdapterOptions, BuiltInCacheAdapterType } from '../types';
import { MemoryCacheAdapter } from './memory';

/**
 * Creates a cache adapter based on the specified type.
 * @param type The type of adapter to create.
 * @param options Options for the adapter.
 * @returns A cache adapter instance.
 * @throws Error if the adapter type is not supported.
 */
export function createCacheAdapter(
  type: BuiltInCacheAdapterType,
  options?: CacheAdapterOptions
): CacheAdapter {
  switch (type) {
    case 'memory':
      return new MemoryCacheAdapter(options);

    case 'file':
      // This would be implemented when needed
      throw new Error('File cache adapter not yet implemented');

    case 'redis':
      // This would be implemented when needed
      throw new Error('Redis cache adapter not yet implemented');

    default:
      throw new Error(`Unsupported cache adapter type: ${type}`);
  }
}

/**
 * Gets a cache adapter based on configuration.
 * @param adapterConfig The adapter configuration, which can be a string type or a custom adapter.
 * @param options Options for built-in adapters.
 * @returns A cache adapter instance.
 */
export function getCacheAdapter(
  adapterConfig: BuiltInCacheAdapterType | CacheAdapter | undefined,
  options?: CacheAdapterOptions
): CacheAdapter {
  // If adapterConfig is not specified, default to memory
  if (!adapterConfig) {
    return createCacheAdapter('memory', options);
  }

  // If adapterConfig is already a CacheAdapter instance, return it
  if (typeof adapterConfig !== 'string') {
    return adapterConfig;
  }

  // Otherwise, create an adapter based on the type
  return createCacheAdapter(adapterConfig, options);
}
