import fs from 'fs';
import path from 'path';
import os from 'os';
import { FileCacheAdapter } from '../adapters/file';

// Mock setInterval and clearInterval
jest.useFakeTimers();

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  // Mock static methods
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  renameSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  // Mock promises module
  promises: {
    unlink: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('FileCacheAdapter', () => {
  let adapter: FileCacheAdapter;
  const tempDir = path.join(os.tmpdir(), 'file-cache-test');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Setup common mock implementations
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return path === tempDir;
    });
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.readdirSync as jest.Mock).mockReturnValue([]);

    // Create adapter with test directory
    adapter = new FileCacheAdapter({
      cacheDir: tempDir,
      createDirIfNotExists: true,
    });
  });

  afterEach(() => {
    // Clean up resources
    adapter.destroy();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('should create cache directory if it does not exist', () => {
    // Setup mock to say directory doesn't exist
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

    // Create new adapter to trigger directory creation
    const newAdapter = new FileCacheAdapter({
      cacheDir: '/non-existent-dir',
      createDirIfNotExists: true,
    });

    expect(fs.mkdirSync).toHaveBeenCalledWith('/non-existent-dir', { recursive: true });
    newAdapter.destroy();
  });

  test('should not create cache directory if createDirIfNotExists is false', () => {
    // Setup mock to say directory doesn't exist
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

    // Create adapter with createDirIfNotExists set to false
    expect(() => {
      new FileCacheAdapter({
        cacheDir: '/non-existent-dir',
        createDirIfNotExists: false,
      });
    }).not.toThrow(); // Should log error but not throw

    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  test('should store and retrieve values', async () => {
    const mockValue = 'test-value';

    // Setup mocks for storing
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    (fs.renameSync as jest.Mock).mockImplementation(() => undefined);

    // Store a value
    await adapter.set('test-key', mockValue);

    // Verify temporary file was written and renamed
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      expect.stringContaining(mockValue),
      'utf8'
    );
    expect(fs.renameSync).toHaveBeenCalled();

    // Setup mocks for retrieval
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        value: mockValue,
        expiry: null,
        created: Date.now(),
      })
    );

    // Retrieve the value
    const value = await adapter.get('test-key');
    expect(value).toBe(mockValue);
  });

  test('should return null for non-existent keys', async () => {
    // Mock file does not exist
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

    const value = await adapter.get('nonexistent');
    expect(value).toBeNull();
  });

  test('should return null for expired entries', async () => {
    // Mock file exists
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);

    // Mock file content with expired entry
    const now = Date.now();
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        value: 'expired-value',
        expiry: now - 10000, // Expired 10 seconds ago
        created: now - 20000,
      })
    );

    const value = await adapter.get('expired-key');

    // Should return null for expired items
    expect(value).toBeNull();

    // Should attempt to delete the expired file
    expect(fs.promises.unlink).toHaveBeenCalled();
  });

  test('should delete values', async () => {
    // Mock file exists
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);

    await adapter.delete('test-key');

    // Should attempt to delete the file
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  test('should not throw when deleting non-existent keys', async () => {
    // Mock file does not exist
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

    await expect(adapter.delete('nonexistent')).resolves.not.toThrow();
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  test('should clear all values', async () => {
    // Mock directory exists
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);

    // Mock directory contains files
    (fs.readdirSync as jest.Mock).mockReturnValueOnce([
      'file1.json',
      'file2.json',
      'file3.tmp',
      'other-file.txt', // Should be ignored
    ]);

    await adapter.clear();

    // Should delete each .json and .tmp file
    expect(fs.unlinkSync).toHaveBeenCalledTimes(3);
    expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(tempDir, 'file1.json'));
    expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(tempDir, 'file2.json'));
    expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(tempDir, 'file3.tmp'));
  });

  test('should handle complex objects', async () => {
    const complexObject = {
      nested: {
        array: [1, 2, 3],
        object: { a: 1, b: 2 },
      },
      date: new Date(2023, 1, 1).toISOString(), // Use ISO string for predictable serialization
    };

    // Setup mocks for storing
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    (fs.renameSync as jest.Mock).mockImplementation(() => undefined);

    // Store the complex object
    await adapter.set('complex', complexObject);

    // Verify JSON was written
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(JSON.stringify(complexObject).slice(0, 20)), // Check substring of serialized object
      'utf8'
    );

    // Setup mocks for retrieval
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        value: complexObject,
        expiry: null,
        created: Date.now(),
      })
    );

    // Retrieve the complex object
    const retrieved = await adapter.get('complex');
    expect(retrieved).toEqual(complexObject);
  });

  test('should respect TTL', async () => {
    // Store with a 10-second TTL
    await adapter.set('expiring', 'value', 10);

    // Verify TTL was included when writing the file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringMatching(/"expiry":\d+/), // Should have numeric expiry timestamp
      'utf8'
    );

    // Setup for immediate retrieval (not expired)
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    const now = Date.now();
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        value: 'value',
        expiry: now + 5000, // Expires in 5 seconds
        created: now,
      })
    );

    // Immediately should be available
    const value1 = await adapter.get('expiring');
    expect(value1).toBe('value');

    // Setup for expired retrieval
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        value: 'value',
        expiry: now - 5000, // Expired 5 seconds ago
        created: now - 15000,
      })
    );

    // Should return null for expired item
    const value2 = await adapter.get('expiring');
    expect(value2).toBeNull();
  });

  test('should handle cleanup process', () => {
    // Mock private method cleanupExpired
    const spy = jest.spyOn(adapter as any, 'cleanupExpired');

    // Advance timers to trigger the interval callback
    jest.advanceTimersByTime(3600000); // 1 hour

    // Check if cleanupExpired was called
    expect(spy).toHaveBeenCalled();
  });

  test('should cleanup corrupted files during cleanupExpired', async () => {
    // Mock directory exists
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);

    // Mock directory contains files
    (fs.readdirSync as jest.Mock).mockReturnValueOnce(['corrupt.json', 'valid.json']);

    // Mock stat for first file
    (fs.statSync as jest.Mock).mockReturnValueOnce({
      mtimeMs: Date.now() - 10000, // Modified 10 seconds ago
    });

    // Mock error when reading first file (corrupt)
    (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Corrupt file');
    });

    // Mock stat for second file
    (fs.statSync as jest.Mock).mockReturnValueOnce({
      mtimeMs: Date.now() - 10000, // Modified 10 seconds ago
    });

    // Mock valid content for second file
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        value: 'value',
        expiry: Date.now() + 10000, // Not expired
        created: Date.now() - 10000,
      })
    );

    // Call cleanupExpired directly
    (adapter as any).cleanupExpired();

    // Should try to delete corrupt file
    expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(tempDir, 'corrupt.json'));
    // Should not delete valid file
    expect(fs.unlinkSync).not.toHaveBeenCalledWith(path.join(tempDir, 'valid.json'));
  });

  test('should handle errors when storage directory is not accessible', async () => {
    // Mock existsSync to throw an error
    (fs.existsSync as jest.Mock).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Should not throw errors on operations
    await expect(adapter.get('key')).resolves.toBeNull();
    await expect(adapter.set('key', 'value')).resolves.not.toThrow();
    await expect(adapter.delete('key')).resolves.not.toThrow();
    await expect(adapter.clear()).resolves.not.toThrow();
  });
});
