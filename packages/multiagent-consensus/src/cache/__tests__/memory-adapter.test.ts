import { MemoryCacheAdapter } from '../adapters/memory';

describe('MemoryCacheAdapter', () => {
  let adapter: MemoryCacheAdapter;

  beforeEach(() => {
    adapter = new MemoryCacheAdapter();
  });

  afterEach(() => {
    adapter.destroy();
  });

  test('should store and retrieve values', async () => {
    await adapter.set('key1', 'value1');
    const value = await adapter.get('key1');
    expect(value).toBe('value1');
  });

  test('should return null for non-existent keys', async () => {
    const value = await adapter.get('nonexistent');
    expect(value).toBeNull();
  });

  test('should delete values', async () => {
    await adapter.set('key1', 'value1');
    await adapter.delete('key1');
    const value = await adapter.get('key1');
    expect(value).toBeNull();
  });

  test('should clear all values', async () => {
    await adapter.set('key1', 'value1');
    await adapter.set('key2', 'value2');
    await adapter.clear();
    expect(await adapter.get('key1')).toBeNull();
    expect(await adapter.get('key2')).toBeNull();
  });

  test('should handle complex objects', async () => {
    const complexObject = {
      nested: {
        array: [1, 2, 3],
        object: { a: 1, b: 2 },
      },
      date: new Date(),
    };

    await adapter.set('complex', complexObject);
    const retrieved = await adapter.get('complex');
    expect(retrieved).toEqual(complexObject);
  });

  test('should respect TTL', async () => {
    // Mock Date.now to control time
    const realDateNow = Date.now;
    try {
      let now = 1000;
      Date.now = jest.fn(() => now);

      // Set with a 10-second TTL
      await adapter.set('expiring', 'value', 10);

      // Immediately should be available
      expect(await adapter.get('expiring')).toBe('value');

      // Advance time by 5 seconds (not expired yet)
      now += 5000;
      expect(await adapter.get('expiring')).toBe('value');

      // Advance time by 6 more seconds (now expired)
      now += 6000;
      expect(await adapter.get('expiring')).toBeNull();
    } finally {
      Date.now = realDateNow;
    }
  });

  test('should respect maxSize', async () => {
    // Create adapter with maxSize of 2
    const smallAdapter = new MemoryCacheAdapter({ maxSize: 2 });

    try {
      await smallAdapter.set('key1', 'value1');
      await smallAdapter.set('key2', 'value2');

      // Both keys should be present
      expect(await smallAdapter.get('key1')).toBe('value1');
      expect(await smallAdapter.get('key2')).toBe('value2');

      // Add a third item, which should evict the oldest (key1)
      await smallAdapter.set('key3', 'value3');

      // key1 should be gone, but key2 and key3 should be present
      expect(await smallAdapter.get('key1')).toBeNull();
      expect(await smallAdapter.get('key2')).toBe('value2');
      expect(await smallAdapter.get('key3')).toBe('value3');
    } finally {
      smallAdapter.destroy();
    }
  });
});
