import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../providers/openrouter.provider';
import { PlatformOptimizerService } from './platform-optimizer.service';
import { ContentValidatorService } from './content-validator.service';
import { ContentContext } from '../strategies/interfaces/platform-strategy.interface';
import { GenerationOptions } from '../providers/interfaces/ai-provider.interface';

export interface ContentGenerationRequest {
  platform: string;
  topic: string;
  tone?: 'professional' | 'casual' | 'conversational' | 'formal' | 'humorous';
  targetAudience?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  callToAction?: string;
  format?: string;
  options?: GenerationOptions;
}

export interface ContentGenerationResponse {
  content: string;
  platform: string;
  hashtags?: string[];
  metadata: {
    model: string;
    provider: string;
    tokensUsed: number;
    cost: number;
    qualityScore: number;
    characterCount: number;
    wordCount: number;
    estimatedEngagement?: string;
  };
  validation: {
    isValid: boolean;
    score: number;
    warnings: string[];
    suggestions: string[];
  };
}

@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);

  constructor(
    private readonly aiProvider: OpenRouterProvider,
    private readonly platformOptimizer: PlatformOptimizerService,
    private readonly validator: ContentValidatorService,
  ) {
    this.logger.log('ContentGeneratorService initialized');
  }

  /**
   * Generate optimized content for a specific platform
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    const {
      platform,
      topic,
      tone = 'conversational',
      targetAudience,
      includeHashtags = false,
      includeEmojis = false,
      callToAction,
      format = 'single',
      options = {},
    } = request;

    this.logger.log(`Generating content for ${platform} about: ${topic}`);

    // Build context
    const context: ContentContext = {
      topic,
      tone,
      targetAudience,
      includeHashtags,
      includeEmojis,
      callToAction,
      format,
    };

    // Step 1: Generate platform-optimized prompt
    const prompt = this.platformOptimizer.generatePrompt(platform, context);
    this.logger.debug(`Generated prompt: ${prompt.substring(0, 100)}...`);

    // Step 2: Generate content using AI provider
    const generationResult = await this.aiProvider.generateContent(prompt, {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 500,
      ...options,
    });

    let generatedContent = generationResult.content;
    this.logger.debug(`Raw AI output: ${generatedContent.substring(0, 100)}...`);

    // Step 3: Post-process content
    generatedContent = this.platformOptimizer.postProcess(platform, generatedContent, context);

    // Step 4: Validate content quality
    const qualityResult = this.validator.validateContent(generatedContent);
    this.logger.log(`Content quality score: ${qualityResult.score.overall}/10`);

    // Step 5: If quality is too low, regenerate once
    if (qualityResult.score.overall < 5 && qualityResult.issues.critical.length > 0) {
      this.logger.warn('Content quality too low, regenerating...');

      // Add quality feedback to prompt
      const improvedPrompt = `${prompt}\n\nIMPORTANT: Previous attempt failed with these issues: ${qualityResult.issues.critical.join(', ')}. Please address these issues.`;

      const retryResult = await this.aiProvider.generateContent(improvedPrompt, options);
      generatedContent = this.platformOptimizer.postProcess(platform, retryResult.content, context);
    }

    // Step 6: Optimize content for platform
    const optimized = this.platformOptimizer.optimize(platform, generatedContent, context);

    // Step 7: Final validation
    const platformValidation = this.platformOptimizer.validate(platform, optimized.content);
    const finalQuality = this.validator.validateContent(optimized.content);

    // Build response
    const response: ContentGenerationResponse = {
      content: optimized.content,
      platform,
      hashtags: optimized.hashtags,
      metadata: {
        model: generationResult.model,
        provider: 'openrouter',
        tokensUsed: generationResult.tokensUsed.total,
        cost: generationResult.cost || 0,
        qualityScore: finalQuality.score.overall,
        characterCount: optimized.metadata.characterCount,
        wordCount: optimized.metadata.wordCount,
        estimatedEngagement: optimized.metadata.estimatedEngagement,
      },
      validation: {
        isValid: platformValidation.isValid && finalQuality.issues.critical.length === 0,
        score: platformValidation.score,
        warnings: [...platformValidation.warnings, ...finalQuality.issues.warnings],
        suggestions: [...platformValidation.warnings, ...finalQuality.issues.suggestions],
      },
    };

    this.logger.log(
      `Content generated successfully. Quality: ${response.metadata.qualityScore}/10, Valid: ${response.validation.isValid}`,
    );

    return response;
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms(): string[] {
    return this.platformOptimizer.getAvailablePlatforms();
  }

  /**
   * Get platform constraints
   */
  getPlatformConstraints(platform: string) {
    return this.platformOptimizer.getPlatformConstraints(platform);
  }

  /**
   * Get AI model information
   */
  getModelInfo() {
    return this.aiProvider.getModelInfo();
  }

  /**
   * Check if using free model
   */
  isUsingFreeModel(): boolean {
    return this.aiProvider.isCurrentModelFree();
  }

  /**
   * Get available free models
   */
  getAvailableFreeModels(): string[] {
    return this.aiProvider.getFreeModels();
  }

  /**
   * Switch AI model
   */
  switchModel(modelId: string): void {
    this.aiProvider.setModel(modelId);
    this.logger.log(`Switched to model: ${modelId}`);
  }
}
