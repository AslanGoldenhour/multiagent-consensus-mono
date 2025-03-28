/**
 * Redis Cache Example
 * ==================
 *
 * This example demonstrates how to use the Upstash Redis adapter for distributed caching
 * with the multiagent-consensus package. Distributed caching allows multiple instances
 * of your application to share the same cache, which is essential for production
 * environments, serverless functions, and horizontally scaled applications.
 *
 * Benefits of Redis caching:
 * - Shared cache across multiple processes/servers
 * - Persistence of cached data
 * - Configurable TTL (time-to-live)
 * - Improved performance for repeated queries
 *
 * Prerequisites:
 * - Upstash Redis account and database (https://upstash.com/)
 * - Redis URL and token from your Upstash dashboard
 * - .env.local file with credentials at the monorepo root
 */

// Import required dependencies
const path = require('path');
const dotenv = require('dotenv');
const { ConsensusEngine } = require('multiagent-consensus');

// Get the monorepo root directory and load .env.local
const monorepoRoot = path.resolve(__dirname, '../../../');
dotenv.config({
  path: path.join(monorepoRoot, '.env.local'),
  override: true,
});

// ============================
// Environment Setup & Validation
// ============================

console.log('🔑 Checking environment configuration...');

// Validate Redis configuration
if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
  console.error('❌ Error: REDIS_URL and REDIS_TOKEN environment variables must be set.');
  console.error('Please make sure these are in your .env.local file at the repository root:');
  console.error('REDIS_URL=https://your-upstash-redis-url');
  console.error('REDIS_TOKEN=your-upstash-redis-token');
  console.error('REDIS_PREFIX=consensus: (optional)');
  process.exit(1);
}

// Validate API keys (in a real application, at least one is needed)
if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  Warning: No API keys detected for LLM providers.');
  console.warn('This example will run with mock providers for demonstration purposes.');
}

console.log('✅ Redis configuration found:');
console.log(`   URL: ${process.env.REDIS_URL.substring(0, 20)}...`);
console.log(`   Token: ${process.env.REDIS_TOKEN.substring(0, 5)}...`);
console.log(`   Prefix: ${process.env.REDIS_PREFIX || 'consensus:'}`);

// ============================
// Engine Configuration
// ============================

console.log('\n🔧 Configuring consensus engine with Redis caching...');

// Create a consensus engine with Redis caching enabled
const engine = new ConsensusEngine({
  // LLM Configuration
  models: ['gpt-3.5-turbo', 'claude-3-haiku'],
  consensusMethod: 'majority',
  maxRounds: 2,

  // Cache Configuration
  cache: {
    enabled: true, // Enable caching
    adapter: 'redis', // Use Redis adapter (instead of default 'memory')
    ttl: 3600, // Cache TTL: 1 hour in seconds

    // Redis-specific options
    adapterOptions: {
      // These will fall back to environment variables if not specified:
      // url: process.env.REDIS_URL,
      // token: process.env.REDIS_TOKEN,

      prefix: 'example:', // Key prefix (helps with namespacing)
      defaultTtl: 7200, // Default TTL: 2 hours in seconds
    },
  },
});

// ============================
// Helper Functions
// ============================

/**
 * Run a query through the consensus engine and display results.
 * @param {string} query - The query to process
 * @returns {Promise<object>} - The consensus result
 */
async function runQuery(query) {
  console.log(`\n📝 Query: "${query}"`);
  console.time('⏱️ Response time');

  try {
    const result = await engine.run(query);
    console.timeEnd('⏱️ Response time');

    console.log('🤖 Answer:', result.answer);

    // Display cache information
    if (result.metadata.cachingEnabled) {
      console.log('\n📊 Cache Statistics:');
      console.log(`   Status: ${result.metadata.cachingEnabled ? 'Enabled' : 'Disabled'}`);

      if (result.metadata.cacheStats) {
        const { hits, misses, timeSaved } = result.metadata.cacheStats;
        console.log(`   Hits: ${hits}`);
        console.log(`   Misses: ${misses}`);
        console.log(`   Time saved: ${timeSaved}ms`);

        // Calculate hit rate if there were any requests
        const total = hits + misses;
        if (total > 0) {
          const hitRate = (hits / total) * 100;
          console.log(`   Hit rate: ${hitRate.toFixed(1)}%`);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    return null;
  }
}

/**
 * Demonstrates advanced cache operations using the cache adapter directly.
 */
async function demonstrateCacheOperations() {
  console.log('\n🧰 Manual Cache Operations:');

  if (!engine.cache) {
    console.log('❌ Cache adapter not available.');
    return;
  }

  try {
    // 1. Store a custom value
    console.log('\n1️⃣ Storing a custom value...');
    await engine.cache.set('custom-key', {
      message: 'This is a manually cached value',
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Value stored successfully.');

    // 2. Retrieve the value
    console.log('\n2️⃣ Retrieving custom value...');
    const value = await engine.cache.get('custom-key');

    if (value) {
      console.log('✅ Retrieved value:');
      console.log(value);
    } else {
      console.log('❌ Value not found in cache.');
    }

    // 3. Delete specific key
    console.log('\n3️⃣ Deleting custom key...');
    await engine.cache.delete('custom-key');
    console.log('✅ Key deleted.');

    // 4. Verify deletion
    const checkValue = await engine.cache.get('custom-key');
    console.log(
      'Value after deletion:',
      checkValue === null ? 'null (correctly deleted)' : 'still exists (error)'
    );

    console.log('\n💡 Additional operations:');
    console.log('• To clear all cache entries with the configured prefix:');
    console.log('  await engine.cache.clear();');
  } catch (error) {
    console.error('❌ Error during cache operations:', error);
  }
}

// ============================
// Main Demonstration
// ============================

async function runDemonstration() {
  console.log('\n🚀 REDIS CACHE DEMONSTRATION');
  console.log('==============================');

  try {
    // First query - should be a cache miss
    console.log('\n🔍 STEP 1: First query (should be a cache miss)');
    await runQuery('What is the capital of France?');

    // Same query again - should be a cache hit
    console.log('\n🔍 STEP 2: Same query again (should be a cache hit)');
    await runQuery('What is the capital of France?');

    // Different query - should be a cache miss
    console.log('\n🔍 STEP 3: Different query (should be a cache miss)');
    await runQuery('What is the capital of Japan?');

    // Same second query - should be a cache hit
    console.log('\n🔍 STEP 4: Repeating the second query (should be a cache hit)');
    await runQuery('What is the capital of Japan?');

    // Demonstrate manual cache operations
    console.log('\n🔍 STEP 5: Advanced cache operations');
    await demonstrateCacheOperations();

    console.log('\n✨ Demonstration completed successfully!');
    console.log('Redis caching is now configured and working properly.');
  } catch (error) {
    console.error('\n❌ Demonstration error:', error);
  }
}

// Run the demonstration
runDemonstration().catch(console.error);
