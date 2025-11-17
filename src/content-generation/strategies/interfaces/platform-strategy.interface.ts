export interface PlatformConstraints {
  maxLength: number;
  minLength?: number;
  maxHashtags?: number;
  supportsThreads?: boolean;
  supportsMedia?: boolean;
  characterLimit?: number;
}

export interface ContentContext {
  topic: string;
  tone?: 'professional' | 'casual' | 'conversational' | 'formal' | 'humorous';
  targetAudience?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  callToAction?: string;
  format?: string; // e.g., 'thread', 'single', 'article'
}

export interface OptimizedContent {
  content: string;
  hashtags?: string[];
  metadata: {
    platform: string;
    characterCount: number;
    wordCount: number;
    estimatedEngagement?: 'low' | 'medium' | 'high';
    suggestions?: string[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-10
}

export interface PlatformStrategy {
  /**
   * Get the platform name
   */
  getPlatformName(): string;

  /**
   * Get platform-specific constraints
   */
  getConstraints(): PlatformConstraints;

  /**
   * Optimize content for the platform
   */
  optimize(content: string, context: ContentContext): OptimizedContent;

  /**
   * Validate content against platform rules
   */
  validate(content: string): ValidationResult;

  /**
   * Generate a platform-optimized prompt for the AI
   */
  generatePrompt(context: ContentContext): string;

  /**
   * Post-process AI-generated content
   */
  postProcess(content: string, context: ContentContext): string;
}
