/**
 * Simple caching demonstration
 * This script makes it very clear when the cache is being used
 */

// For CommonJS
require('dotenv').config();
const { ConsensusEngine } = require('../dist');
const { MemoryCacheAdapter } = require('../dist/cache/adapters');

// Create a special adapter with logging
class LoggingMemoryAdapter extends MemoryCacheAdapter {
  async get(key) {
    const value = await super.get(key);
    console.log(`🔍 Cache lookup for key: ${key.substring(0, 30)}...`);
    console.log(`🔎 Cache ${value ? 'HIT ✅' : 'MISS ❌'}`);
    return value;
  }

  async set(key, value, ttl) {
    console.log(`💾 Saving to cache: ${key.substring(0, 30)}...`);
    return super.set(key, value, ttl);
  }
}

// Create a custom engine with the logging adapter
const adapter = new LoggingMemoryAdapter();
const engine = new ConsensusEngine({
  models: ['gpt-3.5-turbo', 'claude-3-haiku'],
  consensusMethod: 'majority',
  cache: {
    enabled: true,
    adapter: adapter,
    ttl: 3600,
  },
});

// Function to run queries with timing
async function runQuery(query) {
  console.log(`\n📝 Running query: "${query}"`);
  console.time('⏱️ Response time');

  try {
    const result = await engine.run(query);
    console.timeEnd('⏱️ Response time');
    console.log(`✨ Answer: ${result.answer.substring(0, 50)}...`);
    return result;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Main function to demonstrate caching
async function demonstrateCaching() {
  console.log('=== 🚀 CACHING DEMONSTRATION ===');

  // First query - should be a cache miss
  console.log('\n🔄 First query (should be a cache miss):');
  await runQuery('What is the capital of France?');

  // Same query again - should be a cache hit
  console.log('\n🔄 Same query again (should be a cache hit):');
  await runQuery('What is the capital of France?');

  // Different query - should be a cache miss
  console.log('\n🔄 Different query (should be a cache miss):');
  await runQuery('What is the capital of Japan?');

  // Same query again - should be a cache hit
  console.log('\n🔄 Same query again (should be a cache hit):');
  await runQuery('What is the capital of Japan?');

  // Show cache statistics
  console.log('\n📊 Cache size:', adapter.size);

  // Clear the cache
  console.log('\n🧹 Clearing cache...');
  await adapter.clear();
  console.log('✅ Cache cleared');

  // Run after clearing - should be a miss
  console.log('\n🔄 After clearing cache (should be a miss):');
  await runQuery('What is the capital of France?');
}

// Run the demonstration
demonstrateCaching().catch(console.error);
