import { registerProvider, loadProviders, providerRegistry } from '../index';
import { envManager } from '../../utils/env';
import { ConsensusConfig } from '../../types/config';

// Mock the environment manager
jest.mock('../../utils/env', () => ({
  envManager: {
    getProviderKeys: jest.fn().mockReturnValue({
      openai: 'test-key',
      anthropic: 'test-key',
    }),
  },
}));

// Mock dynamic imports - this is required because the code uses import()
jest.mock('../index', () => {
  const original = jest.requireActual('../index');

  return {
    ...original,
    // Override dynamicImport to avoid actual imports during tests
    dynamicImport: jest.fn().mockImplementation(() => {
      // Return mocked modules that satisfy the code's requirements
      return Promise.resolve({
        // Mock OpenAI
        openai: () => ({}),
        // Mock Anthropic
        anthropic: () => ({}),
        // Mock Vercel AI SDK
        generateText: jest.fn().mockResolvedValue({ text: 'test response' }),
      });
    }),
    // Mock isProviderInstalled for tests
    isProviderInstalled: jest.fn().mockImplementation(() => true),
  };
});

// Mock console methods to avoid noise in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Provider module', () => {
  // Save original registry to restore between tests
  const originalRegistry = { ...providerRegistry };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset provider registry to original state
    Object.keys(providerRegistry).forEach(key => {
      if (!originalRegistry[key]) {
        delete providerRegistry[key];
      }
    });
    Object.keys(originalRegistry).forEach(key => {
      providerRegistry[key] = { ...originalRegistry[key] };
    });
  });

  describe('registerProvider', () => {
    it('should register a custom provider', () => {
      registerProvider('custom-provider-package', {
        name: 'customProvider',
        models: ['custom-model-1', 'custom-model-2'],
      });

      // Check the provider was added to the registry
      expect(providerRegistry['custom-provider-package']).toBeDefined();
      expect(providerRegistry['custom-provider-package'].name).toBe('customProvider');
      expect(providerRegistry['custom-provider-package'].models).toEqual([
        'custom-model-1',
        'custom-model-2',
      ]);
    });

    it('should override an existing provider if same package name is used', () => {
      // First registration
      registerProvider('existing-package', {
        name: 'existingProvider',
        models: ['model-1'],
      });

      // Second registration with the same package
      registerProvider('existing-package', {
        name: 'existingProvider',
        models: ['model-2'],
      });

      // Check that the provider was updated
      expect(providerRegistry['existing-package']).toBeDefined();
      expect(providerRegistry['existing-package'].models).toEqual(['model-2']);
    });
  });

  describe('loadProviders', () => {
    it('should return at least one provider', async () => {
      const config: ConsensusConfig = {
        models: ['gpt-4', 'claude-3-opus'],
      };

      const providers = await loadProviders(config);

      // Verify we get at least one provider
      expect(providers.length).toBeGreaterThan(0);
      // Verify each provider has required methods
      providers.forEach(provider => {
        expect(provider.name).toBeDefined();
        expect(provider.supportedModels).toBeDefined();
        expect(typeof provider.generateResponse).toBe('function');
      });
    });

    it('should return a provider even when no API keys are configured', async () => {
      // Mock environment to return empty keys
      (envManager.getProviderKeys as jest.Mock).mockReturnValueOnce({});

      const config: ConsensusConfig = {
        models: ['gpt-4', 'claude-3-opus'],
      };

      const providers = await loadProviders(config);

      // Should return at least one provider as fallback
      expect(providers.length).toBe(1);
      expect(providers[0]).toBeDefined();
      expect(typeof providers[0].generateResponse).toBe('function');
    });

    it('should check environment for provider keys', async () => {
      const config: ConsensusConfig = {
        models: ['gpt-4', 'claude-3-opus'],
      };

      await loadProviders(config);

      // Verify environment was checked for API keys
      expect(envManager.getProviderKeys).toHaveBeenCalled();
    });

    // This test stub can be expanded later when implementing provider filtering
    it('should filter providers based on configuration', async () => {
      // This is a placeholder for future implementation
      expect(true).toBe(true);
    });
  });

  // Simple placeholder tests for the provider classes
  describe('Provider classes', () => {
    it('should provide VercelAIProvider and GenericProvider classes', () => {
      // This is a placeholder for more detailed tests in the future
      expect(true).toBe(true);
    });
  });
});
