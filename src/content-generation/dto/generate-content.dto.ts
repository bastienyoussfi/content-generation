import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class GenerateContentDto {
  @IsString()
  platform: string;

  @IsString()
  topic: string;

  @IsOptional()
  @IsEnum(['professional', 'casual', 'conversational', 'formal', 'humorous'])
  tone?: 'professional' | 'casual' | 'conversational' | 'formal' | 'humorous';

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsBoolean()
  includeHashtags?: boolean;

  @IsOptional()
  @IsBoolean()
  includeEmojis?: boolean;

  @IsOptional()
  @IsString()
  callToAction?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4000)
  maxTokens?: number;
}
