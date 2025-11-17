import { Injectable, Logger } from '@nestjs/common';
import { TwitterStrategy } from '../strategies/twitter.strategy';
import { LinkedInStrategy } from '../strategies/linkedin.strategy';
import {
  PlatformStrategy,
  ContentContext,
  OptimizedContent,
} from '../strategies/interfaces/platform-strategy.interface';

@Injectable()
export class PlatformOptimizerService {
  private readonly logger = new Logger(PlatformOptimizerService.name);
  private readonly strategies: Map<string, PlatformStrategy> = new Map();

  constructor(
    private readonly twitterStrategy: TwitterStrategy,
    private readonly linkedinStrategy: LinkedInStrategy,
  ) {
    // Register available strategies
    this.strategies.set('twitter', this.twitterStrategy);
    this.strategies.set('linkedin', this.linkedinStrategy);
    // Future platforms can be added here:
    // this.strategies.set('instagram', this.instagramStrategy);
  }

  /**
   * Get strategy for a specific platform
   */
  getStrategy(platform: string): PlatformStrategy {
    const strategy = this.strategies.get(platform.toLowerCase());

    if (!strategy) {
      this.logger.warn(`No strategy found for platform: ${platform}, using Twitter as default`);
      return this.twitterStrategy;
    }

    return strategy;
  }

  /**
   * Optimize content for a specific platform
   */
  optimize(platform: string, content: string, context: ContentContext): OptimizedContent {
    const strategy = this.getStrategy(platform);
    this.logger.log(`Optimizing content for platform: ${platform}`);

    return strategy.optimize(content, context);
  }

  /**
   * Generate platform-optimized prompt
   */
  generatePrompt(platform: string, context: ContentContext): string {
    const strategy = this.getStrategy(platform);
    return strategy.generatePrompt(context);
  }

  /**
   * Validate content for platform
   */
  validate(platform: string, content: string) {
    const strategy = this.getStrategy(platform);
    return strategy.validate(content);
  }

  /**
   * Post-process generated content
   */
  postProcess(platform: string, content: string, context: ContentContext): string {
    const strategy = this.getStrategy(platform);
    return strategy.postProcess(content, context);
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get constraints for a platform
   */
  getPlatformConstraints(platform: string) {
    const strategy = this.getStrategy(platform);
    return strategy.getConstraints();
  }
}
