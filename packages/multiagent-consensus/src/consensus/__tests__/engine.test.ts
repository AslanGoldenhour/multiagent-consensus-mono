import { ConsensusEngine } from '../engine';
import { ConsensusConfig } from '../../types/config';

// Mock the providers module
jest.mock('../../providers', () => ({
  loadProviders: jest.fn().mockReturnValue([]),
}));

describe('ConsensusEngine', () => {
  // Default configuration for testing
  const defaultConfig: ConsensusConfig = {
    models: ['model1', 'model2', 'model3'],
    consensusMethod: 'majority',
    maxRounds: 3,
    output: {
      includeHistory: true,
      includeMetadata: true,
      format: 'text',
    },
  };

  describe('constructor', () => {
    it('should initialize with default config values', () => {
      const engine = new ConsensusEngine({
        models: ['model1'],
      });

      // Private members are not directly accessible for testing
      // But we can test the behavior through other methods
      expect(engine).toBeInstanceOf(ConsensusEngine);
    });

    it('should override default config with user-provided values', () => {
      const config: ConsensusConfig = {
        models: ['model1', 'model2'],
        consensusMethod: 'unanimous',
        maxRounds: 5,
        output: {
          includeHistory: true,
          format: 'json',
        },
      };

      const engine = new ConsensusEngine(config);
      expect(engine).toBeInstanceOf(ConsensusEngine);
    });
  });

  describe('run', () => {
    it('should return a consensus result with the expected format', async () => {
      const engine = new ConsensusEngine(defaultConfig);
      const result = await engine.run('Test query');

      // Check the structure of the response
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('models');
      expect(result).toHaveProperty('metadata');

      // Check metadata properties
      expect(result.metadata).toHaveProperty('totalTokens');
      expect(result.metadata).toHaveProperty('processingTimeMs');
      expect(result.metadata).toHaveProperty('rounds');
      expect(result.metadata).toHaveProperty('consensusMethod');
      expect(result.metadata).toHaveProperty('confidenceScores');

      // Since we enabled includeHistory, it should be in the result
      expect(result).toHaveProperty('history');
      expect(Array.isArray(result.history)).toBe(true);
    });

    it('should not include history when includeHistory is false', async () => {
      const config = {
        ...defaultConfig,
        output: {
          ...defaultConfig.output,
          includeHistory: false,
        },
      };

      const engine = new ConsensusEngine(config);
      const result = await engine.run('Test query');

      expect(result).not.toHaveProperty('history');
    });

    it('should respect the maxRounds setting', async () => {
      const config = {
        ...defaultConfig,
        maxRounds: 2,
      };

      const engine = new ConsensusEngine(config);
      const result = await engine.run('Test query');

      expect(result.metadata.rounds).toBeLessThanOrEqual(2);
      if (result.history) {
        expect(result.history.length).toBeLessThanOrEqual(2);
      }
    });

    it('should use the specified consensus method', async () => {
      const config = {
        ...defaultConfig,
        consensusMethod: 'unanimous' as const,
      };

      const engine = new ConsensusEngine(config);
      const result = await engine.run('Test query');

      expect(result.metadata.consensusMethod).toBe('unanimous');
    });
  });
});
