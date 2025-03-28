import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { EnvManager } from '../env';

// Mock fs module
jest.mock('fs');
jest.mock('path');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('EnvManager', () => {
  let envManager: EnvManager;

  beforeEach(() => {
    // Reset the singleton instance by using a hack to access the private property
    (EnvManager as any).instance = undefined;

    // Get a fresh instance for testing
    envManager = EnvManager.getInstance();

    // Save original env and create a minimal environment
    const originalEnv = process.env;
    process.env = {
      NODE_ENV: 'test',
      // Add other required env vars as needed
    };

    // Mock filesystem and console
    fs.existsSync = jest.fn();
    fs.readFileSync = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    // Default mock behavior
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('TEST_VAR=test_value\nTEST_VAR2=test_value2');

    // Reset mocks and environment before each test
    jest.clearAllMocks();

    // Mock path.resolve to return predictable paths
    (path.resolve as jest.Mock).mockImplementation((dir, file) => {
      return `${dir}/${file}`;
    });
  });

  afterEach(() => {
    // For good measure, reset the singleton instance after each test too
    (EnvManager as any).instance = undefined;
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
      // Setup
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path === '.env') return true;
        return false;
      });

      // Spy on the init method
      const initSpy = jest.spyOn(envManager, 'init');

      // Call get to trigger initialization
      envManager.get('TEST_VAR');
      expect(initSpy).toHaveBeenCalledTimes(1);

      // Call get again, should not trigger init again
      envManager.get('TEST_VAR');
      expect(initSpy).toHaveBeenCalledTimes(1);

      // Verify fs.existsSync was called the expected number of times
      // The real implementation checks multiple paths
      expect(fs.existsSync).toHaveBeenCalled();
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
      // Mock path.resolve to return predictable paths for the test
      (path.resolve as jest.Mock).mockImplementation((dir, ...parts) => {
        return [dir, ...parts].join('/');
      });

      // Create mock paths for the test
      const currentDir = process.cwd();
      const envPath = `${currentDir}/.env`;

      // First all paths return false, then the second one returns true
      (fs.existsSync as jest.Mock).mockImplementation(path => path === envPath);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      envManager.init();

      // We don't need to check every call, just verify the specific path we care about
      expect(fs.existsSync).toHaveBeenCalledWith(envPath);
      expect(dotenv.config).toHaveBeenCalledWith({ path: envPath });
      expect(consoleSpy).toHaveBeenCalledWith(`Loaded environment variables from ${envPath}`);

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
      (EnvManager as any).instance = undefined;
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
      (EnvManager as any).instance = undefined;
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
