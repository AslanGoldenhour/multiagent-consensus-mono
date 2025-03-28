/**
 * Minimal Cache Demonstration
 */

// Import cache adapter
const { MemoryCacheAdapter } = require('../../../dist/cache/adapters');

// Create a simple cache
const cache = new MemoryCacheAdapter();

// Demo function
async function demoCache() {
  console.log('=== MINIMAL CACHE DEMO ===');

  // First access - should be a miss
  console.log('\nAttempting to get value (should be miss)');
  const value1 = await cache.get('test-key');
  console.log('Cache result:', value1 === null ? 'MISS (null)' : 'HIT');

  // Store a value
  console.log('\nStoring value in cache');
  await cache.set('test-key', 'Hello from cache!');
  console.log('Value stored');

  // Second access - should be a hit
  console.log('\nAttempting to get value again (should be hit)');
  const value2 = await cache.get('test-key');
  console.log('Cache result:', value2 ? 'HIT: ' + value2 : 'MISS');

  // Clear cache
  console.log('\nClearing cache');
  await cache.clear();

  // Third access - should be a miss again
  console.log('\nAfter clearing, attempting to get value (should be miss)');
  const value3 = await cache.get('test-key');
  console.log('Cache result:', value3 === null ? 'MISS (null)' : 'HIT');

  console.log('\n=== DEMO COMPLETE ===');
}

// Run the demo
demoCache()
  .then(() => {
    console.log('Demo ran successfully');
  })
  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
    // Clean up
    cache.destroy();
  });
