/**
 * Interface for LLM providers
 */
export interface LLMProvider {
  /**
   * The name of the provider
   */
  name: string;

  /**
   * The models supported by this provider
   */
  supportedModels: string[];

  /**
   * Generate a response from a model
   * @param modelName The name of the model to use
   * @param prompt The prompt to send to the model
   * @param options Additional options for the request
   * @returns A promise that resolves to the model's response
   */
  generateResponse(
    modelName: string,
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemMessage?: string;
    }
  ): Promise<{
    text: string;
    tokenUsage: {
      prompt: number;
      completion: number;
      total: number;
    };
  }>;
}
