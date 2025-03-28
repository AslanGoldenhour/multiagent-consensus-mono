/**
 * Configuration options for the consensus process
 */
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
}
