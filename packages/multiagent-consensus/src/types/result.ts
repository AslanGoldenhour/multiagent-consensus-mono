/**
 * Result of a consensus process
 */
export interface ConsensusResult {
  /**
   * The final answer produced by the consensus process
   */
  answer: string;

  /**
   * Models that participated in the consensus process
   */
  models: string[];

  /**
   * Metadata about the consensus process
   */
  metadata: {
    /**
     * Total tokens used
     */
    totalTokens: number;

    /**
     * Processing time in milliseconds
     */
    processingTimeMs: number;

    /**
     * Number of debate rounds
     */
    rounds: number;

    /**
     * The consensus method used
     */
    consensusMethod: 'majority' | 'supermajority' | 'unanimous';

    /**
     * Confidence scores for each model (0-1)
     */
    confidenceScores?: Record<string, number>;

    /**
     * Whether caching was enabled for this process
     */
    cachingEnabled?: boolean;

    /**
     * Cache statistics if caching was enabled
     */
    cacheStats?: {
      /**
       * Number of cache hits (responses served from cache)
       */
      hits: number;

      /**
       * Number of cache misses (responses generated from models)
       */
      misses: number;

      /**
       * Estimated response time saved due to cache hits (ms)
       */
      timeSaved: number;
    };
  };

  /**
   * Complete history of the debate
   */
  history?: {
    round: number;
    responses: {
      model: string;
      response: string;
      confidence?: number;
    }[];
  }[];
}

/**
 * Result of a multi-round debate process
 * Extends the standard consensus result with debate-specific information
 */
export interface DebateResult extends ConsensusResult {
  /**
   * Debate-specific metadata
   */
  debateMetadata?: {
    /**
     * The query type that was detected (factual or abstract)
     */
    queryType?: 'factual' | 'abstract' | 'unknown';

    /**
     * Whether a consensus was reached naturally or forced
     */
    consensusReached: boolean;

    /**
     * The round in which consensus was reached (if applicable)
     */
    consensusRound?: number;

    /**
     * Whether specialized prompts were used
     */
    usedSpecializedPrompts?: boolean;

    /**
     * Analysis of agreement levels across rounds
     */
    agreementAnalysis?: {
      /**
       * Agreement level at each round (0-1)
       */
      byRound: Array<{
        round: number;
        agreementLevel: number;
      }>;

      /**
       * Overall agreement trend (increasing, decreasing, stable)
       */
      trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    };
  };

  /**
   * Enhanced debate history with critique information
   */
  enhancedHistory?: Array<{
    /**
     * The round number
     */
    round: number;

    /**
     * Responses from each model
     */
    responses: Array<{
      /**
       * The model that provided the response
       */
      model: string;

      /**
       * The response content
       */
      response: string;

      /**
       * Confidence score (0-1) if provided
       */
      confidence?: number;

      /**
       * Analysis of which models this response agrees/disagrees with
       * Only present in round 2 and beyond
       */
      agreements?: Array<{
        model: string;
        agrees: boolean;
        explanation?: string;
      }>;
    }>;
  }>;
}

/**
 * Streaming debate update for real-time feedback
 */
export interface DebateStreamUpdate {
  /**
   * The current state of the debate
   */
  state: 'starting' | 'in_progress' | 'completed';

  /**
   * The current round number
   */
  round: number;

  /**
   * The total number of rounds planned
   */
  totalRounds: number;

  /**
   * The model currently responding
   */
  currentModel?: string;

  /**
   * The current response content (partial or complete)
   */
  currentResponse?: string;

  /**
   * Whether the current response is complete
   */
  responseComplete: boolean;

  /**
   * The final result (only present when state is 'completed')
   */
  result?: DebateResult;
}
