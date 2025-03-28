/**
 * In-Memory Cache Example
 * ======================
 *
 * This example demonstrates how to use the built-in in-memory caching system
 * with the multiagent-consensus package. In-memory caching is perfect for:
 * - Development and testing environments
 * - Single-server deployments
 * - Reducing API costs by avoiding redundant LLM calls
 * - Improving response times for repeated queries
 *
 * The in-memory adapter is the default cache adapter and is ideal for
 * getting started quickly without additional infrastructure.
 */

// We use CommonJS for compatibility with both Node.js and the browser
const { ConsensusEngine } = require('multiagent-consensus');

// ============================
// Engine Configuration
// ============================

console.log('🔧 Configuring consensus engine with in-memory caching...');

// Create a consensus engine with in-memory caching enabled
const engine = new ConsensusEngine({
  // LLM Configuration
  models: ['gpt-3.5-turbo', 'claude-3-haiku'],
  consensusMethod: 'majority',
  maxRounds: 2,

  // Cache Configuration
  cache: {
    enabled: true, // Enable caching
    adapter: 'memory', // Use memory adapter (this is the default)
    ttl: 3600, // Cache TTL: 1 hour in seconds

    // Memory-specific options
    adapterOptions: {
      maxSize: 1000, // Maximum number of entries to store
      defaultTtl: 3600, // Default TTL: 1 hour in seconds
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
    // 1. Get the current cache size (only available with memory adapter)
    console.log('\n1️⃣ Checking cache size...');
    if ('size' in engine.cache) {
      console.log(`✅ Current cache size: ${engine.cache.size} entries`);
    } else {
      console.log('ℹ️ Size property not available (only exists on memory adapter)');
    }

    // 2. Store a custom value
    console.log('\n2️⃣ Storing a custom value...');
    await engine.cache.set('custom-key', {
      message: 'This is a manually cached value',
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Value stored successfully.');

    // 3. Retrieve the value
    console.log('\n3️⃣ Retrieving custom value...');
    const value = await engine.cache.get('custom-key');

    if (value) {
      console.log('✅ Retrieved value:');
      console.log(value);
    } else {
      console.log('❌ Value not found in cache.');
    }

    // 4. Delete specific key
    console.log('\n4️⃣ Deleting custom key...');
    await engine.cache.delete('custom-key');
    console.log('✅ Key deleted.');

    // 5. Verify deletion
    const checkValue = await engine.cache.get('custom-key');
    console.log(
      'Value after deletion:',
      checkValue === null ? 'null (correctly deleted)' : 'still exists (error)'
    );

    // 6. Clearing the entire cache
    console.log('\n5️⃣ Clearing the entire cache...');
    await engine.cache.clear();
    console.log('✅ Cache cleared. All entries have been removed.');

    if ('size' in engine.cache) {
      console.log(`ℹ️ Cache size after clearing: ${engine.cache.size} entries`);
    }
  } catch (error) {
    console.error('❌ Error during cache operations:', error);
  }
}

// ============================
// Main Demonstration
// ============================

async function runDemonstration() {
  console.log('\n🚀 IN-MEMORY CACHE DEMONSTRATION');
  console.log('================================');

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
    console.log('In-memory caching is now configured and working properly.');
    console.log('\n💡 Note: Memory cache is wiped when your application restarts.');
    console.log('    For persistent caching, consider using the Redis adapter.');
  } catch (error) {
    console.error('\n❌ Demonstration error:', error);
  }
}

// Run the demonstration
runDemonstration().catch(console.error);
