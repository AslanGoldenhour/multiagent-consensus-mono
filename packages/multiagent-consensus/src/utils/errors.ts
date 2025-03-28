/**
 * Custom error classes for the consensus system
 */

/**
 * Base class for all consensus errors
 */
export class ConsensusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConsensusError';
    // Ensures proper stack trace for debugging (only in V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Configuration error class for invalid configuration parameters
 */
export class ConfigurationError extends ConsensusError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }

  /**
   * Factory method for creating common configuration errors
   */
  static invalidParameter(param: string, value: any, expectedType: string): ConfigurationError {
    return new ConfigurationError(
      `Invalid configuration parameter: ${param}. Expected ${expectedType}, but got ${typeof value} (${value})`
    );
  }

  /**
   * Factory method for missing required parameter
   */
  static missingParameter(param: string): ConfigurationError {
    return new ConfigurationError(`Missing required configuration parameter: ${param}`);
  }

  /**
   * Factory method for unsupported value
   */
  static unsupportedValue(param: string, value: any, supportedValues: any[]): ConfigurationError {
    return new ConfigurationError(
      `Unsupported value for ${param}: ${value}. Supported values are: ${supportedValues.join(', ')}`
    );
  }
}

/**
 * Provider error class for issues with LLM providers
 */
export class ProviderError extends ConsensusError {
  readonly provider: string;
  readonly model?: string;
  readonly statusCode?: number;
  readonly originalError?: Error;

  constructor(
    message: string,
    provider: string,
    model?: string,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.model = model;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }

  /**
   * Factory method for API key errors
   */
  static apiKeyError(provider: string): ProviderError {
    return new ProviderError(
      `API key for ${provider} is missing or invalid. Please check your environment variables.`,
      provider
    );
  }

  /**
   * Factory method for model not found errors
   */
  static modelNotFound(provider: string, model: string): ProviderError {
    return new ProviderError(
      `Model "${model}" not found for provider "${provider}". Please check available models.`,
      provider,
      model
    );
  }

  /**
   * Factory method for rate limit errors
   */
  static rateLimitExceeded(provider: string, model?: string): ProviderError {
    return new ProviderError(
      `Rate limit exceeded for provider "${provider}"${
        model ? ` and model "${model}"` : ''
      }. Please try again later.`,
      provider,
      model,
      429
    );
  }

  /**
   * Factory method for API errors
   */
  static apiError(
    provider: string,
    message: string,
    model?: string,
    statusCode?: number,
    originalError?: Error
  ): ProviderError {
    return new ProviderError(
      `API error from ${provider}: ${message}`,
      provider,
      model,
      statusCode,
      originalError
    );
  }

  /**
   * Factory method for timeout errors
   */
  static timeout(provider: string, model?: string): ProviderError {
    return new ProviderError(
      `Request to ${provider} timed out${model ? ` for model "${model}"` : ''}.`,
      provider,
      model,
      408
    );
  }
}

/**
 * Consensus process error class for issues during the consensus process
 */
export class ConsensusProcessError extends ConsensusError {
  constructor(message: string) {
    super(message);
    this.name = 'ConsensusProcessError';
  }

  /**
   * Factory method for no consensus reached error
   */
  static noConsensusReached(method: string, rounds: number): ConsensusProcessError {
    return new ConsensusProcessError(
      `No consensus reached using method "${method}" after ${rounds} rounds.`
    );
  }

  /**
   * Factory method for insufficient responses error
   */
  static insufficientResponses(
    received: number,
    required: number,
    method: string
  ): ConsensusProcessError {
    return new ConsensusProcessError(
      `Insufficient responses for consensus. Received ${received}, but ${method} requires at least ${required}.`
    );
  }
}

/**
 * Validation error class for input validation issues
 */
export class ValidationError extends ConsensusError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }

  /**
   * Factory method for invalid input errors
   */
  static invalidInput(param: string, reason: string): ValidationError {
    return new ValidationError(`Invalid input for ${param}: ${reason}`);
  }

  /**
   * Factory method for empty input errors
   */
  static emptyInput(param: string): ValidationError {
    return new ValidationError(`Empty input for ${param}. This field is required.`);
  }
}

/**
 * Environment error class for issues with environment variables
 */
export class EnvironmentError extends ConsensusError {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }

  /**
   * Factory method for missing environment variable errors
   */
  static missingVariable(variable: string): EnvironmentError {
    return new EnvironmentError(
      `Missing environment variable: ${variable}. Please check your .env file.`
    );
  }
}

/**
 * Utility function to safely handle errors and provide consistent error messages
 * @param error The caught error
 * @param defaultMessage Default message if error is not a ConsensusError
 * @returns A ConsensusError instance with appropriate message
 */
export function handleError(
  error: unknown,
  defaultMessage = 'An unknown error occurred'
): ConsensusError {
  if (error instanceof ConsensusError) {
    return error;
  }

  // Convert Error objects
  if (error instanceof Error) {
    return new ConsensusError(`${defaultMessage}: ${error.message}`);
  }

  // Convert string errors
  if (typeof error === 'string') {
    return new ConsensusError(`${defaultMessage}: ${error}`);
  }

  // Handle other types of errors
  return new ConsensusError(defaultMessage);
}
