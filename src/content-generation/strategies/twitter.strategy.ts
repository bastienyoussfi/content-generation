import { Injectable } from '@nestjs/common';
import {
  PlatformStrategy,
  PlatformConstraints,
  ContentContext,
  OptimizedContent,
  ValidationResult,
} from './interfaces/platform-strategy.interface';

@Injectable()
export class TwitterStrategy implements PlatformStrategy {
  private readonly CHAR_LIMIT = 280;
  private readonly OPTIMAL_LENGTH = 250; // Leave room for engagement
  private readonly MAX_HASHTAGS = 2; // 1-2 hashtags perform better than 3+

  // High-performing tweet frameworks
  private readonly frameworks = {
    hook: [
      'Stop {doing X}. Start {doing Y} instead.',
      "Here's why {topic} matters more than you think:",
      "I spent {time} learning {topic}. Here's what I discovered:",
      '{Number} things I wish I knew about {topic}:',
      'The biggest mistake people make with {topic}:',
    ],
    structure: [
      'Problem → Solution → Outcome',
      'Before → After → How',
      'Myth → Reality → Lesson',
      'Question → Answer → Action',
    ],
  };

  getPlatformName(): string {
    return 'twitter';
  }

  getConstraints(): PlatformConstraints {
    return {
      maxLength: this.CHAR_LIMIT,
      minLength: 50,
      maxHashtags: this.MAX_HASHTAGS,
      supportsThreads: true,
      supportsMedia: true,
      characterLimit: this.CHAR_LIMIT,
    };
  }

  generatePrompt(context: ContentContext): string {
    const { format = 'single' } = context;

    let prompt = '';

    if (format === 'thread') {
      prompt = this.generateThreadPrompt(context);
    } else {
      prompt = this.generateSingleTweetPrompt(context);
    }

    return prompt;
  }

  private generateSingleTweetPrompt(context: ContentContext): string {
    const { topic, tone, targetAudience } = context;

    return `Create a high-performing Twitter post about: ${topic}

Requirements:
- Use a ${tone || 'conversational'} tone
- Target audience: ${targetAudience || 'general tech audience'}
- Maximum 280 characters
- Start with a strong hook that triggers curiosity or emotion
- Use concrete, specific language (avoid vague generalities)
- Include one clear insight or takeaway
- End with a question or call-to-action to boost engagement

CRITICAL - Avoid AI slop:
- NO clichés like "delve", "unlock", "game-changer", "revolutionize"
- NO generic platitudes or obvious statements
- NO "In conclusion" or "To summarize"
- NO emoji spam
- Use specific examples over abstract concepts
- Write like a real human, not a corporate blog

Structure: [Hook] → [Insight] → [Call-to-action]

Output only the tweet text, nothing else.`;
  }

  private generateThreadPrompt(context: ContentContext): string {
    const { topic, tone, targetAudience } = context;

    return `Create a high-performing Twitter thread about: ${topic}

Requirements:
- Use a ${tone || 'conversational'} tone
- Target audience: ${targetAudience || 'general tech audience'}
- 3-5 tweets maximum
- Each tweet must be under 280 characters
- Thread structure:
  1. Hook tweet (start with curiosity gap or bold statement)
  2-3. Value tweets (insights, frameworks, examples)
  4. Conclusion tweet (summary + call-to-action)

First tweet MUST grab attention using one of these patterns:
- "I spent [time] learning [topic]. Here's what I discovered:"
- "[Number] things about [topic] that changed how I think:"
- "The biggest mistake people make with [topic]:"
- "Here's why [contrarian opinion]:"

CRITICAL - Avoid AI slop:
- NO clichés like "delve", "unlock", "game-changer", "revolutionize", "landscape"
- NO generic advice that could apply to anything
- NO emoji spam (max 1-2 per tweet)
- Use specific examples and concrete numbers
- Write conversationally, like you're texting a friend
- Each tweet should provide standalone value

Format: Separate each tweet with "---" on a new line.

Output only the thread text, nothing else.`;
  }

