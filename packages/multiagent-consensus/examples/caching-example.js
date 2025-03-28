/**
 * Example demonstrating the caching feature of multiagent-consensus
 *
 * This example shows how to:
 * 1. Enable caching with default settings
 * 2. Configure caching options
 * 3. View cache statistics
 * 4. Perform manual cache operations
 */

// Note: When running this example directly, use the following commands:
// 1. Ensure you're in the package directory: cd packages/multiagent-consensus
// 2. Run with Node.js: node examples/caching-example.js

// For ESM:
// import { config } from 'dotenv';
// import { ConsensusEngine } from 'multiagent-consensus';
// config();

// For CommonJS (this example uses CommonJS for simplicity):
// We disable the ESLint rule for require statements as this is an example file
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
const { ConsensusEngine } = require('multiagent-consensus');
/* eslint-enable @typescript-eslint/no-var-requires */

// Allow console logs in this example file
/* eslint-disable no-console */

// Create a simple engine with caching enabled
const engine = new ConsensusEngine({
  models: ['gpt-3.5-turbo', 'claude-3-haiku'],
  consensusMethod: 'majority',
  maxRounds: 2,
  cache: {
    enabled: true, // Enable caching
    adapter: 'memory', // Use in-memory cache (default)
    ttl: 3600, // 1 hour TTL (default)
  },
});

// Function to run a query and display results
async function runQuery(query) {
  console.log(`\nRunning query: "${query}"`);
  console.time('Response time');

  const result = await engine.run(query);

  console.timeEnd('Response time');
  console.log(`Answer: ${result.answer}`);

  // Display cache information if available
  if (result.metadata.cachingEnabled) {
    console.log('\nCache Information:');
    console.log(`- Caching enabled: ${result.metadata.cachingEnabled}`);

    if (result.metadata.cacheStats) {
      console.log(`- Cache hits: ${result.metadata.cacheStats.hits}`);
      console.log(`- Cache misses: ${result.metadata.cacheStats.misses}`);
      console.log(`- Time saved: ${result.metadata.cacheStats.timeSaved}ms`);
    }
  }

  return result;
}

// Main function to demonstrate caching
async function demonstrateCaching() {
  console.log('Multiagent Consensus Caching Example');
  console.log('====================================');

  try {
    // First query - should be a cache miss
    console.log('\n1. First query (should be a cache miss):');
    await runQuery('What is the capital of France?');

    // Second query with the same prompt - should be a cache hit
    console.log('\n2. Second query with same prompt (should be a cache hit):');
    await runQuery('What is the capital of France?');

    // Different query - should be a cache miss
    console.log('\n3. Different query (should be a cache miss):');
    await runQuery('What is the capital of Japan?');

    // Manual cache operations
    console.log('\n4. Performing manual cache operations:');
    if (engine.cache) {
      console.log('- Clearing the cache...');
      await engine.cache.clear();

      console.log('- Cache cleared, running the first query again (should be a miss):');
      await runQuery('What is the capital of France?');
    } else {
      console.log('- Cache is not available for manual operations.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

// Run the demonstration
demonstrateCaching();
/* eslint-enable no-console */
