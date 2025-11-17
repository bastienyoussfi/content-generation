import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ContentGeneratorService } from '../services/content-generator.service';
import { GenerateContentDto } from '../dto/generate-content.dto';
import { ContentResponseDto } from '../dto/content-response.dto';

@Controller('content-generation')
export class ContentGenerationController {
  private readonly logger = new Logger(ContentGenerationController.name);

  constructor(private readonly contentGenerator: ContentGeneratorService) {}

  /**
   * Generate content for a specific platform
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateContent(@Body() dto: GenerateContentDto): Promise<ContentResponseDto> {
    this.logger.log(`Received content generation request for ${dto.platform}: ${dto.topic}`);

    const result = await this.contentGenerator.generateContent({
      platform: dto.platform,
      topic: dto.topic,
      tone: dto.tone,
      targetAudience: dto.targetAudience,
      includeHashtags: dto.includeHashtags,
      includeEmojis: dto.includeEmojis,
      callToAction: dto.callToAction,
      format: dto.format,
      options: {
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      },
    });

    return result;
  }

  /**
   * Get available platforms
   */
  @Get('platforms')
  getAvailablePlatforms(): { platforms: string[] } {
    return {
      platforms: this.contentGenerator.getAvailablePlatforms(),
    };
  }

  /**
   * Get platform constraints
   */
  @Get('platforms/:platform/constraints')
  getPlatformConstraints(@Param('platform') platform: string) {
    return this.contentGenerator.getPlatformConstraints(platform);
  }

  /**
   * Get AI model information
   */
  @Get('model/info')
  getModelInfo() {
    return {
      ...this.contentGenerator.getModelInfo(),
      isFree: this.contentGenerator.isUsingFreeModel(),
    };
  }

  /**
   * Get available free models
   */
  @Get('models/free')
  getFreeModels(): { models: string[] } {
    return {
      models: this.contentGenerator.getAvailableFreeModels(),
    };
  }

  /**
   * Health check
   */
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'content-generation',
      timestamp: new Date().toISOString(),
    };
  }
}
