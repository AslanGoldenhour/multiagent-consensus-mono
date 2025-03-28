import { DebateConfig, ConsensusConfig } from '../types/config';
import { DebateResult } from '../types/result';
import { LLMProvider } from '../types/provider';
import { getConsensusMethod } from './methods';
import {
  initialRoundTemplate,
  debateRoundTemplate,
  finalRoundTemplate,
  factualQueryTemplate,
  abstractQueryTemplate,
} from '../templates/debate';
import { ValidationError, ConfigurationError, ConsensusProcessError } from '../utils';

/**
 * Detects whether a query is factual or abstract
 * @param query The query to analyze
 * @returns The detected query type
 */
function detectQueryType(query: string): 'factual' | 'abstract' | 'unknown' {
  const query_lower = query.toLowerCase();

  // Check for arithmetic operations and simple factual questions
  const arithmeticRegex = /[\d\s+\-*=(),.%]+/;
  const factualIndicators = [
    'what is',
    'calculate',
    'solve',
    'how many',
    'when did',
    'who is',
    'where is',
    'which',
    'list',
    'name',
    'define',
    'explain',
  ];

  // Check for abstract/philosophical questions
  const abstractIndicators = [
    'why',
    'how should',
    'meaning of',
    'purpose of',
    'ethics of',
    'moral',
    'philosophically',
    'subjective',
    'perspective',
    'impact of',
    'implications',
    'meaning',
    'value',
    'believe',
    'opinion',
    'thoughts on',
    'feel about',
    'what is the meaning',
    'what is the purpose',
    'philosophical',
    'philosophy',
  ];

  // Test if query consists primarily of an arithmetic expression
  const match = query_lower.match(arithmeticRegex);
  if (match && match[0] && match[0].length > query_lower.length * 0.5) {
    return 'factual';
  }

  // Check for abstract indicators first (since these take precedence)
  for (const indicator of abstractIndicators) {
    if (query_lower.includes(indicator)) {
      return 'abstract';
    }
  }

  // Check for factual indicators at the start of the query
  for (const indicator of factualIndicators) {
    if (query_lower.startsWith(indicator)) {
      // Special case: if it starts with "what is" but contains abstract content
      if (
        indicator === 'what is' &&
        (query_lower.includes('meaning') ||
          query_lower.includes('purpose') ||
          query_lower.includes('philosophy'))
      ) {
        return 'abstract';
      }
      return 'factual';
    }
  }

  // Default to unknown if no clear indicators
  return 'unknown';
}

/**
 * TypeScript interface for prompt template functions
 */
type QueryTemplate = (query: string) => string;
type DebateTemplate = (
  query: string,
  roundNumber: number,
  previousResponses: Array<{ model: string; response: string }>
) => string;

/**
 * TypeScript interface for the internal debate config with all fields required
 */
interface RequiredDebateConfig {
  streaming: boolean;
  minRounds: number;
  useSpecializedPrompts: boolean;
  revealModelIdentities: boolean;
  promptTemplates: {
    initialRound: QueryTemplate;
    debateRound: DebateTemplate;
    finalRound: DebateTemplate;
  };
  consensusChecker: ((responses: Array<{ model: string; response: string }>) => boolean) | null;
}

/**
 * Interface for history entries to provide proper type checking
 */
interface DebateRoundHistory {
  round: number;
  responses: Array<{
    model: string;
    response: string;
    confidence?: number;
  }>;
}

/**
 * Default values for debate configuration
 */
const DEFAULT_DEBATE_CONFIG: RequiredDebateConfig = {
  streaming: false,
  minRounds: 1,
  useSpecializedPrompts: true,
  revealModelIdentities: true,
  promptTemplates: {
    initialRound: initialRoundTemplate,
    debateRound: debateRoundTemplate,
    finalRound: finalRoundTemplate,
  },
  consensusChecker: null,
};

/**
 * Class for managing multi-round debates between LLM models
 */
export class DebateManager {
  private config: ConsensusConfig;
  private providers: LLMProvider[];
  private debateConfig: RequiredDebateConfig;

