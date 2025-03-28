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
  // Official Vercel AI SDK Providers
  '@ai-sdk/openai': {
    name: 'openai',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4-vision',
      'gpt-4',
      'gpt-3.5-turbo',
      'o1',
      'o1-mini',
      'o1-preview',
      'text-embedding-3-small',
      'text-embedding-3-large',
      'text-embedding-ada-002',
      'dall-e-3',
      'dall-e-2',
    ],
  },
  '@ai-sdk/anthropic': {
    name: 'anthropic',
    models: [
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2',
    ],
  },
  '@ai-sdk/azure': {
    name: 'azure',
    models: [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-3.5-turbo',
      'gpt-4-vision',
      'gpt-4-32k',
      'text-embedding-ada-002',
    ],
  },
  '@ai-sdk/amazon-bedrock': {
    name: 'amazonBedrock',
    models: [
      'anthropic.claude-3-opus-20240229',
      'anthropic.claude-3-sonnet-20240229',
      'anthropic.claude-3-haiku-20240307',
      'anthropic.claude-3.5-sonnet-20240620',
      'amazon.titan-text-express-v1',
      'amazon.titan-text-premier-v1',
      'cohere.command-light-text-v14',
      'cohere.command-r-v1',
      'meta.llama-3-8b-v1:0',
      'meta.llama-3-70b-v1:0',
      'meta.llama-3-8b-instructr-v1:0',
      'meta.llama-3-70b-instruct-v1:0',
    ],
  },
  '@ai-sdk/google': {
    name: 'google',
    models: [
      'gemini-1.0-pro',
      'gemini-1.0-pro-vision',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-pro-embedding',
    ],
  },
  '@ai-sdk/google-vertex': {
    name: 'googleVertex',
    models: [
      'gemini-1.0-pro',
      'gemini-1.0-pro-vision',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'text-bison',
      'code-bison',
      'chat-bison',
      'text-unicorn',
    ],
  },
  '@ai-sdk/mistral': {
    name: 'mistral',
    models: [
      'mistral-small-latest',
      'mistral-medium-latest',
      'mistral-large-latest',
      'mistral-large-2402',
      'mistral-medium-2312',
      'mistral-small-2402',
      'open-mistral-7b',
      'open-mixtral-8x7b',
      'pixtral-12b-2409',
      'pixtral-large-latest',
    ],
  },
  '@ai-sdk/xai': {
    name: 'xai',
    models: [
      'grok-1',
      'grok-1-vision',
      'grok-beta',
      'grok-vision-beta',
      'grok-2-1212',
      'grok-2-vision-1212',
    ],
  },
  '@ai-sdk/togetherai': {
    name: 'togetherai',
    models: [
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'meta-llama/Llama-3.3-70B-Instruct',
      'meta-llama/Meta-Llama-3-8B-Instruct',
      'meta-llama/Meta-Llama-3-70B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.2',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'teknium/OpenHermes-2.5-Mistral-7B',
      'togethercomputer/StripedHyena-Nous-7B',
    ],
  },
  '@ai-sdk/cohere': {
    name: 'cohere',
    models: [
      'command',
      'command-light',
      'command-r',
      'command-r-plus',
      'command-r-plus-preview',
      'command-nightly',
      'embed-english-v3.0',
      'embed-multilingual-v3.0',
    ],
  },
  '@ai-sdk/fireworks': {
    name: 'fireworks',
    models: [
      'llama-v3-8b',
      'llama-v3-70b',
      'llama-v3-1-8b',
      'llama-v3-1-70b',
      'llama-v3-1-8b-vision',
      'llama-v3-1-70b-vision',
      'llama-v3-3-8b',
      'llama-v3-3-70b',
      'mixtral-8x7b',
      'mixtral-8x22b',
      'intelliverse-20b',
    ],
  },
  '@ai-sdk/deepinfra': {
    name: 'deepinfra',
    models: [
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'meta-llama/Llama-3.3-70B-Instruct',
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
      'deepseek-ai/DeepSeek-R1-Turbo',
      'jondurbin/bagel-34b-v0.2',
      'mistralai/Mistral-7B-Instruct-v0.2',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen1.5-32B-Chat',
    ],
  },
  '@ai-sdk/deepseek': {
    name: 'deepseek',
    models: [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-vision',
      'deepseek-vl',
      'deepseek-reasoner',
    ],
  },
  '@ai-sdk/cerebras': {
    name: 'cerebras',
    models: ['llama3.1-8b', 'llama3.3-70b', 'slimpajama-6.7b', 'gpt-j-6b'],
  },
  '@ai-sdk/groq': {
    name: 'groq',
    models: [
      'llama-3-8b-8192',
      'llama-3-70b-8192',
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'mixtral-8x22b',
      'mistral-saba-24b',
      'qwen-qwq-32b',
      'deepseek-r1-distill-llama-70b',
    ],
  },
  '@ai-sdk/perplexity': {
    name: 'perplexity',
    models: [
      'sonar-small-online',
      'sonar-medium-online',
      'sonar-large-online',
      'sonar-small-chat',
      'sonar-medium-chat',
      'sonar-large-chat',
    ],
  },
  '@ai-sdk/replicate': {
    name: 'replicate',
    models: [
      'llama-3-8b',
      'llama-3-70b',
      'llama-2-70b',
      'llava',
      'mixtral-8x7b',
      'sdxl',
      'stable-diffusion',
    ],
  },
  '@ai-sdk/luma': {
    name: 'luma',
    models: ['photon', 'photon-flash', 'photon-public'],
  },

  // Community Providers
  'ollama-ai-provider': {
    name: 'ollama',
    models: [
      'llama3',
      'llama3:8b',
      'llama3:70b',
      'llama3.1',
      'gemma2',
      'qwen2:7b',
      'mistral',
      'mixtral',
      'codellama',
      'phi3',
      'orca-mini',
      'vicuna',
    ],
  },
  'chrome-ai': {
    name: 'chromeai',
    models: ['gemini-pro'],
  },
  '@friendliai/ai-provider': {
    name: 'friendliai',
    models: ['openai-compatible', 'anthropic-compatible'],
  },
  '@portkey-ai/vercel-provider': {
    name: 'portkey',
    models: [
      'openai-compatible',
      'anthropic-compatible',
      'mistral-compatible',
      'google-compatible',
    ],
  },
  'workers-ai-provider': {
    name: 'cloudflareWorkersAi',
    models: [
      '@cf/meta/llama-3-8b-instruct',
      '@cf/meta/llama-3-70b-instruct',
      '@cf/mistral/mistral-7b-instruct-v0.1',
      '@cf/mistral/mistral-large-latest',
    ],
  },
  '@openrouter/ai-sdk-provider': {
    name: 'openrouter',
    models: [
      // OpenRouter supports multiple models from different providers
      'openai/gpt-4o',
      'anthropic/claude-3-opus-20240229',
      'mistral/mistral-large-latest',
      'meta-llama/llama-3-70b-instruct',
      'google/gemini-1.5-pro',
    ],
  },
  '@crosshatch/ai-provider': {
    name: 'crosshatch',
    models: ['openai-compatible'],
  },
  'mixedbread-ai-provider': {
    name: 'mixedbread',
    models: ['openai-compatible'],
  },
  'voyage-ai-provider': {
    name: 'voyage',
    models: ['voyage-2', 'voyage-2-code', 'voyage-embedding'],
  },
  '@mem0/vercel-ai-provider': {
    name: 'mem0',
    models: ['mem0-default'],
  },
  'spark-ai-provider': {
    name: 'spark',
    models: ['sparkdesk'],
  },
  'anthropic-vertex-ai': {
    name: 'anthropicVertex',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  'zhipu-ai-provider': {
    name: 'zhipu',
    models: ['glm-4', 'glm-4v', 'glm-3-turbo'],
  },
  '@langdb/vercel-ai-provider': {
    name: 'langdb',
    models: ['langdb-default'],
  },
  'nvidia-nim-provider': {
    name: 'nvidianim',
    models: ['llama3-8b', 'llama3-70b', 'mixtral-8x7b'],
  },
  'baseten-ai-provider': {
    name: 'baseten',
    models: ['openai-compatible'],
  },
  'inflection-ai-provider': {
    name: 'inflection',
    models: ['inflection-1', 'inflection-2'],
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
