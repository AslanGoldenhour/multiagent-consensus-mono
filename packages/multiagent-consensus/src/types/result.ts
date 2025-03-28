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
