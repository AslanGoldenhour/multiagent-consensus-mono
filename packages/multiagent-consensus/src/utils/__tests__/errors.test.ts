import {
  ConsensusError,
  ConfigurationError,
  ProviderError,
  ConsensusProcessError,
  ValidationError,
  EnvironmentError,
  handleError,
} from '../errors';

describe('ConsensusError', () => {
  it('should create a base consensus error with correct name', () => {
    const error = new ConsensusError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ConsensusError');
    expect(error.message).toBe('Test error');
  });

  it('should capture stack trace if available', () => {
    const originalCaptureStackTrace = Error.captureStackTrace;
    Error.captureStackTrace = jest.fn();

    new ConsensusError('Test error');

    expect(Error.captureStackTrace).toHaveBeenCalled();

    // Restore original function
    Error.captureStackTrace = originalCaptureStackTrace;
  });
});

describe('ConfigurationError', () => {
  it('should create a configuration error with correct name', () => {
    const error = new ConfigurationError('Invalid configuration');

    expect(error).toBeInstanceOf(ConsensusError);
    expect(error.name).toBe('ConfigurationError');
    expect(error.message).toBe('Invalid configuration');
  });

  it('should create an invalidParameter error with factory method', () => {
    const error = ConfigurationError.invalidParameter('maxRounds', -1, 'positive number');

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.message).toContain('Invalid configuration parameter: maxRounds');
    expect(error.message).toContain('Expected positive number');
    expect(error.message).toContain('but got number (-1)');
  });

  it('should create a missingParameter error with factory method', () => {
    const error = ConfigurationError.missingParameter('models');

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.message).toBe('Missing required configuration parameter: models');
  });

  it('should create an unsupportedValue error with factory method', () => {
    const error = ConfigurationError.unsupportedValue('consensusMethod', 'simple', [
      'majority',
      'supermajority',
      'unanimous',
    ]);

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.message).toContain('Unsupported value for consensusMethod: simple');
    expect(error.message).toContain('Supported values are: majority, supermajority, unanimous');
  });
});

describe('ProviderError', () => {
  it('should create a provider error with correct name and properties', () => {
    const error = new ProviderError('API error', 'openai', 'gpt-4', 401, new Error('Unauthorized'));

    expect(error).toBeInstanceOf(ConsensusError);
    expect(error.name).toBe('ProviderError');
    expect(error.message).toBe('API error');
    expect(error.provider).toBe('openai');
    expect(error.model).toBe('gpt-4');
    expect(error.statusCode).toBe(401);
    expect(error.originalError).toBeInstanceOf(Error);
    expect(error.originalError?.message).toBe('Unauthorized');
  });

  it('should create an apiKeyError with factory method', () => {
    const error = ProviderError.apiKeyError('openai');

    expect(error).toBeInstanceOf(ProviderError);
    expect(error.message).toContain('API key for openai is missing or invalid');
    expect(error.provider).toBe('openai');
    expect(error.model).toBeUndefined();
  });

  it('should create a modelNotFound error with factory method', () => {
    const error = ProviderError.modelNotFound('anthropic', 'nonexistent-model');

    expect(error).toBeInstanceOf(ProviderError);
    expect(error.message).toContain('Model "nonexistent-model" not found for provider "anthropic"');
    expect(error.provider).toBe('anthropic');
    expect(error.model).toBe('nonexistent-model');
  });

  it('should create a rateLimitExceeded error with factory method', () => {
    const error = ProviderError.rateLimitExceeded('cohere', 'command');

    expect(error).toBeInstanceOf(ProviderError);
    expect(error.message).toContain(
      'Rate limit exceeded for provider "cohere" and model "command"'
    );
    expect(error.provider).toBe('cohere');
    expect(error.model).toBe('command');
    expect(error.statusCode).toBe(429);
  });

  it('should create a rateLimitExceeded error without model', () => {
    const error = ProviderError.rateLimitExceeded('mistral');

    expect(error).toBeInstanceOf(ProviderError);
    expect(error.message).toContain('Rate limit exceeded for provider "mistral"');
    expect(error.message).not.toContain('model');
    expect(error.provider).toBe('mistral');
    expect(error.statusCode).toBe(429);
  });

  it('should create an apiError with factory method', () => {
    const originalError = new Error('Bad request');
    const error = ProviderError.apiError(
      'groq',
      'Invalid model parameters',
      'llama-3',
      400,
      originalError
    );

    expect(error).toBeInstanceOf(ProviderError);
    expect(error.message).toBe('API error from groq: Invalid model parameters');
    expect(error.provider).toBe('groq');
    expect(error.model).toBe('llama-3');
    expect(error.statusCode).toBe(400);
    expect(error.originalError).toBe(originalError);
  });

  it('should create a timeout error with factory method', () => {
    const error = ProviderError.timeout('openai', 'gpt-4');

    expect(error).toBeInstanceOf(ProviderError);
    expect(error.message).toContain('Request to openai timed out for model "gpt-4"');
    expect(error.provider).toBe('openai');
    expect(error.model).toBe('gpt-4');
    expect(error.statusCode).toBe(408);
  });

  it('should create a timeout error without model', () => {
    const error = ProviderError.timeout('anthropic');

    expect(error).toBeInstanceOf(ProviderError);
    expect(error.message).toBe('Request to anthropic timed out.');
    expect(error.provider).toBe('anthropic');
    expect(error.statusCode).toBe(408);
  });
});

