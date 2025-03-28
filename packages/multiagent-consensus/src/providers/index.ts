import { ConsensusConfig } from '../types/config';
import { LLMProvider } from '../types/provider';
import { envManager, ProviderError, handleError } from '../utils';
// We'll use the ai package dynamically to avoid issues with missing providers
// import { generateText } from 'ai';

// Define provider packages and their supported models
interface ProviderConfig {
  name: string;
  models: string[];
}

const PROVIDER_PACKAGES: Record<string, ProviderConfig> = {
  // Core providers
  '@ai-sdk/openai': {
    name: 'openai',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4-vision', 'gpt-3.5-turbo'],
  },
  '@ai-sdk/anthropic': {
    name: 'anthropic',
    models: [
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2',
    ],
  },
  '@ai-sdk/google': {
    name: 'google',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-flash'],
  },
  '@ai-sdk/mistral': {
    name: 'mistral',
    models: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large'],
  },
  '@ai-sdk/cohere': {
    name: 'cohere',
    models: ['command', 'command-light', 'command-r', 'command-r-plus'],
  },

  // Additional providers
  '@ai-sdk/groq': {
    name: 'groq',
    models: ['llama-3-8b-8192', 'llama-3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
  },
  '@ai-sdk/amazon-bedrock': {
    name: 'amazonBedrock',
    models: [
      'anthropic.claude-3-opus',
      'anthropic.claude-3-sonnet',
      'anthropic.claude-3-haiku',
      'amazon.titan',
    ],
  },
  '@ai-sdk/azure': {
    name: 'azure',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
  },
  '@ai-sdk/perplexity': {
    name: 'perplexity',
    models: ['sonar-small-online', 'sonar-medium-online', 'sonar-large-online'],
  },
  '@ai-sdk/xai': {
    name: 'xai',
    models: ['grok-1'],
  },
  '@ai-sdk/deepseek': {
    name: 'deepseek',
    models: ['deepseek-coder', 'deepseek-chat'],
  },
  '@ai-sdk/togetherai': {
    name: 'togetherai',
    models: ['llama-3-8b-8192', 'llama-3-70b-8192', 'mixtral-8x7b-32768'],
  },
  '@ai-sdk/fireworks': {
    name: 'fireworks',
    models: ['llama-v3-8b', 'llama-v3-70b', 'mixtral-8x7b'],
  },
  '@ai-sdk/google-vertex': {
    name: 'googleVertex',
    models: ['gemini-pro', 'gemini-pro-vision', 'text-bison', 'code-bison'],
  },
  '@ai-sdk/replicate': {
    name: 'replicate',
    models: ['llama-3-8b', 'llama-3-70b', 'llava'],
  },
  '@ai-sdk/cerebras': {
    name: 'cerebras',
    models: ['cerebras-gpt', 'slimpajama'],
  },
  '@ai-sdk/luma': {
    name: 'luma',
    models: ['photon', 'photon-flash'],
  },
};

// Allow users to register custom providers at runtime
export function registerProvider(packageName: string, config: ProviderConfig): void {
  PROVIDER_PACKAGES[packageName] = config;
}

// Export the provider registry for extensibility
export const providerRegistry = PROVIDER_PACKAGES;

/**
 * Check if a provider package is installed
 */
function isProviderInstalled(packageName: string): boolean {
  try {
    // Using dynamic import check
    require.resolve(packageName);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Dynamically import a module
 * @param moduleName The name of the module to import
 * @returns The imported module or null if import fails
 */
async function dynamicImport(moduleName: string): Promise<any> {
  try {
    // Using dynamic import
    return await import(moduleName);
  } catch (error) {
    console.warn(`Failed to import ${moduleName}:`, error);
    return null;
  }
}

/**
 * Check if an API key is available for a provider
 * @param providerName The name of the provider
 * @returns True if the API key is available, false otherwise
 */
function hasApiKey(providerName: string): boolean {
  // Get provider keys from environment manager
  const providerKeys = envManager.getProviderKeys();
  return providerName in providerKeys;
}

/**
 * A Vercel AI SDK Provider implementation
 */
class VercelAIProvider implements LLMProvider {
  name: string;
  supportedModels: string[];
  private providerPackage: string;

  constructor(name: string, providerPackage: string, supportedModels: string[]) {
    this.name = name;
    this.providerPackage = providerPackage;
    this.supportedModels = supportedModels;
  }

  async generateResponse(
    modelName: string,
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemMessage?: string;
    }
  ): Promise<{
    text: string;
    tokenUsage: {
      prompt: number;
      completion: number;
      total: number;
    };
  }> {
    try {
      // Check if model is supported
      if (!this.supportedModels.includes(modelName)) {
        throw ProviderError.modelNotFound(this.name, modelName);
      }

      // Check if API key is available
      if (!hasApiKey(this.name)) {
        throw ProviderError.apiKeyError(this.name);
      }

      // Import the Vercel AI SDK dynamically
      const aiModule = await dynamicImport('ai');
      if (!aiModule) {
        throw new Error('Failed to import the Vercel AI SDK');
      }

      const { generateText } = aiModule;

      // Import the provider dynamically
      const providerModule = await dynamicImport(this.providerPackage);
      if (!providerModule) {
        throw new Error(`Failed to import provider ${this.providerPackage}`);
      }

      // Create provider model options
      const modelOptions: Record<string, unknown> = {};

      // Set temperature if provided
      if (options?.temperature !== undefined) {
        modelOptions.temperature = options.temperature;
      }

      // Set max tokens if provided
      if (options?.maxTokens !== undefined) {
        modelOptions.maxTokens = options.maxTokens;
      }

      // Define the system message or use default
      const systemMessage =
        options?.systemMessage ||
        'You are a helpful AI assistant participating in a multi-agent consensus debate.';

      // Generate text with Vercel AI SDK
      const result = await generateText({
        model: providerModule[this.name](modelName, modelOptions),
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
      });

      // Return the response in our expected format
      return {
        text: result.text,
        tokenUsage: {
          // The Vercel AI SDK might not provide token usage info, so we estimate
          prompt: prompt.length / 4, // Rough approximation
          completion: result.text.length / 4, // Rough approximation
          total: (prompt.length + result.text.length) / 4, // Sum of prompt and completion
        },
      };
    } catch (error) {
      // Handle specific error types
      if (error instanceof ProviderError) {
        throw error;
      }

      // Check for common error patterns
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw ProviderError.rateLimitExceeded(this.name, modelName);
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        throw ProviderError.timeout(this.name, modelName);
      }

      // Log the error for debugging
      console.warn(`Error generating response with ${this.name}:`, error);

      // Create a generic provider error
      throw ProviderError.apiError(
        this.name,
        errorMessage,
        modelName,
        errorMessage.includes('401') ? 401 : undefined,
        error instanceof Error ? error : undefined
      );
    }
  }
}

/**
 * A fallback provider for when no suitable provider is found
 */
class GenericProvider implements LLMProvider {
  name = 'generic';
  supportedModels = ['any-model']; // Will be replaced with actual models from Vercel AI SDK

  async generateResponse(
    modelName: string,
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemMessage?: string;
    }
  ): Promise<{
    text: string;
    tokenUsage: {
      prompt: number;
      completion: number;
      total: number;
    };
  }> {
    console.warn(`Using generic provider for model: ${modelName}`);
    console.warn('Please install at least one Vercel AI SDK provider package.');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      text: `This is a simulated response from model ${modelName}: ${prompt.substring(0, 20)}...`,
      tokenUsage: {
        prompt: prompt.length / 4, // Rough approximation
        completion: 50, // Simulated
        total: prompt.length / 4 + 50, // Sum of prompt and completion
      },
    };
  }
}

