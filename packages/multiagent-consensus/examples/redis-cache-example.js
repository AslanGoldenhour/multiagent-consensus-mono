/**
 * Example demonstrating the Redis cache adapter with Upstash
 *
 * This example shows how to:
 * 1. Configure the Redis cache adapter with Upstash
 * 2. Use environment variables for connection details
 * 3. Manually perform cache operations
 * 4. Monitor cache performance
 *
 * Prerequisites:
 * - Upstash Redis account and database
 * - Upstash Redis URL and token
 */

// Note: When running this example directly, use the following commands:
// 1. Ensure you're in the package directory: cd packages/multiagent-consensus
// 2. Create a .env file with your Upstash credentials
// 3. Run with Node.js: node examples/redis-cache-example.js

// Add the following to your .env file:
// REDIS_URL=your-upstash-redis-url
// REDIS_TOKEN=your-upstash-redis-token
// REDIS_PREFIX=consensus-example:

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

// Validate that Redis environment variables are set
if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
  console.error('❌ Error: REDIS_URL and REDIS_TOKEN environment variables must be set.');
  console.error('Please create a .env file with your Upstash credentials.');
  process.exit(1);
}

// Create a consensus engine with Redis caching enabled
const engine = new ConsensusEngine({
  models: ['gpt-3.5-turbo', 'claude-3-haiku'],
  consensusMethod: 'majority',
  maxRounds: 2,
  cache: {
    enabled: true,
    adapter: 'redis', // Use the Redis adapter
    ttl: 3600, // 1 hour TTL (default)
    adapterOptions: {
      // The adapter will use environment variables by default,
      // but you can also specify options directly:
      // url: process.env.REDIS_URL,
      // token: process.env.REDIS_TOKEN,
      prefix: 'example:', // Override the prefix from environment variables
      defaultTtl: 7200, // 2 hours default TTL
    },
  },
});

// Function to run a query and display results
async function runQuery(query) {
  console.log(`\nRunning query: "${query}"`);
  console.time('Response time');

  try {
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
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

// Main function to demonstrate Redis caching
async function demonstrateRedisCaching() {
  console.log('Multiagent Consensus Redis Caching Example');
  console.log('==========================================');
  console.log('Using Upstash Redis for distributed caching');

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

    // Same query again - should be a cache hit
    console.log('\n4. Repeat query (should be a cache hit):');
    await runQuery('What is the capital of Japan?');

    // Manual cache operations if needed
    console.log('\n5. Manual cache operations:');
    if (engine.cache) {
      // Store a value directly
      await engine.cache.set('manual-key', { answer: 'This is a manually cached response' });
      console.log('- Stored a value with key "manual-key"');

      // Retrieve the value
      const value = await engine.cache.get('manual-key');
      console.log(`- Retrieved value: ${JSON.stringify(value)}`);

      // Delete a specific key
      await engine.cache.delete('manual-key');
      console.log('- Deleted key "manual-key"');

      // Clear the entire cache (use with caution)
      // Only clears keys with the configured prefix
      // await engine.cache.clear();
      // console.log('- Cleared the entire cache');
    } else {
      console.log('- Cache is not available for manual operations.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

// Run the demonstration
demonstrateRedisCaching().catch(console.error);
/* eslint-enable no-console */
