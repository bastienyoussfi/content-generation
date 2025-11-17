export class ContentMetadataDto {
  model: string;
  provider: string;
  tokensUsed: number;
  cost: number;
  qualityScore: number;
  characterCount: number;
  wordCount: number;
  estimatedEngagement?: string;
}

export class ContentValidationDto {
  isValid: boolean;
  score: number;
  warnings: string[];
  suggestions: string[];
}

export class ContentResponseDto {
  content: string;
  platform: string;
  hashtags?: string[];
  metadata: ContentMetadataDto;
  validation: ContentValidationDto;
}
