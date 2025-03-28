import { ConsensusConfig } from '../types/config';
import { ConsensusResult, DebateResult } from '../types/result';
import { LLMProvider } from '../types/provider';
import { loadProviders } from '../providers';
import { getConsensusMethod } from './methods';
import { DebateManager } from './debate';
import { getCacheAdapter } from '../cache/adapters/factory';
import { CacheAdapter, CacheConfig } from '../cache/types';
import { createCachingMiddleware } from '../cache/middleware';
import { envManager } from '../utils';

/**
 * The main engine for running consensus processes
 */
export class ConsensusEngine {
  private config: ConsensusConfig;
  private providers: LLMProvider[] = [];
  private cacheAdapter: CacheAdapter | null = null;
  private debateManager: DebateManager | null = null;

  /**
   * Create a new ConsensusEngine
   * @param config Configuration for the consensus process
   */
  constructor(config: ConsensusConfig) {
    this.config = {
      // Default configuration values
      consensusMethod: 'majority',
      maxRounds: 3,
      output: {
        includeHistory: false,
        includeMetadata: true,
        format: 'text',
      },
      // Cache configuration with defaults
      cache: {
        enabled: process.env.ENABLE_CACHE === 'true' || false,
        adapter: (process.env.CACHE_ADAPTER as any) || 'memory',
        ttl: process.env.CACHE_TTL_SECONDS ? parseInt(process.env.CACHE_TTL_SECONDS) : 3600,
      },
      // Override with user-provided config
      ...config,
    };

    // Handle programmatically provided API keys
    this.setupApiKeys();

    // Initialize providers
    this.initializeProviders();

    // Initialize caching if enabled
    this.initializeCache();

    // Initialize debate manager if debate config is provided
    if (this.config.debate) {
      this.debateManager = new DebateManager(this.config, this.providers);
    }
  }

  /**
   * Setup API keys from config or environment variables
   */
  private setupApiKeys(): void {
    // If API keys are provided in the config, use them
    if (this.config.apiKeys) {
      const envVars: Record<string, string> = {};

      // Convert provider names to environment variable names
      for (const [provider, key] of Object.entries(this.config.apiKeys)) {
        if (key) {
          // Map common provider names to their environment variable names
          switch (provider.toLowerCase()) {
            case 'openai':
              envVars['OPENAI_API_KEY'] = key;
              break;
            case 'anthropic':
              envVars['ANTHROPIC_API_KEY'] = key;
              break;
            case 'google':
              envVars['GOOGLE_API_KEY'] = key;
              break;
            case 'mistral':
              envVars['MISTRAL_API_KEY'] = key;
              break;
            case 'cohere':
              envVars['COHERE_API_KEY'] = key;
              break;
            case 'groq':
              envVars['GROQ_API_KEY'] = key;
              break;
            case 'xai':
              envVars['XAI_API_KEY'] = key;
              break;
            case 'perplexity':
              envVars['PERPLEXITY_API_KEY'] = key;
              break;
            case 'replicate':
              envVars['REPLICATE_API_TOKEN'] = key;
              break;
            case 'deepseek':
              envVars['DEEPSEEK_API_KEY'] = key;
              break;
            case 'togetherai':
              envVars['TOGETHER_API_KEY'] = key;
              break;
            case 'fireworks':
              envVars['FIREWORKS_API_KEY'] = key;
              break;
            case 'cerebras':
              envVars['CEREBRAS_API_KEY'] = key;
              break;
            case 'luma':
              envVars['LUMA_API_KEY'] = key;
              break;
            // Add any custom mapping or fallback to default
            default:
              envVars[`${provider.toUpperCase()}_API_KEY`] = key;
              break;
          }
        }
      }

      // Set the environment variables
      envManager.setVariables(envVars);
    }
  }

  /**
   * Initialize providers based on requested models
   */
  private initializeProviders(): void {
    // Load the providers for the models specified in the config
    const rawProviders = loadProviders(this.config);

    // If caching is enabled, wrap the providers with our caching middleware
    if (this.config.cache?.enabled) {
      // Initialize caching if not already done
      if (!this.cacheAdapter) {
        this.initializeCache();
      }

      // Create the caching middleware with our config
      const wrapWithCaching = createCachingMiddleware(this.config.cache);

      // Wrap each provider with caching
      this.providers = rawProviders.map(provider => {
        return wrapWithCaching.wrapProviderWithCaching(provider);
      });
    } else {
      // If caching is disabled, use the raw providers
      this.providers = rawProviders;
    }
  }

  /**
   * Initialize the caching system if enabled
   */
  private initializeCache(): void {
    if (this.config.cache?.enabled) {
      // Set up cache adapter
      this.cacheAdapter = getCacheAdapter(
        this.config.cache.adapter,
        this.config.cache.adapterOptions
      );
      // Our custom caching system works by directly intercepting provider calls
      // before they reach the Vercel AI SDK, so we don't need middleware here
    }
  }

  /**
   * Access to the cache adapter for direct cache operations
   */
  public get cache(): CacheAdapter | null {
    return this.cacheAdapter;
  }

