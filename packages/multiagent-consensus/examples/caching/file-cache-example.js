/**
 * File-Based Cache Example
 * ======================
 *
 * This example demonstrates how to use the file-based caching system
 * with the multiagent-consensus package. File-based caching is useful for:
 * - Persisting cache between application restarts
 * - Development and testing environments
 * - Single-server deployments without Redis
 * - Debugging cache entries (JSON files can be examined directly)
 *
 * The file adapter stores each cache entry as a separate JSON file in a configurable
 * directory, with automatic cleanup of expired entries.
 */

// We use CommonJS for compatibility with both Node.js and the browser
const { ConsensusEngine } = require('multiagent-consensus');
const path = require('path');
const os = require('os');
const fs = require('fs');

// ============================
// Setup Cache Directory
// ============================

// Create a cache directory in the system temp directory
const cacheDir = path.join(os.tmpdir(), 'multiagent-consensus-cache');

// Ensure the directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

console.log(`🔧 Using cache directory: ${cacheDir}`);

// ============================
// Engine Configuration
// ============================

console.log('🔧 Configuring consensus engine with file-based caching...');

// Create a consensus engine with file-based caching enabled
const engine = new ConsensusEngine({
  // LLM Configuration
  models: ['gpt-3.5-turbo', 'claude-3-haiku'],
  consensusMethod: 'majority',
  maxRounds: 2,

  // Cache Configuration
  cache: {
    enabled: true, // Enable caching
    adapter: 'file', // Use file adapter
    ttl: 3600, // Cache TTL: 1 hour in seconds

    // File-specific options
    adapterOptions: {
      cacheDir: cacheDir, // The directory to store cache files
      createDirIfNotExists: true, // Create the directory if it doesn't exist
      maxAge: 86400, // Maximum age of expired cache files: 1 day in seconds
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
 * Explores the cache directory to show stored files.
 */
function exploreCache() {
  console.log('\n📁 Exploring cache directory:');

  try {
    // List files in the cache directory
    const files = fs.readdirSync(cacheDir);

    console.log(`Found ${files.length} files in ${cacheDir}`);

    if (files.length === 0) {
      console.log('No cache files found.');
      return;
    }

    // Display the first 5 files with details
    const filesToShow = Math.min(files.length, 5);
    console.log(`\nShowing details for ${filesToShow} cache files:`);

    for (let i = 0; i < filesToShow; i++) {
      const fileName = files[i];
      if (!fileName.endsWith('.json')) continue;

      const filePath = path.join(cacheDir, fileName);
      const stats = fs.statSync(filePath);

      // Read the cache file
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const cacheEntry = JSON.parse(fileContent);

        // Calculate expiration time
        const expiryTime = cacheEntry.expiry
          ? new Date(cacheEntry.expiry).toLocaleString()
          : 'Never';
        const isExpired = cacheEntry.expiry && cacheEntry.expiry < Date.now();

        console.log(`\n📄 File: ${fileName}`);
        console.log(`   Created: ${new Date(cacheEntry.created).toLocaleString()}`);
        console.log(`   Expires: ${expiryTime} ${isExpired ? '(EXPIRED)' : ''}`);
        console.log(`   Size: ${stats.size} bytes`);
        console.log(`   Value type: ${typeof cacheEntry.value}`);
      } catch (err) {
        console.log(`\n📄 File: ${fileName} (Error reading: ${err.message})`);
      }
    }
  } catch (error) {
    console.error('Error exploring cache directory:', error);
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

    // Show the actual file created
    console.log('\n📂 Cache file created:');
    exploreCache();

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

    // 5. Clearing the entire cache
    console.log('\n4️⃣ Clearing the entire cache...');
    await engine.cache.clear();
    console.log('✅ Cache cleared. All entries have been removed.');

    // Verify cache is empty
    const files = fs.readdirSync(cacheDir);
    console.log(`Cache directory now contains ${files.length} files.`);
  } catch (error) {
    console.error('❌ Error during cache operations:', error);
  }
}

// ============================
// Main Demonstration
// ============================

async function runDemonstration() {
  console.log('\n🚀 FILE-BASED CACHE DEMONSTRATION');
  console.log('================================');

  try {
    // First query - should be a cache miss
    console.log('\n🔍 STEP 1: First query (should be a cache miss)');
    await runQuery('What is the capital of France?');

    // Same query again - should be a cache hit
    console.log('\n🔍 STEP 2: Same query again (should be a cache hit)');
    await runQuery('What is the capital of France?');

    // Explore the cache directory
    console.log('\n🔍 STEP 3: Exploring the cache directory');
    exploreCache();

    // Different query - should be a cache miss
    console.log('\n🔍 STEP 4: Different query (should be a cache miss)');
    await runQuery('What is the capital of Japan?');

    // Same second query - should be a cache hit
    console.log('\n🔍 STEP 5: Repeating the second query (should be a cache hit)');
    await runQuery('What is the capital of Japan?');

    // Demonstrate manual cache operations
    console.log('\n🔍 STEP 6: Advanced cache operations');
    await demonstrateCacheOperations();

    console.log('\n✨ Demonstration completed successfully!');
    console.log('File-based caching is now configured and working properly.');
    console.log('\n💡 Note: File cache is persistent across application restarts.');
    console.log(`    Cache files are stored in: ${cacheDir}`);
  } catch (error) {
    console.error('\n❌ Demonstration error:', error);
  }
}

// Run the demonstration
runDemonstration().catch(console.error);
