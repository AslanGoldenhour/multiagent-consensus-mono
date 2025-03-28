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
   * Get the singleton instance of EnvManager
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
      const envPaths = [
        '.env',
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../.env'),
      ];

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
      openai: ['OPENAI_API_KEY'],
      anthropic: ['ANTHROPIC_API_KEY'],
      google: ['GOOGLE_API_KEY'],
      mistral: ['MISTRAL_API_KEY'],
      cohere: ['COHERE_API_KEY'],
      groq: ['GROQ_API_KEY'],
      amazonBedrock: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
      azure: ['AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT'],
      perplexity: ['PERPLEXITY_API_KEY'],
      xai: ['XAI_API_KEY'],
      deepseek: ['DEEPSEEK_API_KEY'],
      togetherai: ['TOGETHER_API_KEY'],
      fireworks: ['FIREWORKS_API_KEY'],
      googleVertex: ['GOOGLE_APPLICATION_CREDENTIALS'],
      replicate: ['REPLICATE_API_TOKEN'],
      cerebras: ['CEREBRAS_API_KEY'],
      luma: ['LUMA_API_KEY'],
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
