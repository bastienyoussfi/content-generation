import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContentMetadataDto {
  @ApiProperty({
    description: 'AI model used for generation',
    example: 'google/gemini-flash-1.5-8b',
  })
  model: string;

  @ApiProperty({
    description: 'AI provider used',
    example: 'openrouter',
  })
  provider: string;

  @ApiProperty({
    description: 'Total tokens used in generation',
    example: 245,
  })
  tokensUsed: number;

  @ApiProperty({
    description: 'Cost of generation in USD',
    example: 0,
  })
  cost: number;

  @ApiProperty({
    description: 'Quality score (0-10) based on authenticity, engagement, clarity, and platform fit',
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  qualityScore: number;

  @ApiProperty({
    description: 'Character count of generated content',
    example: 234,
  })
  characterCount: number;

  @ApiProperty({
    description: 'Word count of generated content',
    example: 42,
  })
  wordCount: number;

  @ApiPropertyOptional({
    description: 'Estimated engagement level',
    example: 'high',
    enum: ['low', 'medium', 'high'],
  })
  estimatedEngagement?: string;
}

export class ContentValidationDto {
  @ApiProperty({
    description: 'Whether the content is valid for the platform',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Platform validation score (0-10)',
    example: 9,
    minimum: 0,
    maximum: 10,
  })
  score: number;

  @ApiProperty({
    description: 'Validation warnings',
    example: [],
    type: [String],
  })
  warnings: string[];

  @ApiProperty({
    description: 'Suggestions for improvement',
    example: ['Consider adding a question at the end to boost engagement'],
    type: [String],
  })
  suggestions: string[];
}

export class ContentResponseDto {
  @ApiProperty({
    description: 'Generated content',
    example: 'Stop context-switching between 10 tools.\n\nI reduced my daily tool count from 12 to 3:\n- VS Code for coding\n- Linear for tasks\n- Slack for comms\n\nResult: 2x more deep work time.\n\nWhat\'s your essential 3?\n\n#DevProductivity #Coding',
  })
  content: string;

  @ApiProperty({
    description: 'Platform the content was optimized for',
    example: 'twitter',
  })
  platform: string;

  @ApiPropertyOptional({
    description: 'Extracted hashtags (without # symbol)',
    example: ['DevProductivity', 'Coding'],
    type: [String],
  })
  hashtags?: string[];

  @ApiProperty({
    description: 'Metadata about the generation process',
    type: ContentMetadataDto,
  })
  metadata: ContentMetadataDto;

  @ApiProperty({
    description: 'Validation results and quality checks',
    type: ContentValidationDto,
  })
  validation: ContentValidationDto;
}
