import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateContentDto {
  @ApiProperty({
    description: 'Target social media platform',
    example: 'twitter',
    enum: ['twitter', 'linkedin'],
  })
  @IsString()
  platform: string;

  @ApiProperty({
    description: 'Topic or subject for content generation',
    example: 'developer productivity tips',
  })
  @IsString()
  topic: string;

  @ApiPropertyOptional({
    description: 'Tone of voice for the content',
    enum: ['professional', 'casual', 'conversational', 'formal', 'humorous'],
    example: 'conversational',
    default: 'conversational',
  })
  @IsOptional()
  @IsEnum(['professional', 'casual', 'conversational', 'formal', 'humorous'])
  tone?: 'professional' | 'casual' | 'conversational' | 'formal' | 'humorous';

  @ApiPropertyOptional({
    description: 'Target audience for the content',
    example: 'software engineers',
  })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional({
    description: 'Whether to include hashtags in the content',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeHashtags?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to include emojis in the content',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeEmojis?: boolean;

  @ApiPropertyOptional({
    description: 'Specific call-to-action to include',
    example: 'Share your thoughts below',
  })
  @IsOptional()
  @IsString()
  callToAction?: string;

  @ApiPropertyOptional({
    description: 'Content format (single post or thread)',
    example: 'single',
    enum: ['single', 'thread'],
    default: 'single',
  })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({
    description: 'AI temperature parameter (0-2). Higher values make output more creative',
    example: 0.7,
    minimum: 0,
    maximum: 2,
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of tokens to generate',
    example: 500,
    minimum: 100,
    maximum: 4000,
    default: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4000)
  maxTokens?: number;
}
