import { ConsensusConfig } from '../types/config';
import { LLMProvider } from '../types/provider';
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
      // Import the Vercel AI SDK dynamically
      const aiModule = await dynamicImport('ai');
      const { generateText } = aiModule;

      // Import the provider dynamically
      const providerModule = await dynamicImport(this.providerPackage);

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
      console.warn(`Error generating response with ${this.name}:`, error);

      // Fallback to simulated response
      return {
        text: `Error with ${this.name} provider. Falling back to simulated response for ${modelName}: ${prompt.substring(0, 20)}...`,
        tokenUsage: {
          prompt: prompt.length / 4,
          completion: 50,
          total: prompt.length / 4 + 50,
        },
      };
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
 * Load providers based on the models requested in the config
 * This will dynamically load installed Vercel AI SDK providers
 * @param config The consensus configuration
 * @returns Array of initialized providers
 */
export function loadProviders(config: ConsensusConfig): LLMProvider[] {
  // Check which provider packages are installed
  const installedProviders = Object.keys(PROVIDER_PACKAGES).filter(isProviderInstalled);

  if (installedProviders.length === 0) {
    console.warn(
      'No AI providers found. Please install at least one Vercel AI SDK provider package.'
    );
    console.warn('Example: npm install @ai-sdk/openai');
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
}
