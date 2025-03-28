import { Validator } from '../validation';
import { ValidationError, ConfigurationError } from '../errors';
import { validateEnvironment } from '../validation';

// Mock the process.env
const originalEnv = process.env;

beforeEach(() => {
  // Reset process.env for each test
  process.env = { ...originalEnv };
});

afterAll(() => {
  // Restore process.env after all tests
  process.env = originalEnv;
});

describe('Validator', () => {
  describe('notEmpty', () => {
    it('should return the value if it is not empty (string)', () => {
      expect(Validator.notEmpty('test', 'testParam')).toBe('test');
    });

    it('should return the value if it is not empty (array)', () => {
      const arr = [1, 2, 3];
      expect(Validator.notEmpty(arr, 'testParam')).toBe(arr);
    });

    it('should return the value if it is not empty (object)', () => {
      const obj = { key: 'value' };
      expect(Validator.notEmpty(obj, 'testParam')).toBe(obj);
    });

    it('should throw ValidationError if value is null', () => {
      expect(() => Validator.notEmpty(null, 'testParam')).toThrow(ValidationError);
      expect(() => Validator.notEmpty(null, 'testParam')).toThrow('Empty input for testParam');
    });

    it('should throw ValidationError if value is undefined', () => {
      expect(() => Validator.notEmpty(undefined, 'testParam')).toThrow(ValidationError);
    });

    it('should throw ValidationError if value is an empty string', () => {
      expect(() => Validator.notEmpty('', 'testParam')).toThrow(ValidationError);
      expect(() => Validator.notEmpty('  ', 'testParam')).toThrow(ValidationError);
    });

    it('should throw ValidationError if value is an empty array', () => {
      expect(() => Validator.notEmpty([], 'testParam')).toThrow(ValidationError);
    });
  });

  describe('isType', () => {
    it('should return the value if it is of the correct type', () => {
      expect(Validator.isType<string>('test', 'testParam', 'string')).toBe('test');
      expect(Validator.isType<number>(123, 'testParam', 'number')).toBe(123);
      expect(Validator.isType<boolean>(true, 'testParam', 'boolean')).toBe(true);
      expect(Validator.isType<object>({}, 'testParam', 'object')).toEqual({});
      expect(Validator.isType<unknown[]>([], 'testParam', 'array')).toEqual([]);

      // Use a proper function type instead of the banned Function type
      type TestFn = () => void;
      const fn: TestFn = () => {
        /* empty */
      };
      expect(Validator.isType<TestFn>(fn, 'testParam', 'function')).toBe(fn);
    });

    it('should throw ValidationError for invalid types', () => {
      expect(() => Validator.isType('test', 'testParam', 'number')).toThrow(ValidationError);
      expect(() => Validator.isType(123, 'testParam', 'string')).toThrow(ValidationError);
      expect(() => Validator.isType({}, 'testParam', 'array')).toThrow(ValidationError);
      expect(() => Validator.isType([], 'testParam', 'object')).toThrow(ValidationError);

      // Use a proper function type
      type TestFn = () => void;
      const fn: TestFn = () => {
        /* empty */
      };
      expect(() => Validator.isType(fn, 'testParam', 'string')).toThrow(ValidationError);
    });
  });

  describe('inRange', () => {
    it('should return the value if it is within the range', () => {
      expect(Validator.inRange(5, 'testParam', 0, 10)).toBe(5);
      expect(Validator.inRange(0, 'testParam', 0, 10)).toBe(0);
      expect(Validator.inRange(10, 'testParam', 0, 10)).toBe(10);
      expect(Validator.inRange(5.5, 'testParam', 5, 6)).toBe(5.5);
    });

    it('should throw ValidationError for numbers outside range', () => {
      expect(() => Validator.inRange(-1, 'testParam', 0, 10)).toThrow(ValidationError);
      expect(() => Validator.inRange(11, 'testParam', 0, 10)).toThrow(ValidationError);

      // Check exact error message
      expect(() => Validator.inRange(-1, 'testParam', 0, 10)).toThrow('outside the allowed range');
    });

    it('should throw ValidationError for non-numeric values', () => {
      // Need to cast as any since TypeScript won't allow string to number parameter
      expect(() => Validator.inRange('5' as unknown as number, 'testParam', 0, 10)).toThrow(
        ValidationError
      );
      expect(() => Validator.inRange(NaN, 'testParam', 0, 10)).toThrow(ValidationError);
    });
  });

  describe('oneOf', () => {
    it('should return the value if it is one of the allowed values', () => {
      expect(Validator.oneOf('a', 'testParam', ['a', 'b', 'c'])).toBe('a');
      expect(Validator.oneOf(1, 'testParam', [1, 2, 3])).toBe(1);
    });

    it('should throw ValidationError if value is not one of the allowed values', () => {
      expect(() => Validator.oneOf('d', 'testParam', ['a', 'b', 'c'])).toThrow(ValidationError);
      expect(() => Validator.oneOf(4, 'testParam', [1, 2, 3])).toThrow(ValidationError);

      // Check exact error message
      expect(() => Validator.oneOf('d', 'testParam', ['a', 'b', 'c'])).toThrow(
        'not one of the allowed values'
      );
    });
  });

  describe('modelName', () => {
    it('should return the model name if it is available in a simple array', () => {
      const availableModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus'];
      expect(Validator.modelName('gpt-4', availableModels)).toBe('gpt-4');
    });

    it('should throw ValidationError if model name is not available', () => {
      const availableModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus'];
      expect(() => Validator.modelName('llama-3', availableModels)).toThrow(ValidationError);
      expect(() => Validator.modelName('llama-3', availableModels)).toThrow(
        'Model "llama-3" is not available'
      );
    });

    it('should throw ValidationError if model name is empty', () => {
      const availableModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus'];
      expect(() => Validator.modelName('', availableModels)).toThrow(ValidationError);
    });
  });

  describe('consensusConfig', () => {
    it('should validate a complete valid configuration', () => {
      const config = {
        models: ['gpt-4', 'claude-3-opus'],
        consensusMethod: 'majority' as const,
        maxRounds: 3,
        output: {
          format: 'json' as const,
          includeHistory: true,
          includeMetadata: true,
        },
        modelConfig: {
          'gpt-4': {
            temperature: 0.7,
            maxTokens: 2000,
          },
        },
      };

      expect(() => Validator.consensusConfig(config)).not.toThrow();
    });

    it('should throw ConfigurationError if models are missing', () => {
      const config = {
        consensusMethod: 'majority' as const,
      };

      expect(() => Validator.consensusConfig(config)).toThrow(ConfigurationError);
      expect(() => Validator.consensusConfig(config)).toThrow(
        'Missing required configuration parameter: models'
      );
    });

    it('should throw ConfigurationError if models are empty', () => {
      const config = {
        models: [],
        consensusMethod: 'majority' as const,
      };

      expect(() => Validator.consensusConfig(config)).toThrow(ConfigurationError);
    });

    it('should throw ValidationError if consensusMethod is invalid', () => {
      const config = {
        models: ['gpt-4', 'claude-3-opus'],
        consensusMethod: 'invalid-method',
      };

      expect(() => Validator.consensusConfig(config as any)).toThrow(ValidationError);
      expect(() => Validator.consensusConfig(config as any)).toThrow(
        'Invalid input for consensusMethod'
      );
    });

    it('should throw ConfigurationError if maxRounds is invalid', () => {
      const config1 = {
        models: ['gpt-4', 'claude-3-opus'],
        maxRounds: 0,
      };

      const config2 = {
        models: ['gpt-4', 'claude-3-opus'],
        maxRounds: -1,
      };

      expect(() => Validator.consensusConfig(config1)).toThrow(ConfigurationError);
      expect(() => Validator.consensusConfig(config2)).toThrow(ConfigurationError);
    });

    it('should throw ValidationError if output format is invalid', () => {
      const config = {
        models: ['gpt-4', 'claude-3-opus'],
        output: {
          format: 'invalid-format',
        },
      };

      expect(() => Validator.consensusConfig(config as any)).toThrow(ValidationError);
      expect(() => Validator.consensusConfig(config as any)).toThrow(
        'Invalid input for output.format'
      );
    });

    it('should throw ValidationError if includeHistory is not a boolean', () => {
      const config = {
        models: ['gpt-4', 'claude-3-opus'],
        output: {
          includeHistory: 'yes',
        },
      };

      expect(() => Validator.consensusConfig(config as any)).toThrow(ValidationError);
      expect(() => Validator.consensusConfig(config as any)).toThrow(
        'Invalid input for output.includeHistory'
      );
    });

    it('should throw ValidationError if temperature is outside the valid range', () => {
      const config = {
        models: ['gpt-4', 'claude-3-opus'],
        modelConfig: {
          'gpt-4': {
            temperature: 3,
          },
        },
      };

      expect(() => Validator.consensusConfig(config)).toThrow(ValidationError);
      expect(() => Validator.consensusConfig(config)).toThrow(
        'Invalid input for modelConfig.gpt-4.temperature'
      );
    });

    it('should throw ConfigurationError if maxTokens is invalid', () => {
      const config1 = {
        models: ['gpt-4', 'claude-3-opus'],
        modelConfig: {
          'gpt-4': {
            maxTokens: 0,
          },
        },
      };

      const config2 = {
        models: ['gpt-4', 'claude-3-opus'],
        modelConfig: {
          'gpt-4': {
            maxTokens: 100.5,
          },
        },
      };

      expect(() => Validator.consensusConfig(config1)).toThrow(ConfigurationError);
      expect(() => Validator.consensusConfig(config2)).toThrow(ConfigurationError);
    });
  });
});

describe('validateEnvironment', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should not throw when all required variables are set', () => {
    process.env.TEST_VAR1 = 'value1';
    process.env.TEST_VAR2 = 'value2';

    expect(() => validateEnvironment(['TEST_VAR1', 'TEST_VAR2'])).not.toThrow();
  });

  it('should throw when a required variable is missing', () => {
    process.env.TEST_VAR1 = 'value1';
    // TEST_VAR2 is missing

    expect(() => validateEnvironment(['TEST_VAR1', 'TEST_VAR2'])).toThrow();
    expect(() => validateEnvironment(['TEST_VAR1', 'TEST_VAR2'])).toThrow(
      'Required environment variable TEST_VAR2 is not set'
    );
  });
});
