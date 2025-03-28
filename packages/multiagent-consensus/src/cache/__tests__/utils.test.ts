import { generateCacheKey, sortObjectEntries, createHash } from '../utils';

describe('sortObjectEntries', () => {
  test('should sort object entries alphabetically', () => {
    const input = { c: 1, a: 2, b: 3 };
    const sorted = sortObjectEntries(input);

    // Check order of keys
    expect(Object.keys(sorted)).toEqual(['a', 'b', 'c']);
    // Check values are preserved
    expect(sorted.a).toBe(2);
    expect(sorted.b).toBe(3);
    expect(sorted.c).toBe(1);
  });

  test('should sort nested objects', () => {
    const input = {
      b: { z: 1, y: 2, x: 3 },
      a: { c: 3, b: 2, a: 1 },
    };

    const sorted = sortObjectEntries(input);

    expect(Object.keys(sorted)).toEqual(['a', 'b']);
    expect(Object.keys(sorted.a)).toEqual(['a', 'b', 'c']);
    expect(Object.keys(sorted.b)).toEqual(['x', 'y', 'z']);
  });

  test('should handle arrays', () => {
    const input = {
      arr: [
        { c: 1, a: 2, b: 3 },
        { z: 4, x: 5, y: 6 },
      ],
    };

    const sorted = sortObjectEntries(input);

    expect(sorted.arr.length).toBe(2);
    expect(Object.keys(sorted.arr[0])).toEqual(['a', 'b', 'c']);
    expect(Object.keys(sorted.arr[1])).toEqual(['x', 'y', 'z']);
  });

  test('should handle non-object values', () => {
    expect(sortObjectEntries(null)).toBeNull();
    expect(sortObjectEntries(undefined)).toBeUndefined();
    expect(sortObjectEntries(42)).toBe(42);
    expect(sortObjectEntries('string')).toBe('string');
    expect(sortObjectEntries(true)).toBe(true);
    expect(sortObjectEntries([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe('generateCacheKey', () => {
  test('should generate consistent keys for identical inputs', () => {
    const options1 = {
      models: ['model1', 'model2'],
      prompt: 'Hello, world!',
      temperature: 0.7,
    };

    const options2 = {
      models: ['model1', 'model2'],
      prompt: 'Hello, world!',
      temperature: 0.7,
    };

    const key1 = generateCacheKey(options1);
    const key2 = generateCacheKey(options2);

    expect(key1).toBe(key2);
  });

  test('should sort model names for consistent keys', () => {
    const options1 = {
      models: ['model1', 'model2'],
      prompt: 'Hello, world!',
    };

    const options2 = {
      models: ['model2', 'model1'], // Different order
      prompt: 'Hello, world!',
    };

    const key1 = generateCacheKey(options1);
    const key2 = generateCacheKey(options2);

    expect(key1).toBe(key2);
  });

  test('should generate different keys for different prompts', () => {
    const options1 = {
      models: ['model1'],
      prompt: 'Hello, world!',
    };

    const options2 = {
      models: ['model1'],
      prompt: 'Goodbye, world!',
    };

    const key1 = generateCacheKey(options1);
    const key2 = generateCacheKey(options2);

    expect(key1).not.toBe(key2);
  });

  test('should handle all possible parameters', () => {
    const options = {
      models: ['model1', 'model2'],
      prompt: 'Test prompt',
      systemPrompt: 'System instructions',
      temperature: 0.8,
      maxTokens: 100,
      topP: 0.95,
      frequencyPenalty: 0.5,
      presencePenalty: 0.2,
      streaming: true,
      extraParam: 'extra',
    };

    const key = generateCacheKey(options);
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(10);
  });
});

describe('createHash', () => {
  test('should create consistent hashes for the same input', () => {
    const input = 'Hello, world!';

    const hash1 = createHash(input);
    const hash2 = createHash(input);

    expect(hash1).toBe(hash2);
  });

  test('should create different hashes for different inputs', () => {
    const hash1 = createHash('Hello, world!');
    const hash2 = createHash('Goodbye, world!');

    expect(hash1).not.toBe(hash2);
  });

  test('should handle empty string', () => {
    const hash = createHash('');
    expect(typeof hash).toBe('string');
  });
});