describe('ConsensusProcessError', () => {
  it('should create a consensus process error with correct name', () => {
    const error = new ConsensusProcessError('Consensus failed');

    expect(error).toBeInstanceOf(ConsensusError);
    expect(error.name).toBe('ConsensusProcessError');
    expect(error.message).toBe('Consensus failed');
  });

  it('should create a noConsensusReached error with factory method', () => {
    const error = ConsensusProcessError.noConsensusReached('majority', 3);

    expect(error).toBeInstanceOf(ConsensusProcessError);
    expect(error.message).toContain('No consensus reached using method "majority" after 3 rounds');
  });

  it('should create an insufficientResponses error with factory method', () => {
    const error = ConsensusProcessError.insufficientResponses(2, 3, 'supermajority');

    expect(error).toBeInstanceOf(ConsensusProcessError);
    expect(error.message).toContain('Insufficient responses for consensus');
    expect(error.message).toContain('Received 2, but supermajority requires at least 3');
  });
});

describe('ValidationError', () => {
  it('should create a validation error with correct name', () => {
    const error = new ValidationError('Invalid input');

    expect(error).toBeInstanceOf(ConsensusError);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid input');
  });

  it('should create an invalidInput error with factory method', () => {
    const error = ValidationError.invalidInput('temperature', 'must be between 0 and 1');

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Invalid input for temperature: must be between 0 and 1');
  });

  it('should create an emptyInput error with factory method', () => {
    const error = ValidationError.emptyInput('prompt');

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Empty input for prompt. This field is required.');
  });
});

describe('EnvironmentError', () => {
  it('should create an environment error with correct name', () => {
    const error = new EnvironmentError('Missing environment variable');

    expect(error).toBeInstanceOf(ConsensusError);
    expect(error.name).toBe('EnvironmentError');
    expect(error.message).toBe('Missing environment variable');
  });

  it('should create a missingVariable error with factory method', () => {
    const error = EnvironmentError.missingVariable('OPENAI_API_KEY');

    expect(error).toBeInstanceOf(EnvironmentError);
    expect(error.message).toContain('Missing environment variable: OPENAI_API_KEY');
    expect(error.message).toContain('Please check your .env file');
  });
});

describe('handleError utility function', () => {
  it('should return the original error if it is a ConsensusError', () => {
    const originalError = new ConsensusError('Original error');
    const result = handleError(originalError);

    expect(result).toBe(originalError);
  });

  it('should wrap standard Error objects with default message', () => {
    const originalError = new Error('Standard error');
    const result = handleError(originalError);

    expect(result).toBeInstanceOf(ConsensusError);
    expect(result.message).toBe('An unknown error occurred: Standard error');
  });

  it('should wrap standard Error objects with custom message', () => {
    const originalError = new Error('Standard error');
    const result = handleError(originalError, 'API call failed');

    expect(result).toBeInstanceOf(ConsensusError);
    expect(result.message).toBe('API call failed: Standard error');
  });

  it('should handle string errors', () => {
    const result = handleError('Something went wrong', 'Processing failed');

    expect(result).toBeInstanceOf(ConsensusError);
    expect(result.message).toBe('Processing failed: Something went wrong');
  });

  it('should handle null errors', () => {
    const result = handleError(null);

    expect(result).toBeInstanceOf(ConsensusError);
    expect(result.message).toBe('An unknown error occurred');
  });

  it('should handle undefined errors', () => {
    const result = handleError(undefined);

    expect(result).toBeInstanceOf(ConsensusError);
    expect(result.message).toBe('An unknown error occurred');
  });

  it('should handle object errors', () => {
    const result = handleError({ error: 'Invalid request' });

    expect(result).toBeInstanceOf(ConsensusError);
    expect(result.message).toBe('An unknown error occurred');
  });
});
