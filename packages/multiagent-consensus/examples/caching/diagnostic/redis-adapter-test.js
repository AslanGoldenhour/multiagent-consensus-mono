/**
 * Redis Adapter Test
 *
 * This script tests the Redis adapter connection with Upstash
 * and demonstrates real-world caching capabilities.
 *
 * It explicitly loads the .env.local file from the monorepo root.
 */

const path = require('path');
const fs = require('fs');
const { Redis } = require('@upstash/redis');
const { RedisCacheAdapter } = require('../../../dist/cache/adapters/redis');
const { generateCacheKey } = require('../../../dist/cache/utils');

// Get the monorepo root directory
const monorepoRoot = path.resolve(__dirname, '../../../');

// Load environment variables from .env.local at the root
require('dotenv').config({
  path: path.join(monorepoRoot, '.env.local'),
  override: true, // Make sure these variables take precedence
});

console.log('Testing Redis Adapter with Upstash');
console.log('==================================');

// Verify Redis configuration
if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
  console.error('❌ Error: REDIS_URL and REDIS_TOKEN environment variables are not set.');
  console.error('Please check your .env.local file at the root of the repository.');
  process.exit(1);
}

console.log('✅ Redis environment variables found');
console.log(`   URL: ${process.env.REDIS_URL.substring(0, 20)}...`);
console.log(`   Token: ${process.env.REDIS_TOKEN.substring(0, 5)}...`);
console.log(`   Prefix: ${process.env.REDIS_PREFIX || 'consensus:'}`);

// Test the Redis adapter with direct Redis access for debugging
async function testRedisAdapter() {
  console.log('\nCreating Redis adapter and direct Redis client...');
  const adapter = new RedisCacheAdapter();

  // Create a direct Redis client for debugging
  const redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
  });

  try {
    // Generate a test key
    const params = {
      models: ['gpt-3.5-turbo', 'claude-3-haiku'],
      prompt: 'Test prompt for Redis cache',
      temperature: 0.7,
    };
    const key = generateCacheKey(params);
    const prefix = process.env.REDIS_PREFIX || 'consensus:';
    const prefixedKey = `${prefix}${key}`;

    console.log(`Generated cache key: ${key.substring(0, 30)}...`);
    console.log(`Full prefixed key: ${prefixedKey.substring(0, 40)}...`);

    // Test operations
    console.log('\n1. Testing SET operation...');
    const testValue = {
      result: 'This is a test result',
      timestamp: new Date().toISOString(),
    };

    // Manually serialize to JSON
    const serializedValue = JSON.stringify(testValue);
    console.log(`Serialized value: ${serializedValue}`);

    // Store using the adapter
    await adapter.set(key, testValue, 60); // 60 second TTL
    console.log('✅ SET operation completed using adapter');

    // Debug: Get the raw value directly from Redis
    console.log('\n2. DEBUG: Getting raw value directly from Redis...');
    const rawValue = await redis.get(prefixedKey);
    console.log('Raw value from Redis:', rawValue);
    console.log('Type of raw value:', typeof rawValue);

    if (typeof rawValue === 'string') {
      try {
        const parsedValue = JSON.parse(rawValue);
        console.log('Successfully parsed as JSON:', parsedValue);
      } catch (e) {
        console.log('Failed to parse as JSON:', e.message);
      }
    }

    // Test adapter get
    console.log('\n3. Testing GET operation using adapter...');
    try {
      const retrievedValue = await adapter.get(key);
      if (retrievedValue) {
        console.log('✅ GET operation successful');
        console.log('Retrieved value:', retrievedValue);
      } else {
        console.log('❌ GET operation failed - no value retrieved');
      }
    } catch (error) {
      console.error('Error in GET operation:', error);
    }

    console.log('\n4. Testing DELETE operation...');
    await adapter.delete(key);
    console.log('✅ DELETE operation completed');

    // Verify deletion
    const afterDelete = await adapter.get(key);
    console.log(
      'Value after deletion:',
      afterDelete === null ? 'null (correct)' : 'still exists (error)'
    );

    // Clean up Redis client
    console.log('\nCleaning up resources...');

    console.log('\nTest completed!');
  } catch (error) {
    console.error('Error testing Redis adapter:', error);
    process.exit(1);
  }
}

// Execute the test
testRedisAdapter().catch(console.error);