  optimize(content: string, context: ContentContext): OptimizedContent {
    let optimizedContent = content.trim();
    const hashtags: string[] = [];

    // Extract and remove hashtags if present
    const hashtagRegex = /#[\w]+/g;
    const foundHashtags = optimizedContent.match(hashtagRegex) || [];

    if (foundHashtags.length > 0) {
      // Remove hashtags from content
      optimizedContent = optimizedContent.replace(hashtagRegex, '').trim();
      // Keep only top hashtags
      hashtags.push(...foundHashtags.slice(0, this.MAX_HASHTAGS));
    }

    // Add hashtags if requested and not already present
    if (context.includeHashtags && hashtags.length === 0) {
      const suggestedHashtags = this.generateHashtags(context.topic);
      hashtags.push(...suggestedHashtags.slice(0, this.MAX_HASHTAGS));
    }

    // Re-add hashtags at the end if they exist
    if (hashtags.length > 0) {
      optimizedContent = `${optimizedContent}\n\n${hashtags.join(' ')}`;
    }

    // Calculate metrics
    const characterCount = optimizedContent.length;
    const wordCount = optimizedContent.split(/\s+/).length;

    // Estimate engagement based on best practices
    let estimatedEngagement: 'low' | 'medium' | 'high' = 'medium';
    if (characterCount < 100) estimatedEngagement = 'low';
    else if (characterCount > 100 && characterCount < 250) estimatedEngagement = 'high';
    else if (characterCount > 250) estimatedEngagement = 'medium';

    // Generate suggestions
    const suggestions = this.generateSuggestions(optimizedContent, context);

    return {
      content: optimizedContent,
      hashtags: hashtags.map((h) => h.replace('#', '')),
      metadata: {
        platform: 'twitter',
        characterCount,
        wordCount,
        estimatedEngagement,
        suggestions,
      },
    };
  }

  validate(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 10;

    // Check character limit
    if (content.length > this.CHAR_LIMIT) {
      errors.push(`Content exceeds Twitter's ${this.CHAR_LIMIT} character limit`);
      score -= 3;
    }

    // Check if too short
    if (content.length < 50) {
      warnings.push('Content is very short. Consider adding more value.');
      score -= 1;
    }

    // Check for AI slop indicators
    const slopPhrases = [
      'delve',
      'unlock the power',
      'game-changer',
      'revolutionize',
      'in conclusion',
      'in summary',
      "it's important to note",
      'tapestry',
      'landscape',
      'realm',
      'leverage',
      'synergy',
    ];

    const lowerContent = content.toLowerCase();
    const foundSlop = slopPhrases.filter((phrase) => lowerContent.includes(phrase));

    if (foundSlop.length > 0) {
      warnings.push(`AI slop detected: "${foundSlop.join('", "')}". Consider rewriting.`);
      score -= foundSlop.length;
    }

    // Check hashtag count
    const hashtagCount = (content.match(/#/g) || []).length;
    if (hashtagCount > 3) {
      warnings.push('Too many hashtags. 1-2 hashtags perform better.');
      score -= 1;
    }

    // Check for engagement elements
    const hasQuestion = /\?/.test(content);
    const hasNumbers = /\d+/.test(content);

    if (!hasQuestion && content.length > 100) {
      warnings.push('Consider ending with a question to boost engagement.');
    }

    if (hasNumbers) {
      score += 1; // Numbers tend to perform well
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.min(10, score)),
    };
  }

  postProcess(content: string): string {
    let processed = content;

    // Remove common AI artifacts
    processed = processed.replace(/^(Tweet|Thread):\s*/i, '');
    processed = processed.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    processed = processed.trim();

    // Ensure proper spacing
    processed = processed.replace(/\s+/g, ' ');

    // Remove excessive punctuation
    processed = processed.replace(/!!!+/g, '!');
    processed = processed.replace(/\?\?+/g, '?');

    return processed;
  }

  private generateHashtags(topic: string): string[] {
    // Simple hashtag generation - in production, you might use a more sophisticated approach
    const words = topic.split(' ').filter((w) => w.length > 3);
    return words.slice(0, 2).map((w) => `#${w.charAt(0).toUpperCase() + w.slice(1)}`);
  }

  private generateSuggestions(content: string, context: ContentContext): string[] {
    const suggestions: string[] = [];

    if (content.length < 100) {
      suggestions.push('Consider expanding with a specific example or data point');
    }

    if (!/\?/.test(content)) {
      suggestions.push('Add a question at the end to encourage replies');
    }

    if (!/\d/.test(content)) {
      suggestions.push('Consider adding specific numbers or metrics for credibility');
    }

    if (context.format === 'thread' && !content.includes('---')) {
      suggestions.push('For threads, separate tweets with "---"');
    }

    return suggestions;
  }
}
