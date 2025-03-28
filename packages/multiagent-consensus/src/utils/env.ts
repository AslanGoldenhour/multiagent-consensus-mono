import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * Environment configuration utility for managing API keys and other sensitive data
 */
export class EnvManager {
  private static instance: EnvManager;
  private initialized = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   * @returns The EnvManager instance
   */
  public static getInstance(): EnvManager {
    if (!EnvManager.instance) {
      EnvManager.instance = new EnvManager();
    }
    return EnvManager.instance;
  }

  /**
   * Initialize environment variables from .env file
   * @param customPath Optional custom path to .env file
   */
  public init(customPath?: string): void {
    if (this.initialized) {
      return;
    }

    try {
      // If custom path is provided, check if file exists
      if (customPath) {
        if (fs.existsSync(customPath)) {
          dotenv.config({ path: customPath });
          this.initialized = true;
          return;
        } else {
          // eslint-disable-next-line no-console
          console.warn(`Env file not found at custom path: ${customPath}`);
        }
      }

      // Try loading from common locations
      // Support both .env and .env.local files in various locations
      const envFileNames = ['.env', '.env.local'];
      const locations = [
        // Current directory
        process.cwd(),
        // Parent directory
        path.resolve(process.cwd(), '..'),
        // Project root (2 levels up in case we're in a nested package)
        path.resolve(process.cwd(), '../..'),
        // Package directory itself
        __dirname,
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '../..'),
      ];

      // Create all possible env file paths
      const envPaths: string[] = [];
      locations.forEach(location => {
        envFileNames.forEach(fileName => {
          envPaths.push(path.resolve(location, fileName));
        });
      });

      // Try to load from each path
      for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
          dotenv.config({ path: envPath });
          this.initialized = true;
          // eslint-disable-next-line no-console
          console.log(`Loaded environment variables from ${envPath}`);
          return;
        }
      }

      // If we get here, no .env file was found
      // eslint-disable-next-line no-console
      console.warn('No .env file found. Using existing environment variables.');
      this.initialized = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading environment variables:', error);
      // Set initialized to true to prevent further attempts
      this.initialized = true;
    }
  }

  /**
   * Set environment variables programmatically
   * @param variables Record of variable names to values
   */
  public setVariables(variables: Record<string, string>): void {
    for (const [key, value] of Object.entries(variables)) {
      if (value) {
        process.env[key] = value;
      }
    }
  }

  /**
   * Get an environment variable
   * @param key The environment variable key
   * @param defaultValue Optional default value if key is not found
   * @returns The environment variable value or default value
   */
  public get(key: string, defaultValue?: string): string | undefined {
    // Make sure environment variables are loaded
    if (!this.initialized) {
      this.init();
    }
    const value = process.env[key];
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get a required environment variable
   * @param key The environment variable key
   * @throws Error if the key is not found
   * @returns The environment variable value
   */
  public getRequired(key: string): string {
    const value = this.get(key);
    if (value === undefined) {
      throw new Error(`Required environment variable ${key} is not defined`);
    }
    return value;
  }

  /**
   * Check if an environment variable is set
   * @param key The environment variable key
   * @returns True if the key exists, false otherwise
   */
  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Get all provider API keys
   * @returns Record of provider names to API keys
   */
  public getProviderKeys(): Record<string, string> {
    // Make sure environment variables are loaded
    if (!this.initialized) {
      this.init();
    }
    const providerKeys: Record<string, string> = {};
    // Common provider API key environment variables
    const keyMapping: Record<string, string[]> = {
      // Official Vercel AI SDK Providers
      openai: ['OPENAI_API_KEY'],
      anthropic: ['ANTHROPIC_API_KEY'],
      google: ['GOOGLE_API_KEY'],
      googleVertex: ['GOOGLE_APPLICATION_CREDENTIALS'],
      mistral: ['MISTRAL_API_KEY'],
      cohere: ['COHERE_API_KEY'],
      groq: ['GROQ_API_KEY'],
      amazonBedrock: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
      azure: ['AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT'],
      perplexity: ['PERPLEXITY_API_KEY'],
      xai: ['XAI_API_KEY'],
      deepseek: ['DEEPSEEK_API_KEY'],
      deepinfra: ['DEEPINFRA_API_KEY'],
      togetherai: ['TOGETHER_API_KEY'],
      fireworks: ['FIREWORKS_API_KEY'],
      replicate: ['REPLICATE_API_TOKEN'],
      cerebras: ['CEREBRAS_API_KEY'],
      luma: ['LUMA_API_KEY'],

      // Community Providers
      ollama: ['OLLAMA_HOST'],
      chromeai: ['CHROME_API_KEY'],
      friendliai: ['FRIENDLIAI_API_KEY'],
      portkey: ['PORTKEY_API_KEY'],
      cloudflareWorkersAi: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'],
      openrouter: ['OPENROUTER_API_KEY'],
      crosshatch: ['CROSSHATCH_API_KEY'],
      mixedbread: ['MIXEDBREAD_API_KEY'],
      voyage: ['VOYAGE_API_KEY'],
      mem0: ['MEM0_API_KEY'],
      spark: ['SPARK_APP_ID', 'SPARK_API_KEY', 'SPARK_API_SECRET'],
      anthropicVertex: ['GOOGLE_APPLICATION_CREDENTIALS'],
      zhipu: ['ZHIPU_API_KEY'],
      langdb: ['LANGDB_API_KEY'],
      nvidianim: ['NVIDIA_NIM_API_KEY'],
      baseten: ['BASETEN_API_KEY'],
      inflection: ['INFLECTION_API_KEY'],
    };
    // Check for each provider's API keys
    for (const [provider, keys] of Object.entries(keyMapping)) {
      // For providers with multiple keys, check if all required keys are present
      if (keys.length > 1) {
        if (keys.every(key => this.has(key))) {
          providerKeys[provider] = 'configured';
        }
      } else if (keys.length === 1) {
        const key = this.get(keys[0]);
        if (key) {
          providerKeys[provider] = key;
        }
      }
    }

    return providerKeys;
  }
}

// Export a singleton instance
export const envManager = EnvManager.getInstance();

// Auto-initialize on import
envManager.init();
