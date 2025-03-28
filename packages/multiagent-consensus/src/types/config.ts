/**
 * Configuration options for the consensus process
 */
import { CacheConfig } from '../cache/types';

export interface ConsensusConfig {
  /**
   * The models to use for the consensus process
   */
  models: string[];

  /**
   * The consensus method to use
   * - majority: Simple majority vote (default)
   * - supermajority: Requires 75% or more agreement
   * - unanimous: Requires all models to agree
   */
  consensusMethod?: 'majority' | 'supermajority' | 'unanimous';

  /**
   * Maximum number of debate rounds before forcing a decision
   */
  maxRounds?: number;

  /**
   * Bias presets or custom prompts for each model
   */
  biasPresets?: {
    [modelName: string]:
      | string
      | {
          preset?: 'neutral' | 'academic' | 'conservative' | 'progressive';
          custom?: string;
        };
  };

  /**
   * API keys for different providers
   * It's recommended to use environment variables instead
   */
  apiKeys?: Record<string, string>;

  /**
   * Per-model configuration options
   */
  modelConfig?: {
    [modelName: string]: {
      /**
       * System prompt to use for this model
       */
      systemPrompt?: string;

      /**
       * Temperature setting (0-2)
       */
      temperature?: number;

      /**
       * Maximum tokens to generate
       */
      maxTokens?: number;

      /**
       * Additional model-specific parameters
       */
      additionalParams?: Record<string, any>;
    };
  };

  /**
   * Output format preferences
   */
  output?: {
    /**
     * Include detailed debate history in the result
     */
    includeHistory?: boolean;

    /**
     * Include metadata about the debate process
     */
    includeMetadata?: boolean;

    /**
     * Format of the final answer
     */
    format?: 'text' | 'json';
  };

  /**
   * Caching configuration options
   * Controls how responses are cached to improve performance and reduce API costs
   */
  cache?: CacheConfig;

  /**
   * Debate mode configuration options
   * Controls how the multi-round debate process is conducted
   */
  debate?: DebateConfig;
}

/**
 * Configuration options specific to the multi-round debate mode
 */
export interface DebateConfig {
  /**
   * Enable streaming responses in debate mode
   * When enabled, responses will be streamed back in real-time
   */
  streaming?: boolean;

  /**
   * Minimum number of debate rounds to perform regardless of consensus
   * This ensures at least a certain level of deliberation
   */
  minRounds?: number;

  /**
   * Whether to use specialized prompts based on query type
   * When enabled, different prompts will be used for factual vs abstract queries
   */
  useSpecializedPrompts?: boolean;

  /**
   * Whether to allow models to view their own previous responses
   * When enabled, models can see and critique their own previous responses
   */
  revealModelIdentities?: boolean;

  /**
   * Custom prompt templates to use for different rounds of the debate
   * If not provided, default templates will be used
   */
  promptTemplates?: {
    /**
     * Template for the initial round of the debate
     * Function receives the query and returns a prompt
     */
    initialRound?: (query: string) => string;

    /**
     * Template for subsequent rounds of the debate
     * Function receives the query, round number, and previous responses
     */
    debateRound?: (
      query: string,
      roundNumber: number,
      previousResponses: Array<{ model: string; response: string }>
    ) => string;

    /**
     * Template for the final round of the debate
     * Function receives the query, round number, and previous responses
     */
    finalRound?: (
      query: string,
      roundNumber: number,
      previousResponses: Array<{ model: string; response: string }>
    ) => string;
  };

  /**
   * Optional function to determine if consensus has been reached
   * If provided, this will be used instead of the standard consensus methods
   * Returns true if consensus has been reached, false otherwise
   */
  consensusChecker?: (responses: Array<{ model: string; response: string }>) => boolean;
}