  /**
   * Create a new DebateManager
   * @param config ConsensusConfig with optional debate settings
   * @param providers Array of LLM providers to use for the debate
   */
  constructor(config: ConsensusConfig, providers: LLMProvider[]) {
    this.config = config;
    this.providers = providers;

    // Apply default debate configuration
    this.debateConfig = {
      ...DEFAULT_DEBATE_CONFIG,
      ...(config.debate || {}),
      // Ensure promptTemplates is fully populated
      promptTemplates: {
        ...DEFAULT_DEBATE_CONFIG.promptTemplates,
        ...(config.debate?.promptTemplates || {}),
      },
    };

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Validate the debate configuration
   * @throws ValidationError if configuration is invalid
   */
  private validateConfig(): void {
    if (this.config.models.length < 2) {
      throw new ValidationError('At least 2 models are required for a debate');
    }

    if (this.debateConfig.minRounds < 1) {
      throw new ValidationError('Minimum rounds must be at least 1');
    }

    if ((this.config.maxRounds || 3) < this.debateConfig.minRounds) {
      throw new ValidationError('Maximum rounds must be greater than or equal to minimum rounds');
    }
  }

  /**
   * Run a debate process on a query
   * @param query The query to debate
   * @returns Promise resolving to the debate result
   */
  async runDebate(query: string): Promise<DebateResult> {
    const startTime = Date.now();
    let totalTokens = 0;
    const history: DebateRoundHistory[] = [];
    const enhancedHistory: Array<{
      round: number;
      responses: Array<{
        model: string;
        response: string;
        confidence?: number;
        agreements?: Array<{
          model: string;
          agrees: boolean;
          explanation?: string;
        }>;
      }>;
    }> = [];

    // Detect query type if specialized prompts are enabled
    const queryType = this.debateConfig.useSpecializedPrompts ? detectQueryType(query) : 'unknown';

    // Run initial round
    const initialResponses = await this.runInitialRound(query, queryType);
    totalTokens += initialResponses.reduce((sum, r) => sum + r.tokenUsage, 0);

    // Add initial round to history
    history.push({
      round: 1,
      responses: initialResponses.map(r => ({
        model: r.model,
        response: r.response,
        confidence: r.confidence,
      })),
    });

    enhancedHistory.push({
      round: 1,
      responses: initialResponses.map(r => ({
        model: r.model,
        response: r.response,
        confidence: r.confidence,
      })),
    });

    // Set up for consensus checking
    let consensusReached = false;
    let consensusRound: number | undefined = undefined;
    let currentRound = 1;
    let finalAnswer = '';
    const consensusMethod = getConsensusMethod(this.config.consensusMethod || 'majority');
    const maxRounds = this.config.maxRounds || 3;
    const agreementLevels: Array<{ round: number; agreementLevel: number }> = [];

    // Run additional rounds if needed
    while (!consensusReached && currentRound < maxRounds) {
      currentRound++;
      const isFinalRound = currentRound === maxRounds;

      // Run the next debate round
      const roundResponses = await this.runDebateRound(
        query,
        history[currentRound - 2].responses,
        currentRound,
        isFinalRound
      );

      // Track token usage
      totalTokens += roundResponses.reduce((sum, r) => sum + r.tokenUsage, 0);

      // Process and extract agreement information
      const processedResponses = roundResponses.map(response => {
        // For rounds after the first, try to extract agreement information
        const agreements =
          currentRound > 1
            ? this.extractAgreements(response.response, history[currentRound - 2].responses)
            : undefined;

        return {
          model: response.model,
          response: response.response,
          confidence: response.confidence,
          tokenUsage: response.tokenUsage,
          agreements,
        };
      });

      // Add round to histories
      history.push({
        round: currentRound,
        responses: processedResponses.map(r => ({
          model: r.model,
          response: r.response,
          confidence: r.confidence,
        })),
      });

      enhancedHistory.push({
        round: currentRound,
        responses: processedResponses.map(r => ({
          model: r.model,
          response: r.response,
          confidence: r.confidence,
          agreements: r.agreements,
        })),
      });

      // Check for consensus
      const consensusResult = this.debateConfig.consensusChecker
        ? {
            consensusReached: this.debateConfig.consensusChecker(
              processedResponses.map(r => ({ model: r.model, response: r.response }))
            ),
            answer: processedResponses[0].response, // Will be overridden if consensus is reached
          }
        : consensusMethod(processedResponses);

      // Calculate agreement level for this round
      const agreementLevel = this.calculateAgreementLevel(processedResponses);
      agreementLevels.push({
        round: currentRound,
        agreementLevel,
      });

      // If consensus reached and we've done the minimum rounds, we can stop
      if (consensusResult.consensusReached && currentRound >= this.debateConfig.minRounds) {
        consensusReached = true;
        consensusRound = currentRound;
        finalAnswer = consensusResult.answer;
        break;
      }

      // If this is the final round, use the consensus method to force a decision
      if (isFinalRound) {
        finalAnswer = consensusResult.answer;
      }
    }

    // Calculate agreement trend
    const trend = this.calculateAgreementTrend(agreementLevels);

    // Create the result
    const result: DebateResult = {
      answer: finalAnswer,
      models: this.config.models,
      metadata: {
        totalTokens,
        processingTimeMs: Date.now() - startTime,
        rounds: currentRound,
        consensusMethod: this.config.consensusMethod || 'majority',
        confidenceScores: this.extractConfidenceScores(history[currentRound - 1].responses),
        cachingEnabled: this.config.cache?.enabled || false,
      },
      debateMetadata: {
        queryType,
        consensusReached,
        consensusRound: consensusRound || undefined,
        usedSpecializedPrompts: this.debateConfig.useSpecializedPrompts,
        agreementAnalysis: {
          byRound: agreementLevels,
          trend,
        },
      },
    };

    // Include history if requested or if using enhanced history
    if (this.config.output?.includeHistory) {
      result.history = history as any; // Type coercion to satisfy interface
    }

    // Include enhanced history with agreements
    result.enhancedHistory = enhancedHistory;

    return result;
  }

  /**
   * Run the initial round of the debate where each model provides a first response
   * @param query The query to debate
   * @param queryType The detected type of query
   * @returns Responses from each model
   */
  private async runInitialRound(
    query: string,
    queryType: 'factual' | 'abstract' | 'unknown'
  ): Promise<
    Array<{
      model: string;
      response: string;
      confidence: number;
      tokenUsage: number;
    }>
  > {
    const promptTemplateFunc = this.debateConfig.promptTemplates.initialRound;
    let prompt = promptTemplateFunc(query);

    // If using specialized prompts, override with type-specific template
    if (this.debateConfig.useSpecializedPrompts && queryType !== 'unknown') {
      prompt = queryType === 'factual' ? factualQueryTemplate(query) : abstractQueryTemplate(query);
    }

    // Get a response from each model
    const responses = await Promise.all(
      this.config.models.map(async model => {
        const modelConfig = this.config.modelConfig?.[model] || {};

        // Find a provider that supports this model
        const provider = this.providers.find(p => p.supportedModels.includes(model));

        if (!provider) {
          throw new ConfigurationError(`No provider available for model: ${model}`);
        }

        try {
          const result = await provider.generateResponse(model, prompt, {
            temperature: modelConfig.temperature || 0.7,
            maxTokens: modelConfig.maxTokens,
            systemMessage: modelConfig.systemPrompt,
          });

          return {
            model,
            response: result.text,
            confidence: 0.9, // Default high confidence for first round
            tokenUsage: result.tokenUsage.total,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new ConsensusProcessError(
            `Error generating response from model ${model}: ${errorMessage}`
          );
        }
      })
    );

    return responses;
  }

  /**
   * Run a subsequent round of debate
   * @param query The original query
   * @param previousResponses Responses from the previous round
   * @param roundNumber The current round number
   * @param isFinalRound Whether this is the final round
   * @returns Responses from each model
   */
  private async runDebateRound(
    query: string,
    previousResponses: Array<{
      model: string;
      response: string;
      confidence?: number;
    }>,
    roundNumber: number,
    isFinalRound: boolean
  ): Promise<
    Array<{
      model: string;
      response: string;
      confidence: number;
      tokenUsage: number;
    }>
  > {
    // Create previous responses array, deciding whether to reveal model identities
    const formattedPreviousResponses = previousResponses.map((resp, index) => ({
      model: this.debateConfig.revealModelIdentities ? resp.model : `Model ${index + 1}`,
      response: resp.response,
    }));

    // Choose the appropriate template based on whether this is the final round
    const promptTemplateFunc = isFinalRound
      ? this.debateConfig.promptTemplates.finalRound
      : this.debateConfig.promptTemplates.debateRound;

    // Get a response from each model
    const responses = await Promise.all(
      this.config.models.map(async model => {
        const modelConfig = this.config.modelConfig?.[model] || {};

        // Find a provider that supports this model
        const provider = this.providers.find(p => p.supportedModels.includes(model));

        if (!provider) {
          throw new ConfigurationError(`No provider available for model: ${model}`);
        }

        try {
          // Generate prompt using the appropriate template
          const prompt = promptTemplateFunc(query, roundNumber, formattedPreviousResponses);

          const result = await provider.generateResponse(model, prompt, {
            temperature: modelConfig.temperature || (isFinalRound ? 0.5 : 0.7), // Lower temperature for final round
            maxTokens: modelConfig.maxTokens,
            systemMessage: modelConfig.systemPrompt,
          });

          // Extract confidence from final round responses if possible
          let confidence = 0.8; // Default confidence
          if (isFinalRound) {
            const extractedConfidence = this.extractConfidence(result.text);
            if (extractedConfidence !== undefined) {
              confidence = extractedConfidence;
            }
          }

          return {
            model,
            response: result.text,
            confidence,
            tokenUsage: result.tokenUsage.total,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new ConsensusProcessError(
            `Error generating response from model ${model} in round ${roundNumber}: ${errorMessage}`
          );
        }
      })
    );

    return responses;
  }

  /**
   * Extract confidence score from a model's response
   * @param text The response text
   * @returns Extracted confidence score or undefined if none found
   */
  private extractConfidence(text: string): number | undefined {
    // Look for confidence explicitly mentioned in the text
    const confidenceRegex = /confidence:\s*(0\.\d+|1\.0|1|0)/i;
    const match = text.match(confidenceRegex);

    if (match && match[1]) {
      const confidence = parseFloat(match[1]);
      return Math.min(Math.max(confidence, 0), 1); // Clamp between 0 and 1
    }

    return undefined;
  }

  /**
   * Extract agreement information from a model response
   * @param response The model's response text
   * @param previousResponses The responses from the previous round
   * @returns Array of agreement information or undefined if none found
   */
  private extractAgreements(
    response: string,
    previousResponses: Array<{
      model: string;
      response: string;
    }>
  ):
    | Array<{
        model: string;
        agrees: boolean;
        explanation?: string;
      }>
    | undefined {
    const agreements = [];

    // For each previous response, check if the current response mentions agreement/disagreement
    for (const prevResp of previousResponses) {
      const modelName = prevResp.model;

      // Simple regex-based extraction - could be enhanced with more sophisticated NLP
      const agreeRegex = new RegExp(
        `(agree|concur|support|correct|accurate).*?(${modelName})`,
        'i'
      );
      const disagreeRegex = new RegExp(
        `(disagree|incorrect|inaccurate|wrong|mistaken).*?(${modelName})`,
        'i'
      );

      const agreeMatch = response.match(agreeRegex);
      const disagreeMatch = response.match(disagreeRegex);

      if (agreeMatch || disagreeMatch) {
        agreements.push({
          model: modelName,
          agrees: !!agreeMatch,
          explanation: this.extractExplanationContext(
            response,
            agreeMatch || disagreeMatch || null
          ),
        });
      }
    }

    return agreements.length > 0 ? agreements : undefined;
  }

  /**
   * Extract a brief explanation context around a match
   * @param text The full text
   * @param match The regex match
   * @returns A brief explanation or undefined
   */
  private extractExplanationContext(
    text: string,
    match: RegExpMatchArray | null
  ): string | undefined {
    if (!match || match.index === undefined) return undefined;

    // Extract some context around the match
    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + match[0].length + 100);

    return text.substring(start, end).trim();
  }

  /**
   * Calculate the level of agreement between responses
   * @param responses The responses to analyze
   * @returns Agreement level between 0 and 1
   */
  private calculateAgreementLevel(
    responses: Array<{
      model: string;
      response: string;
      agreements?: Array<{
        model: string;
        agrees: boolean;
      }>;
    }>
  ): number {
    // Without agreement information, we can't calculate
    if (!responses.some(r => r.agreements && r.agreements.length > 0)) {
      return 0.5; // Default to middle value
    }

    // Count total agreements and disagreements
    let totalAgreements = 0;
    let totalRelationships = 0;

    for (const response of responses) {
      if (response.agreements && response.agreements.length > 0) {
        for (const agreement of response.agreements) {
          totalRelationships++;
          if (agreement.agrees) {
            totalAgreements++;
          }
        }
      }
    }

    return totalRelationships > 0 ? totalAgreements / totalRelationships : 0.5;
  }

  /**
   * Calculate the trend in agreement levels across rounds
   * @param agreementLevels Agreement levels by round
   * @returns The trend classification
   */
  private calculateAgreementTrend(
    agreementLevels: Array<{
      round: number;
      agreementLevel: number;
    }>
  ): 'increasing' | 'decreasing' | 'stable' | 'fluctuating' {
    if (agreementLevels.length <= 1) {
      return 'stable';
    }

    // Calculate differences between consecutive rounds
    const differences = [];
    for (let i = 1; i < agreementLevels.length; i++) {
      differences.push(agreementLevels[i].agreementLevel - agreementLevels[i - 1].agreementLevel);
    }

    // Check if all differences are positive (increasing)
    const isIncreasing = differences.every(diff => diff > 0.05);

    // Check if all differences are negative (decreasing)
    const isDecreasing = differences.every(diff => diff < -0.05);

    // Check if all differences are small (stable)
    const isStable = differences.every(diff => Math.abs(diff) <= 0.05);

    // Otherwise, it's fluctuating
    return isIncreasing
      ? 'increasing'
      : isDecreasing
        ? 'decreasing'
        : isStable
          ? 'stable'
          : 'fluctuating';
  }

  /**
   * Extract confidence scores from responses
   * @param responses The responses to extract scores from
   * @returns Record of model names to confidence scores
   */
  private extractConfidenceScores(
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
