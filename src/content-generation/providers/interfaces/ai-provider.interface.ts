export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  contextLength: number;
}

export interface GenerationResult {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
}

export interface AIProvider {
  /**
   * Generate content using the AI model
   */
  generateContent(prompt: string, options?: GenerationOptions): Promise<GenerationResult>;

  /**
   * Get information about the current model
   */
  getModelInfo(): ModelInfo;

  /**
   * Set the model to use for generation
   */
  setModel(modelId: string): void;

  /**
   * Get the current model ID
   */
  getCurrentModel(): string;

  /**
   * Estimate the cost for a given number of tokens
   */
  estimateCost(promptTokens: number, completionTokens: number): number;
}