  /**
   * Run a consensus process to answer a query
   * @param query The query to answer
   * @returns A promise that resolves to the consensus result
   */
  async run(query: string): Promise<ConsensusResult> {
    const startTime = Date.now();
    let totalTokens = 0;
    const history: ConsensusResult['history'] = [];

    // Initial responses from each model
    const initialResponses = await this.getInitialResponses(query);
    history.push({
      round: 1,
      responses: initialResponses.map(r => ({
        model: r.model,
        response: r.response,
        confidence: r.confidence,
      })),
    });

    // Update token count
    totalTokens += initialResponses.reduce((sum, r) => sum + r.tokenUsage, 0);

    // Check if we've reached consensus
    let consensusReached = false;
    let currentRound = 1;
    let finalAnswer = '';
    const consensusMethod = getConsensusMethod(this.config.consensusMethod || 'majority');

    // Run additional rounds if needed
    while (!consensusReached && currentRound < (this.config.maxRounds || 3)) {
      currentRound++;

      // In a real implementation, this would:
      // 1. Have models debate each other's responses
      // 2. Generate new responses based on the debate
      // 3. Check if consensus has been reached
      // 4. If not, continue to the next round

      // For this simple implementation, we'll just simulate additional rounds
      const roundResponses = await this.getDebateRound(
        query,
        history[currentRound - 2].responses,
        currentRound
      );

      history.push({
        round: currentRound,
        responses: roundResponses.map(r => ({
          model: r.model,
          response: r.response,
          confidence: r.confidence,
        })),
      });

      // Update token count
      totalTokens += roundResponses.reduce((sum, r) => sum + r.tokenUsage, 0);

      // Check if we've reached consensus
      const consensusResult = consensusMethod(roundResponses);
      if (consensusResult.consensusReached) {
        consensusReached = true;
        finalAnswer = consensusResult.answer;
      }
    }

    // If we've exhausted our rounds without consensus, use the last round's majority
    if (!consensusReached) {
      const forcedConsensus = consensusMethod(history[currentRound - 1].responses);
      finalAnswer = forcedConsensus.answer;
    }

    // Prepare the result
    const result: ConsensusResult = {
      answer: finalAnswer,
      models: this.config.models,
      metadata: {
        totalTokens,
        processingTimeMs: Date.now() - startTime,
        rounds: currentRound,
        consensusMethod: this.config.consensusMethod || 'majority',
        confidenceScores: this.getConfidenceScores(history[currentRound - 1].responses),
        cachingEnabled: this.config.cache?.enabled || false,
        // Include cache statistics if available
        // In a real implementation, we would gather these from the middleware
        ...(this.config.cache?.enabled && {
          cacheStats: {
            hits: 0, // Placeholder for actual statistics from caching middleware
            misses: 0, // Placeholder for actual statistics from caching middleware
            timeSaved: 0, // Placeholder for actual statistics from caching middleware
          },
        }),
      },
    };

    // Include history if requested
    if (this.config.output?.includeHistory) {
      result.history = history;
    }

    return result;
  }

  /**
   * Run a debate process to answer a query with multi-round deliberation
   * @param query The query to debate
   * @returns A promise that resolves to the debate result
   */
  async runDebate(query: string): Promise<DebateResult> {
    if (!this.debateManager) {
      this.debateManager = new DebateManager(this.config, this.providers);
    }
    return this.debateManager.runDebate(query);
  }

  /**
   * Get initial responses from all models
   * @param query The query to answer
   * @returns Array of model responses
   */
  private async getInitialResponses(query: string): Promise<
    Array<{
      model: string;
      response: string;
      confidence: number;
      tokenUsage: number;
    }>
  > {
    // In a real implementation, this would call the actual LLM providers
    // For now, we'll return simulated responses
    return Promise.resolve(
      this.config.models.map(model => ({
        model,
        response: `This is a simulated response from ${model}`,
        confidence: Math.random() * 0.5 + 0.5, // Random confidence between 0.5 and 1.0
        tokenUsage: 100, // Simulated token usage
      }))
    );
  }

  /**
   * Run a debate round
   * @param query The original query
   * @param previousResponses Responses from the previous round
   * @param roundNumber The current round number
   * @returns Array of model responses
   */
  private async getDebateRound(
    query: string,
    previousResponses: Array<{
      model: string;
      response: string;
      confidence?: number;
    }>,
    roundNumber: number
  ): Promise<
    Array<{
      model: string;
      response: string;
      confidence: number;
      tokenUsage: number;
    }>
  > {
    // In a real implementation, this would call the actual LLM providers with
    // a prompt that includes the previous responses to facilitate debate
    // For now, we'll return simulated responses
    return Promise.resolve(
      this.config.models.map(model => ({
        model,
        response: `This is a simulated response from ${model} for round ${roundNumber}`,
        confidence: Math.random() * 0.5 + 0.5, // Random confidence between 0.5 and 1.0
        tokenUsage: 100, // Simulated token usage
      }))
    );
  }

  /**
   * Extract confidence scores from the final round responses
   * @param responses The responses from the final round
   * @returns Record of model names to confidence scores
   */
  private getConfidenceScores(
    responses: Array<{
      model: string;
      response: string;
      confidence?: number;
    }>
  ): Record<string, number> {
    const scores: Record<string, number> = {};
    responses.forEach(response => {
      if (response.confidence !== undefined) {
        scores[response.model] = response.confidence;
      }
    });
    return scores;
  }
}
