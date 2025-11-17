import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ContentGeneratorService } from '../services/content-generator.service';
import { GenerateContentDto } from '../dto/generate-content.dto';
import { ContentResponseDto } from '../dto/content-response.dto';

@ApiTags('Content Generation')
@Controller('content-generation')
export class ContentGenerationController {
  private readonly logger = new Logger(ContentGenerationController.name);

  constructor(private readonly contentGenerator: ContentGeneratorService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate content for social media',
    description: 'Generate high-quality, platform-optimized content using AI. Includes anti-AI slop validation, quality scoring, and platform-specific best practices.',
  })
  @ApiResponse({
    status: 200,
    description: 'Content generated successfully',
    type: ContentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error or AI provider error',
  })
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

  @Get('platforms')
  @ApiOperation({
    summary: 'Get available platforms',
    description: 'Returns a list of social media platforms supported by the content generator',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available platforms',
    schema: {
      type: 'object',
      properties: {
        platforms: {
          type: 'array',
          items: { type: 'string' },
          example: ['twitter'],
        },
      },
    },
  })
  getAvailablePlatforms(): { platforms: string[] } {
    return {
      platforms: this.contentGenerator.getAvailablePlatforms(),
    };
  }

  @Get('platforms/:platform/constraints')
  @ApiOperation({
    summary: 'Get platform constraints',
    description: 'Returns the constraints and limitations for a specific platform (character limits, hashtag rules, etc.)',
  })
  @ApiParam({
    name: 'platform',
    description: 'Platform name',
    example: 'twitter',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform constraints',
    schema: {
      type: 'object',
      properties: {
        maxLength: { type: 'number', example: 280 },
        minLength: { type: 'number', example: 50 },
        maxHashtags: { type: 'number', example: 2 },
        supportsThreads: { type: 'boolean', example: true },
        supportsMedia: { type: 'boolean', example: true },
        characterLimit: { type: 'number', example: 280 },
      },
    },
  })
  getPlatformConstraints(@Param('platform') platform: string) {
    return this.contentGenerator.getPlatformConstraints(platform);
  }

  @Get('model/info')
  @ApiOperation({
    summary: 'Get current AI model information',
    description: 'Returns information about the currently configured AI model including pricing and whether it\'s free',
  })
  @ApiResponse({
    status: 200,
    description: 'AI model information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'google/gemini-flash-1.5-8b' },
        name: { type: 'string', example: 'gemini-flash-1.5-8b' },
        provider: { type: 'string', example: 'google' },
        pricing: {
          type: 'object',
          properties: {
            prompt: { type: 'number', example: 0 },
            completion: { type: 'number', example: 0 },
          },
        },
        contextLength: { type: 'number', example: 8192 },
        isFree: { type: 'boolean', example: true },
      },
    },
  })
  getModelInfo() {
    return {
      ...this.contentGenerator.getModelInfo(),
      isFree: this.contentGenerator.isUsingFreeModel(),
    };
  }

  @Get('models/free')
  @ApiOperation({
    summary: 'Get available free models',
    description: 'Returns a list of free AI models available for content generation',
  })
  @ApiResponse({
    status: 200,
    description: 'List of free models',
    schema: {
      type: 'object',
      properties: {
        models: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'google/gemini-flash-1.5-8b',
            'meta-llama/llama-3.1-8b-instruct:free',
            'mistralai/mistral-7b-instruct:free',
          ],
        },
      },
    },
  })
  getFreeModels(): { models: string[] } {
    return {
      models: this.contentGenerator.getAvailableFreeModels(),
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the content generation service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'content-generation' },
        timestamp: { type: 'string', example: '2024-01-15T12:00:00.000Z' },
      },
    },
  })
  healthCheck() {
    return {
      status: 'ok',
      service: 'content-generation',
      timestamp: new Date().toISOString(),
    };
  }
}
