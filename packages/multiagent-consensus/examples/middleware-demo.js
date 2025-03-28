/**
 * Cache Middleware Demonstration
 * Shows how the caching middleware integrates with the Vercel AI SDK
 */

// Import middleware creator
const { createCachingMiddleware } = require('../dist/cache/middleware');
const { MemoryCacheAdapter } = require('../dist/cache/adapters');

// Create a cache adapter with logging
class LoggingMemoryAdapter extends MemoryCacheAdapter {
  async get(key) {
    const value = await super.get(key);
    console.log(`Cache get for key ${key.substring(0, 20)}... => ${value ? 'HIT' : 'MISS'}`);
    return value;
  }

  async set(key, value, ttl) {
    console.log(`Cache set for key ${key.substring(0, 20)}...`);
    return super.set(key, value, ttl);
  }
}

async function runDemo() {
  console.log('=== CACHE MIDDLEWARE DEMONSTRATION ===\n');

  // Create adapter
  const adapter = new LoggingMemoryAdapter();

  // Create middleware with cache enabled
  console.log('Creating middleware with cache ENABLED:');
  const middleware = createCachingMiddleware({
    enabled: true,
    adapter: adapter,
    ttl: 3600,
  });

  // Create mock AI functions that would be wrapped by middleware
  const mockDoGenerate = async () => {
    console.log('  📝 Generating response from API (expensive operation)');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    return { text: 'This is a response from the API' };
  };

  // Mock parameters for API calls
  const params1 = {
    model: 'gpt-4',
    prompt: 'What is the capital of France?',
    temperature: 0.7,
  };

  const params2 = {
    model: 'gpt-4',
    prompt: 'What is the capital of Japan?',
    temperature: 0.7,
  };

  // First API call - should be a cache miss
  console.log('\nFIRST API CALL (should be a cache miss):');
  console.time('First call duration');
  const result1 = await middleware.wrapGenerate({
    doGenerate: mockDoGenerate,
    params: params1,
  });
  console.timeEnd('First call duration');
  console.log('Result:', result1);

  // Same API call again - should be a cache hit
  console.log('\nSECOND API CALL - SAME PARAMS (should be a cache hit):');
  console.time('Second call duration');
  const result2 = await middleware.wrapGenerate({
    doGenerate: mockDoGenerate,
    params: params1,
  });
  console.timeEnd('Second call duration');
  console.log('Result:', result2);

  // Different API call - should be a cache miss
  console.log('\nTHIRD API CALL - DIFFERENT PARAMS (should be a cache miss):');
  console.time('Third call duration');
  const result3 = await middleware.wrapGenerate({
    doGenerate: mockDoGenerate,
    params: params2,
  });
  console.timeEnd('Third call duration');
  console.log('Result:', result3);

  // Create middleware with cache disabled for comparison
  console.log('\nCreating middleware with cache DISABLED:');
  const disabledMiddleware = createCachingMiddleware({
    enabled: false,
  });

  // API call with cache disabled - should always call the API
  console.log('\nAPI CALL WITH CACHE DISABLED:');
  console.time('Disabled cache call duration');
  const result4 = await disabledMiddleware.wrapGenerate({
    doGenerate: mockDoGenerate,
    params: params1,
  });
  console.timeEnd('Disabled cache call duration');
  console.log('Result:', result4);

  console.log('\n=== DEMONSTRATION COMPLETE ===');
}

// Run the demonstration
runDemo().catch(console.error);
