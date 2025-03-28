import { ValidationError, ConfigurationError } from './errors';
import { ConsensusConfig } from '../types/config';

/**
 * Validation utility for checking input values
 */
export class Validator {
  /**
   * Validate that a value is not empty
   * @param value The value to check
   * @param name The name of the parameter for error reporting
   * @throws ValidationError if the value is empty
   */
  static notEmpty<T>(value: T | null | undefined, name: string): T {
    if (value === null || value === undefined) {
      throw ValidationError.emptyInput(name);
    }

    if (typeof value === 'string' && value.trim() === '') {
      throw ValidationError.emptyInput(name);
    }

    if (Array.isArray(value) && value.length === 0) {
      throw ValidationError.emptyInput(name);
    }

    return value;
  }

  /**
   * Validate that a value is of a specific type
   * @param value The value to check
   * @param name The name of the parameter for error reporting
   * @param type The expected type
   * @throws ValidationError if the value is not of the expected type
   */
  static isType<T>(
    value: any,
    name: string,
    type: 'string' | 'number' | 'boolean' | 'object' | 'function' | 'array'
  ): T {
    let isValid = false;

    switch (type) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValid = typeof value === 'boolean';
        break;
      case 'object':
        isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
      case 'function':
        isValid = typeof value === 'function';
        break;
      case 'array':
        isValid = Array.isArray(value);
        break;
    }

    if (!isValid) {
      throw ValidationError.invalidInput(name, `Expected type ${type}, but got ${typeof value}`);
    }

    return value as T;
  }

  /**
   * Validate that a number is within a range
   * @param value The value to check
   * @param name The name of the parameter for error reporting
   * @param min The minimum value (inclusive)
   * @param max The maximum value (inclusive)
   * @throws ValidationError if the value is not within the range
   */
  static inRange(value: number, name: string, min: number, max: number): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw ValidationError.invalidInput(name, `Expected a number, but got ${typeof value}`);
    }

    if (value < min || value > max) {
      throw ValidationError.invalidInput(
        name,
        `Value ${value} is outside the allowed range [${min}, ${max}]`
      );
    }

    return value;
  }

  /**
   * Validate that a value is one of the allowed values
   * @param value The value to check
   * @param name The name of the parameter for error reporting
   * @param allowedValues Array of allowed values
   * @throws ValidationError if the value is not one of the allowed values
   */
  static oneOf<T>(value: T, name: string, allowedValues: T[]): T {
    if (!allowedValues.includes(value)) {
      throw ValidationError.invalidInput(
        name,
        `Value ${value} is not one of the allowed values: ${allowedValues.join(', ')}`
      );
    }

    return value;
  }

  /**
   * Validate a model name against the available models from providers
   * @param modelName The model name to validate
   * @param availableModels Array of available model names
   * @throws ValidationError if the model name is not valid
   */
  static modelName(modelName: string, availableModels: string[]): string {
    this.notEmpty(modelName, 'modelName');
    this.isType<string>(modelName, 'modelName', 'string');

    if (!availableModels.includes(modelName)) {
      throw ValidationError.invalidInput(
        'modelName',
        `Model "${modelName}" is not available. Available models: ${availableModels.join(', ')}`
      );
    }

    return modelName;
  }

  /**
   * Validate a complete consensus configuration
   * @param config The configuration to validate
   * @throws ConfigurationError if the configuration is invalid
   */
  static consensusConfig(config: Partial<ConsensusConfig>): void {
    // Validate required fields
    if (!config.models || !Array.isArray(config.models) || config.models.length === 0) {
      throw ConfigurationError.missingParameter('models');
    }

    // Validate consensus method
    if (config.consensusMethod) {
      this.oneOf(config.consensusMethod, 'consensusMethod', [
        'majority',
        'supermajority',
        'unanimous',
      ] as const);
    }

    // Validate max rounds
    if (config.maxRounds !== undefined) {
      if (typeof config.maxRounds !== 'number' || config.maxRounds < 1) {
        throw ConfigurationError.invalidParameter('maxRounds', config.maxRounds, 'positive number');
      }
    }

    // Validate output configuration
    if (config.output) {
      if (config.output.format) {
        this.oneOf(config.output.format, 'output.format', ['text', 'json'] as const);
      }

      if (config.output.includeHistory !== undefined) {
        this.isType<boolean>(config.output.includeHistory, 'output.includeHistory', 'boolean');
      }

      if (config.output.includeMetadata !== undefined) {
        this.isType<boolean>(config.output.includeMetadata, 'output.includeMetadata', 'boolean');
      }
    }

    // Validate model config
    if (config.modelConfig) {
      this.isType<object>(config.modelConfig, 'modelConfig', 'object');

      for (const [model, modelConfig] of Object.entries(config.modelConfig)) {
        if (modelConfig.temperature !== undefined) {
          this.inRange(modelConfig.temperature, `modelConfig.${model}.temperature`, 0, 2);
        }

        if (modelConfig.maxTokens !== undefined) {
          if (
            typeof modelConfig.maxTokens !== 'number' ||
            modelConfig.maxTokens < 1 ||
            !Number.isInteger(modelConfig.maxTokens)
          ) {
            throw ConfigurationError.invalidParameter(
              `modelConfig.${model}.maxTokens`,
              modelConfig.maxTokens,
              'positive integer'
            );
          }
        }
      }
    }
  }
}

/**
 * Validate that all required environment variables are set
 * @param requiredVars Array of required environment variable names
 * @throws EnvironmentError if any required variable is missing
 */
export function validateEnvironment(requiredVars: string[]): void {
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }
}
