import fs from 'fs';
import path from 'path';
import { EnvManager } from '../env';
import dotenv from 'dotenv';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('EnvManager', () => {
  // Store original process.env
  const originalEnv = process.env;
  let envManager: EnvManager;

  beforeEach(() => {
    // Reset mocks and environment before each test
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Reset the singleton instance for each test
    // This is done via a private method for testing purposes
    (EnvManager as unknown as { instance: EnvManager | undefined }).instance = undefined;

    // Mock path.resolve to return predictable paths
    (path.resolve as jest.Mock).mockImplementation((dir, file) => {
      return `${dir}/${file}`;
    });

    envManager = EnvManager.getInstance();
  });

  afterAll(() => {
    // Restore process.env after all tests
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = EnvManager.getInstance();
      const instance2 = EnvManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('init', () => {
    it('should initialize only once', () => {
      envManager.init();
      envManager.init(); // Second call should be ignored
      expect(fs.existsSync).toHaveBeenCalledTimes(3); // Three default paths are checked
    });

    it('should load from custom path if provided and file exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      envManager.init('/custom/path/.env');
      expect(fs.existsSync).toHaveBeenCalledWith('/custom/path/.env');
      expect(dotenv.config).toHaveBeenCalledWith({ path: '/custom/path/.env' });
    });

    it('should warn if custom path does not exist', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      envManager.init('/nonexistent/path/.env');

      expect(fs.existsSync).toHaveBeenCalledWith('/nonexistent/path/.env');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Env file not found at custom path: /nonexistent/path/.env'
      );

      consoleSpy.mockRestore();
    });

    it('should try multiple default paths if no custom path is provided', () => {
      // Create the actual paths that the class will check
      const currentDir = process.cwd();
      const envPaths = ['.env', `${currentDir}/.env`, `${currentDir}/../.env`];

      // Mock path.resolve to return predictable paths
      (path.resolve as jest.Mock).mockImplementation((dir, file) => {
        if (dir === process.cwd() && file === '.env') {
          return `${currentDir}/.env`;
        }
        if (dir === process.cwd() && file === '../.env') {
          return `${currentDir}/../.env`;
        }
        return `${dir}/${file}`;
      });

      // Mock existsSync to return true only for the second path
      (fs.existsSync as jest.Mock).mockImplementation(path => path === envPaths[1]);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      envManager.init();

      expect(fs.existsSync).toHaveBeenCalledWith(envPaths[0]);
      expect(fs.existsSync).toHaveBeenCalledWith(envPaths[1]);
      expect(dotenv.config).toHaveBeenCalledWith({ path: envPaths[1] });
      expect(consoleSpy).toHaveBeenCalledWith(`Loaded environment variables from ${envPaths[1]}`);

      consoleSpy.mockRestore();
    });

    it('should warn if no .env file is found', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      envManager.init();

      expect(consoleSpy).toHaveBeenCalledWith(
        'No .env file found. Using existing environment variables.'
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors during initialization', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (fs.existsSync as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      envManager.init();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading environment variables:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should return the environment variable if it exists', () => {
      process.env.TEST_VAR = 'test_value';
      expect(envManager.get('TEST_VAR')).toBe('test_value');
    });

    it('should return the default value if the environment variable does not exist', () => {
      delete process.env.TEST_VAR;
      expect(envManager.get('TEST_VAR', 'default_value')).toBe('default_value');
    });

    it('should return undefined if the environment variable does not exist and no default is provided', () => {
      delete process.env.TEST_VAR;
      expect(envManager.get('TEST_VAR')).toBeUndefined();
    });

    it('should initialize if not already initialized', () => {
      // Create a new instance with initialized set to false
      (EnvManager as unknown as { instance: EnvManager | undefined }).instance = undefined;
      envManager = EnvManager.getInstance();

      const initSpy = jest.spyOn(envManager, 'init');
      process.env.TEST_VAR = 'test_value';

      expect(envManager.get('TEST_VAR')).toBe('test_value');
      expect(initSpy).toHaveBeenCalled();

      initSpy.mockRestore();
    });
  });

  describe('getRequired', () => {
    it('should return the environment variable if it exists', () => {
      process.env.TEST_VAR = 'test_value';
      expect(envManager.getRequired('TEST_VAR')).toBe('test_value');
    });

    it('should throw an error if the environment variable does not exist', () => {
      delete process.env.TEST_VAR;
      expect(() => envManager.getRequired('TEST_VAR')).toThrow(
        'Required environment variable TEST_VAR is not defined'
      );
    });
  });

  describe('has', () => {
    it('should return true if the environment variable exists', () => {
      process.env.TEST_VAR = 'test_value';
      expect(envManager.has('TEST_VAR')).toBe(true);
    });

    it('should return false if the environment variable does not exist', () => {
      delete process.env.TEST_VAR;
      expect(envManager.has('TEST_VAR')).toBe(false);
    });
  });

  describe('getProviderKeys', () => {
    beforeEach(() => {
      // Clear all environment variables that might be set for providers
      for (const key of Object.keys(process.env)) {
        if (
          key.includes('API_KEY') ||
          key.includes('ACCESS_KEY') ||
          key.includes('REGION') ||
          key.includes('ENDPOINT')
        ) {
          delete process.env[key];
        }
      }
    });

    it('should initialize if not already initialized', () => {
      // Create a new instance with initialized set to false
      (EnvManager as unknown as { instance: EnvManager | undefined }).instance = undefined;
      envManager = EnvManager.getInstance();

      const initSpy = jest.spyOn(envManager, 'init');
      envManager.getProviderKeys();

      expect(initSpy).toHaveBeenCalled();

      initSpy.mockRestore();
    });

    it('should return provider keys for single key providers', () => {
      process.env.OPENAI_API_KEY = 'openai-key';
      process.env.ANTHROPIC_API_KEY = 'anthropic-key';

      const providerKeys = envManager.getProviderKeys();

      expect(providerKeys.openai).toBe('openai-key');
      expect(providerKeys.anthropic).toBe('anthropic-key');
      expect(Object.keys(providerKeys).length).toBe(2);
    });

    it('should return "configured" for multi-key providers when all keys are present', () => {
      process.env.AWS_ACCESS_KEY_ID = 'aws-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'aws-secret-key';
      process.env.AWS_REGION = 'us-west-2';

      process.env.AZURE_OPENAI_API_KEY = 'azure-key';
      process.env.AZURE_OPENAI_ENDPOINT = 'azure-endpoint';

      const providerKeys = envManager.getProviderKeys();

      expect(providerKeys.amazonBedrock).toBe('configured');
      expect(providerKeys.azure).toBe('configured');
    });

    it('should not include providers with missing keys', () => {
      process.env.OPENAI_API_KEY = 'openai-key';
      // Only set one of the required AWS keys
      process.env.AWS_ACCESS_KEY_ID = 'aws-access-key';

      const providerKeys = envManager.getProviderKeys();

      expect(providerKeys.openai).toBe('openai-key');
      expect(providerKeys.amazonBedrock).toBeUndefined();
    });

    it('should not include providers with empty keys', () => {
      process.env.OPENAI_API_KEY = '';
      process.env.ANTHROPIC_API_KEY = 'anthropic-key';

      const providerKeys = envManager.getProviderKeys();

      expect(providerKeys.openai).toBeUndefined();
      expect(providerKeys.anthropic).toBe('anthropic-key');
    });
  });
});
