/**
 * Simple Cache Demonstration
 *
 * This script focuses on demonstrating the cache system without requiring real API calls.
 */

// Import required modules
require('dotenv').config();
const { MemoryCacheAdapter } = require('../../../dist/cache/adapters');
const { generateCacheKey } = require('../../../dist/cache/utils');

// Create a logging memory adapter
class LoggingMemoryAdapter extends MemoryCacheAdapter {
  constructor() {
    super();
    this.hitCount = 0;
    this.missCount = 0;
  }

  async get(key) {
    const value = await super.get(key);
    if (value) {
      this.hitCount++;
      console.log(`✅ CACHE HIT: Key "${key.substring(0, 20)}..." found in cache`);
    } else {
      this.missCount++;
      console.log(`❌ CACHE MISS: Key "${key.substring(0, 20)}..." not found in cache`);
    }
    return value;
  }

  async set(key, value, ttl) {
    console.log(`📝 CACHE WRITE: Storing value for key "${key.substring(0, 20)}..."`);
    return super.set(key, value, ttl);
  }

  getStats() {
    return {
      hits: this.hitCount,
      misses: this.missCount,
      size: this.size,
    };
  }
}

// Main function to demonstrate caching
async function demonstrateCaching() {
  console.log('=== CACHE SYSTEM DEMONSTRATION ===\n');

  // Create cache adapter
  const cache = new LoggingMemoryAdapter();
  console.log('Memory cache adapter initialized\n');

  // Create some test parameters
  const params1 = {
    models: ['gpt-3.5-turbo', 'claude-3-haiku'],
    prompt: 'What is the capital of France?',
    temperature: 0.7,
  };

  const params2 = {
    models: ['claude-3-haiku', 'gpt-3.5-turbo'], // Same models, different order
    prompt: 'What is the capital of France?',
    temperature: 0.7,
  };

  const params3 = {
    models: ['gpt-3.5-turbo', 'claude-3-haiku'],
    prompt: 'What is the capital of Japan?', // Different prompt
    temperature: 0.7,
  };

  // Generate cache keys
  console.log('Generating cache keys...');
  const key1 = generateCacheKey(params1);
  const key2 = generateCacheKey(params2);
  const key3 = generateCacheKey(params3);

  console.log(`Key 1: ${key1.substring(0, 50)}...`);
  console.log(`Key 2: ${key2.substring(0, 50)}...`);
  console.log(`Key 3: ${key3.substring(0, 50)}...`);

  // Demonstrate that sorting works (keys 1 and 2 should be identical)
  console.log(`\nAre key1 and key2 identical? ${key1 === key2 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Are key1 and key3 identical? ${key1 === key3 ? 'YES' : 'NO ✅'}`);

  // First cache operations - should be misses
  console.log('\n=== FIRST ROUND (All Cache Misses) ===');
  console.log('Checking cache for all keys (should be misses)...');
  await cache.get(key1);
  await cache.get(key2);
  await cache.get(key3);

  // Store values in cache
  console.log('\nStoring values in cache...');
  await cache.set(key1, 'Paris is the capital of France', 3600);
  await cache.set(key3, 'Tokyo is the capital of Japan', 3600);

  // Second cache operations - should be hits for keys 1, 2 and miss for key 3
  console.log('\n=== SECOND ROUND (Some Cache Hits) ===');
  console.log('Checking cache again...');
  const value1 = await cache.get(key1);
  const value2 = await cache.get(key2);
  const value3 = await cache.get(key3);

  console.log(`\nValue 1: "${value1}"`);
  console.log(`Value 2: "${value2}"`);
  console.log(`Value 3: "${value3}"`);

  // Clear the cache
  console.log('\n=== CLEARING CACHE ===');
  await cache.clear();
  console.log('Cache cleared');

  // Third cache operations - should be misses again
  console.log('\n=== THIRD ROUND (All Cache Misses Again) ===');
  console.log('Checking cache after clearing...');
  await cache.get(key1);
  await cache.get(key2);
  await cache.get(key3);

  // Show final statistics
  const stats = cache.getStats();
  console.log('\n=== CACHE STATISTICS ===');
  console.log(`Cache Hits: ${stats.hits}`);
  console.log(`Cache Misses: ${stats.misses}`);
  console.log(`Current Cache Size: ${stats.size}`);
}

// Run the demonstration
demonstrateCaching().catch(console.error);
