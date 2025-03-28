import { DebateManager } from '../consensus/debate';
import { ConsensusConfig } from '../types/config';
import { LLMProvider } from '../types/provider';

// Interface for provider response (copied from provider.ts)
interface ProviderResponse {
  text: string;
  model: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// Mock provider that returns predefined responses
class MockProvider implements LLMProvider {
  name: string;
  supportedModels: string[];
  mockResponses: Record<string, string[]>;
  responseIndex: Record<string, number>;

  constructor(name: string, supportedModels: string[], mockResponses: Record<string, string[]>) {
    this.name = name;
    this.supportedModels = supportedModels;
    this.mockResponses = mockResponses;
    this.responseIndex = {};

    // Initialize response indices
    Object.keys(mockResponses).forEach(model => {
      this.responseIndex[model] = 0;
    });
  }

  async generateResponse(model: string, prompt: string, options?: any): Promise<ProviderResponse> {
    if (!this.supportedModels.includes(model)) {
      throw new Error(`Model ${model} not supported by provider ${this.name}`);
    }

    if (!this.mockResponses[model] || this.mockResponses[model].length === 0) {
      throw new Error(`No mock responses available for model ${model}`);
    }

    // Get the next response for this model
    const responseIndex = this.responseIndex[model] || 0;
    const response = this.mockResponses[model][responseIndex];

    // Increment the response index for next time, with wrap-around
    this.responseIndex[model] = (responseIndex + 1) % this.mockResponses[model].length;

    return {
      text: response,
      model,
      tokenUsage: {
        prompt: 50,
        completion: 50,
        total: 100,
      },
    };
  }
}

describe('DebateManager', () => {
  // Test configuration
  const config: ConsensusConfig = {
    models: ['model-a', 'model-b'],
    consensusMethod: 'majority',
    maxRounds: 3,
    debate: {
      minRounds: 2,
      useSpecializedPrompts: true,
      revealModelIdentities: true,
      // Add a custom consensus checker that detects consensus from our test responses
      consensusChecker: responses => {
        // For testing purposes, if all responses mention "8", consider it consensus
        return responses.every(r => r.response.includes('8'));
      },
    },
  };

  // Create mock responses for testing
  const mockModelA = {
    'model-a': [
      // Round 1 response
      'The answer to 4+4 is 8. This is a basic arithmetic addition.',
      // Round 2 response
      'I agree with model-b that 4+4=8. It is indeed a fundamental arithmetic fact.',
      // Round 3 response (if needed)
      'After considering all perspectives, I still believe 4+4=8. Confidence: 0.95',
    ],
  };

  const mockModelB = {
    'model-b': [
      // Round 1 response
      'When we calculate 4+4, we get 8. This is elementary math.',
      // Round 2 response
      "I agree with model-a's calculation that 4+4=8. There's no dispute here.",
      // Round 3 response (if needed)
      'My final answer is that 4+4=8. This is mathematically certain. Confidence: 0.98',
    ],
  };

  // Create mock providers
  const providers: LLMProvider[] = [
    new MockProvider('Provider A', ['model-a'], mockModelA),
    new MockProvider('Provider B', ['model-b'], mockModelB),
  ];

  it('should run a complete debate and reach consensus', async () => {
    const debateManager = new DebateManager(config, providers);
    const result = await debateManager.runDebate('What is 4+4?');

    // Check the basic structure of the result
    expect(result).toBeDefined();
    expect(result.answer).toBeDefined();
    expect(result.models).toEqual(['model-a', 'model-b']);
    expect(result.metadata).toBeDefined();
    expect(result.debateMetadata).toBeDefined();
    expect(result.enhancedHistory).toBeDefined();

    // Check that consensus was reached
    expect(result.debateMetadata?.consensusReached).toBe(true);

    // The answer should contain "8" since both models agree
    expect(result.answer.includes('8')).toBe(true);

    // Should have at least 2 rounds (minRounds)
    expect(result.metadata.rounds).toBeGreaterThanOrEqual(2);

    // Should have enhanced history with the same number of rounds
    expect(result.enhancedHistory?.length).toBe(result.metadata.rounds);

    // Check for agreement information in round 2
    const round2 = result.enhancedHistory?.[1];
    expect(round2).toBeDefined();
    expect(round2?.responses.some(r => r.agreements?.length)).toBe(true);
  });

  it('should handle different query types correctly', async () => {
    const debateManager = new DebateManager(config, providers);
    const factualResult = await debateManager.runDebate('What is 4+4?');

    // Check that the query was detected as factual
    expect(factualResult.debateMetadata?.queryType).toBe('factual');

    // Create a separate debate manager for abstract query test
    const abstractConfig = { ...config };
    const abstractProviders = [
      new MockProvider('Provider A', ['model-a'], {
        'model-a': [
          'The meaning of life is a philosophical question that has been debated for centuries.',
          "After considering model-b's perspective, I think the meaning of life is subjective.",
          'My final answer acknowledges the subjective nature of meaning. Confidence: 0.7',
        ],
      }),
      new MockProvider('Provider B', ['model-b'], {
        'model-b': [
          'The meaning of life varies across cultures and philosophical traditions.',
          'I agree with model-a that this is subjective, and would add that meaning is created by individuals.',
          'My final answer emphasizes the personal creation of meaning. Confidence: 0.75',
        ],
      }),
    ];

    const abstractDebateManager = new DebateManager(abstractConfig, abstractProviders);
    const abstractResult = await abstractDebateManager.runDebate('What is the meaning of life?');

    // Check that the query was detected as abstract
    expect(abstractResult.debateMetadata?.queryType).toBe('abstract');
  });

  it('should require at least 2 models', () => {
    const invalidConfig: ConsensusConfig = {
      models: ['model-a'],
      consensusMethod: 'majority',
      maxRounds: 3,
    };

    expect(() => new DebateManager(invalidConfig, providers)).toThrow();
  });

  it('should validate minRounds and maxRounds settings', () => {
    const invalidConfig: ConsensusConfig = {
      models: ['model-a', 'model-b'],
      consensusMethod: 'majority',
      maxRounds: 2,
      debate: {
        minRounds: 3, // minRounds > maxRounds
      },
    };

    expect(() => new DebateManager(invalidConfig, providers)).toThrow();
  });
});
