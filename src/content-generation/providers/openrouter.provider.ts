import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  AIProvider,
  GenerationOptions,
  GenerationResult,
  ModelInfo,
} from './interfaces/ai-provider.interface';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class OpenRouterProvider implements AIProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private readonly httpClient: AxiosInstance;
  private currentModel: string;
  private readonly baseURL = 'https://openrouter.ai/api/v1';

  // Free models available on OpenRouter
  private readonly freeModels = [
    'google/gemini-flash-1.5-8b',
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
  ];

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not found in environment variables');
    }

    this.currentModel =
      this.configService.get<string>('AI_MODEL') || 'google/gemini-flash-1.5-8b';

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': this.configService.get<string>('APP_URL') || 'http://localhost:3000',
        'X-Title': 'Content Generation App',
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout
    });

    this.logger.log(`OpenRouter provider initialized with model: ${this.currentModel}`);
  }

  async generateContent(
    prompt: string,
    options: GenerationOptions = {},
  ): Promise<GenerationResult> {
    try {
      const messages: OpenRouterMessage[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const requestBody = {
        model: this.currentModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
        top_p: options.topP ?? 1,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
        ...(options.stopSequences && { stop: options.stopSequences }),
      };

      this.logger.debug(`Generating content with model: ${this.currentModel}`);

      const response = await this.httpClient.post<OpenRouterResponse>(
        '/chat/completions',
        requestBody,
      );

      const data = response.data;
      const content = data.choices[0]?.message?.content || '';
      const usage = data.usage;

      const result: GenerationResult = {
        content,
        model: data.model,
        tokensUsed: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        cost: this.estimateCost(usage.prompt_tokens, usage.completion_tokens),
      };

      this.logger.log(
        `Content generated successfully. Tokens: ${usage.total_tokens}, Cost: $${result.cost?.toFixed(6) || 0}`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to generate content', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`OpenRouter API error (${status}): ${message}`);
      }

      throw error;
    }
  }

  getModelInfo(): ModelInfo {
    // Note: In production, you might want to fetch this from OpenRouter's models endpoint
    const isFree = this.freeModels.includes(this.currentModel);

    return {
      id: this.currentModel,
      name: this.currentModel.split('/')[1] || this.currentModel,
      provider: this.currentModel.split('/')[0] || 'unknown',
      pricing: {
        prompt: isFree ? 0 : 0.00001, // Example pricing
        completion: isFree ? 0 : 0.00003,
      },
      contextLength: 8192, // Default, varies by model
    };
  }

  setModel(modelId: string): void {
    this.logger.log(`Switching model from ${this.currentModel} to ${modelId}`);
    this.currentModel = modelId;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  estimateCost(promptTokens: number, completionTokens: number): number {
    const modelInfo = this.getModelInfo();
    const promptCost = (promptTokens / 1000) * modelInfo.pricing.prompt;
    const completionCost = (completionTokens / 1000) * modelInfo.pricing.completion;
    return promptCost + completionCost;
  }

  /**
   * Get list of available free models
   */
  getFreeModels(): string[] {
    return [...this.freeModels];
  }

  /**
   * Check if current model is free
   */
  isCurrentModelFree(): boolean {
    return this.freeModels.includes(this.currentModel);
  }
}