/**
 * Get a list of available providers with API keys
 * @returns Array of provider names with available API keys
 */
function getAvailableProviders(): string[] {
  const providerKeys = envManager.getProviderKeys();
  return Object.keys(providerKeys);
}

/**
 * Load providers based on the models requested in the config
 * This will dynamically load installed Vercel AI SDK providers
 * @param config The consensus configuration
 * @returns Array of initialized providers
 */
export function loadProviders(config: ConsensusConfig): LLMProvider[] {
  try {
    // Check which provider packages are installed and have API keys available
    const installedProviders = Object.keys(PROVIDER_PACKAGES).filter(packageName => {
      const isInstalled = isProviderInstalled(packageName);
      const hasKey = hasApiKey(PROVIDER_PACKAGES[packageName].name);
      return isInstalled && hasKey;
    });

    if (installedProviders.length === 0) {
      console.warn(
        'No AI providers found or no API keys configured. Please install at least one Vercel AI SDK provider package and configure its API key.'
      );

      // List which providers are installed but missing API keys
      const installedWithoutKeys = Object.keys(PROVIDER_PACKAGES).filter(packageName => {
        return isProviderInstalled(packageName) && !hasApiKey(PROVIDER_PACKAGES[packageName].name);
      });

      if (installedWithoutKeys.length > 0) {
        console.warn(
          `The following providers are installed but missing API keys: ${installedWithoutKeys
            .map(pkg => PROVIDER_PACKAGES[pkg].name)
            .join(', ')}`
        );
        console.warn('Please configure the appropriate environment variables in your .env file.');
      }

      // Return a generic provider as fallback
      return [new GenericProvider()];
    }

    // Create providers for each installed package
    const providers: LLMProvider[] = installedProviders.map(packageName => {
      const config = PROVIDER_PACKAGES[packageName];
      return new VercelAIProvider(config.name, packageName, config.models);
    });

    console.log('Available AI providers:', providers.map(p => p.name).join(', '));

    return providers;
  } catch (error) {
    // Handle any errors during provider loading
    console.error('Error loading providers:', error);
    return [new GenericProvider()];
  }
}
