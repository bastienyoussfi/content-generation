import { Injectable } from '@nestjs/common';
import {
  PlatformStrategy,
  PlatformConstraints,
  ContentContext,
  OptimizedContent,
  ValidationResult,
} from './interfaces/platform-strategy.interface';

@Injectable()
export class LinkedInStrategy implements PlatformStrategy {
  private readonly CHAR_LIMIT = 3000;
  private readonly OPTIMAL_MIN_LENGTH = 1300;
  private readonly OPTIMAL_MAX_LENGTH = 2000;
  private readonly MIN_LENGTH = 150;
  private readonly HOOK_CHAR_LIMIT = 210; // "see more" cutoff
  private readonly RECOMMENDED_HASHTAGS = { min: 3, max: 5 };
  private readonly MAX_HASHTAGS = 7; // Above this is spammy

  // High-performing LinkedIn content frameworks
  private readonly frameworks = {
    hook: [
      'I spent {time} {doing X}. Here\'s what I learned:',
      'Most people get {topic} wrong. Here\'s why:',
      '{Number} lessons from {experience}:',
      'The data on {topic} surprised me:',
      'Here\'s what {years} in {field} taught me about {topic}:',
      'Everyone talks about {topic}. Nobody talks about {insight}:',
    ],
    structure: [
      'Hook → Problem → Solution → Results → Lesson',
      'Personal Story → Struggle → Breakthrough → Takeaway',
      'Bold Claim → Supporting Data → Analysis → Action',
      'Question → Context → Answer → Application',
      'Observation → Insight → Example → Call-to-action',
      'Challenge → Approach → Results → Key Learnings',
    ],
  };

  // LinkedIn-specific AI slop phrases to avoid
  private readonly linkedinSlop = [
    'thrilled to announce',
    'honored and humbled',
    'i\'m excited to share',
    'blessed and grateful',
    'thoughts?',
    'agree?',
    'delve',
    'unlock',
    'game-changer',
    'revolutionize',
    'game changer',
    'paradigm shift',
    'synergy',
    'leverage',
    'circle back',
    'touch base',
    'low-hanging fruit',
    'move the needle',
    'drink the kool-aid',
  ];

  getPlatformName(): string {
    return 'linkedin';
  }

  getConstraints(): PlatformConstraints {
    return {
      maxLength: this.CHAR_LIMIT,
      minLength: this.MIN_LENGTH,
      maxHashtags: this.RECOMMENDED_HASHTAGS.max,
      supportsThreads: false,
      supportsMedia: true,
      characterLimit: this.CHAR_LIMIT,
    };
  }

  generatePrompt(context: ContentContext): string {
    const { topic, tone, targetAudience, callToAction } = context;

    return `Create a high-performing LinkedIn post about: ${topic}

Requirements:
- Use a ${tone || 'professional yet conversational'} tone
- Target audience: ${targetAudience || 'professionals in the industry'}
- Length: ${this.OPTIMAL_MIN_LENGTH}-${this.OPTIMAL_MAX_LENGTH} characters (optimal for engagement)
- Maximum ${this.CHAR_LIMIT} characters

Structure:
1. HOOK (first 2-3 lines, max ${this.HOOK_CHAR_LIMIT} chars - this shows before "see more"):
   - Start with a compelling hook: bold statement, question, data point, or personal story
   - Make it intriguing enough that readers want to click "see more"
   - Examples: "I analyzed 500 LinkedIn posts. Here's what the top performers have in common:" OR "Most professionals waste 10+ hours/week on this mistake:"

2. MAIN CONTENT:
   - Use short paragraphs (2-3 lines max) with line breaks for readability
   - Include specific examples, data, or personal experiences (not abstract concepts)
   - Add credibility markers (years of experience, specific results, concrete numbers)
   - Tell a story or share a case study when relevant
   - Use bullet points or numbered lists for key takeaways

3. VALUE & INSIGHTS:
   - Provide actionable insights, not generic advice
   - Share lessons learned or professional wisdom
   - Include data/metrics to support claims when possible

4. CLOSING:
   - End with clear value proposition or key takeaway
   - Include call-to-action: ${callToAction || 'question for engagement or invitation to connect'}
   - Make it conversational and invite discussion

Formatting:
- Use line breaks every 2-3 sentences for readability
- Add emojis sparingly (1-3 max) and only if they add value
- Use --- for section breaks if needed
- Leave hashtags for the end (we'll add them separately)

CRITICAL - Write like a human professional:
- NO AI slop: avoid "thrilled to announce", "honored and humbled", "I'm excited to share", "blessed and grateful"
- NO lazy engagement: avoid "Thoughts?" or "Agree?" as standalone CTAs
- NO corporate jargon: avoid "synergy", "leverage", "circle back", "low-hanging fruit", "paradigm shift"
- NO clichés: avoid "game-changer", "revolutionize", "unlock", "delve"
- NO generic platitudes that could apply to anything
- Use specific examples over vague statements
- Write with personality and authenticity
- Share real experiences and concrete insights

Tone guidelines:
- Professional but approachable (not stuffy or overly formal)
- Confident but not arrogant
- Data-driven when relevant
- Story-driven when appropriate
- Human and relatable

Output only the post text, nothing else. Do not include hashtags in the main text.`;
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
      // Keep recommended number of hashtags
      hashtags.push(...foundHashtags.slice(0, this.RECOMMENDED_HASHTAGS.max));
    }

    // Add hashtags if requested and not already present
    if (context.includeHashtags && hashtags.length === 0) {
      const suggestedHashtags = this.generateHashtags(context.topic);
      hashtags.push(...suggestedHashtags.slice(0, this.RECOMMENDED_HASHTAGS.max));
    }

    // Ensure proper line breaks for readability
    optimizedContent = this.optimizeLineBreaks(optimizedContent);

    // Re-add hashtags at the end if they exist
    if (hashtags.length > 0) {
      optimizedContent = `${optimizedContent}\n\n${hashtags.join(' ')}`;
    }

    // Calculate metrics
    const characterCount = optimizedContent.length;
    const wordCount = optimizedContent.split(/\s+/).length;

    // Estimate engagement based on LinkedIn best practices
    let estimatedEngagement: 'low' | 'medium' | 'high' = 'medium';
    if (characterCount < this.MIN_LENGTH * 2) {
      estimatedEngagement = 'low'; // Too short for LinkedIn
    } else if (
      characterCount >= this.OPTIMAL_MIN_LENGTH &&
      characterCount <= this.OPTIMAL_MAX_LENGTH
    ) {
      estimatedEngagement = 'high'; // Optimal length
    } else if (characterCount > this.OPTIMAL_MAX_LENGTH) {
      estimatedEngagement = 'medium'; // Good but might be too long
    }

    // Generate suggestions
    const suggestions = this.generateSuggestions(optimizedContent, context);

    return {
      content: optimizedContent,
      hashtags: hashtags.map((h) => h.replace('#', '')),
      metadata: {
        platform: 'linkedin',
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

    // Check character limit (critical)
    if (content.length > this.CHAR_LIMIT) {
      errors.push(`Content exceeds LinkedIn's ${this.CHAR_LIMIT} character limit`);
      score -= 3;
    }

    // Check minimum length
    if (content.length < this.MIN_LENGTH) {
      errors.push(`Content is too short (minimum ${this.MIN_LENGTH} characters for LinkedIn)`);
      score -= 2;
    }

    // Check optimal length range
    if (content.length < this.OPTIMAL_MIN_LENGTH) {
      warnings.push(
        `Content is short. Consider expanding to ${this.OPTIMAL_MIN_LENGTH}-${this.OPTIMAL_MAX_LENGTH} characters for better engagement.`,
      );
      score -= 0.5;
    } else if (content.length > this.OPTIMAL_MAX_LENGTH) {
      warnings.push(
        `Content is long. Posts between ${this.OPTIMAL_MIN_LENGTH}-${this.OPTIMAL_MAX_LENGTH} characters tend to perform better.`,
      );
      score -= 0.5;
    }

    // Check for compelling hook (first 210 characters)
    const hook = content.substring(0, this.HOOK_CHAR_LIMIT);
    if (hook.length < 100) {
      warnings.push('Hook might be too short. First 210 characters appear before "see more".');
      score -= 0.5;
    }

    // Check for generic openings
    const genericOpenings = [
      /^in today's/i,
      /^in this post/i,
      /^let me share/i,
      /^i want to talk about/i,
    ];
    if (genericOpenings.some((pattern) => pattern.test(hook))) {
      warnings.push('Consider a stronger hook. Avoid generic openings.');
      score -= 0.5;
    }

    // Check for LinkedIn-specific AI slop
    const lowerContent = content.toLowerCase();
    const foundSlop = this.linkedinSlop.filter((phrase) => lowerContent.includes(phrase));

    if (foundSlop.length > 0) {
      warnings.push(
        `LinkedIn AI slop detected: "${foundSlop.join('", "')}". Rewrite for authenticity.`,
      );
      score -= foundSlop.length * 0.5;
    }

    // Check hashtag count
    const hashtagCount = (content.match(/#/g) || []).length;
    if (hashtagCount > this.MAX_HASHTAGS) {
      warnings.push(
        `Too many hashtags (${hashtagCount}). ${this.RECOMMENDED_HASHTAGS.min}-${this.RECOMMENDED_HASHTAGS.max} hashtags perform best.`,
      );
      score -= 1;
    } else if (hashtagCount < this.RECOMMENDED_HASHTAGS.min && hashtagCount > 0) {
      warnings.push(`Consider adding more hashtags (${this.RECOMMENDED_HASHTAGS.min}-${this.RECOMMENDED_HASHTAGS.max} recommended).`);
    }

    // Check for line breaks (wall of text detection)
    const lineBreaks = (content.match(/\n/g) || []).length;
    if (content.length > 500 && lineBreaks < 3) {
      warnings.push('Add line breaks for readability. LinkedIn posts perform better with white space.');
      score -= 1;
    }

    // Check for engagement elements
    const hasQuestion = /\?/.test(content);
    const hasNumbers = /\d+/.test(content);
    const hasCallToAction = this.hasCallToAction(content);

    if (!hasQuestion && !hasCallToAction) {
      warnings.push('Consider adding a question or call-to-action to boost engagement.');
      score -= 0.5;
    }

    if (hasNumbers) {
      score += 0.5; // Data and specific numbers perform well on LinkedIn
    }

    // Check for professional value
    const hasValueIndicators = this.hasValueIndicators(content);
    if (!hasValueIndicators) {
      warnings.push('Consider adding specific insights, data, or professional lessons.');
      score -= 1;
    }

    // Bonus for optimal formatting
    if (lineBreaks >= 4 && lineBreaks <= 10) {
      score += 0.5; // Good use of white space
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.min(10, score)),
    };
  }

  postProcess(content: string, context: ContentContext): string {
    let processed = content;

    // Remove common AI artifacts
    processed = processed.replace(/^(LinkedIn Post|Post):\s*/i, '');
    processed = processed.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    processed = processed.trim();

    // Clean up excessive line breaks (max 2 consecutive)
    processed = processed.replace(/\n{3,}/g, '\n\n');

    // Remove excessive punctuation
    processed = processed.replace(/!!!+/g, '!');
    processed = processed.replace(/\?\?+/g, '?');
    processed = processed.replace(/\.\.\.+/g, '...');

    // Fix spacing around punctuation
    processed = processed.replace(/\s+([.,!?])/g, '$1');
    processed = processed.replace(/([.,!?])([A-Za-z])/g, '$1 $2');

    return processed;
  }

  /**
   * Generate relevant hashtags based on topic
   */
  private generateHashtags(topic: string): string[] {
    const hashtags: string[] = [];

    // Extract meaningful words from topic (remove common words)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const words = topic
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !commonWords.includes(w));

    // Create hashtags from topic words
    words.slice(0, 3).forEach((word) => {
      const hashtag = `#${word.charAt(0).toUpperCase()}${word.slice(1)}`;
      hashtags.push(hashtag);
    });

    // Add general professional hashtags if we have room
    const generalHashtags = ['#Leadership', '#ProfessionalDevelopment', '#CareerGrowth'];
    while (hashtags.length < this.RECOMMENDED_HASHTAGS.min) {
      const nextTag = generalHashtags[hashtags.length - words.length];
      if (nextTag && !hashtags.includes(nextTag)) {
        hashtags.push(nextTag);
      } else {
        break;
      }
    }

    return hashtags.slice(0, this.RECOMMENDED_HASHTAGS.max);
  }

  /**
   * Optimize line breaks for LinkedIn readability
   */
  private optimizeLineBreaks(content: string): string {
    // Don't modify if already well-formatted
    const existingBreaks = (content.match(/\n/g) || []).length;
    if (existingBreaks >= 4) {
      return content;
    }

    // Split into sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];

    if (sentences.length <= 2) {
      return content; // Too short to optimize
    }

    let optimized = '';
    let lineLength = 0;

    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      lineLength += trimmed.length;

      optimized += trimmed;

      // Add line break after every 2-3 sentences or when line gets long
      if (lineLength > 200 || (index > 0 && (index + 1) % 2 === 0)) {
        optimized += '\n\n';
        lineLength = 0;
      } else if (index < sentences.length - 1) {
        optimized += ' ';
      }
    });

    return optimized.trim();
  }

  /**
   * Check if content has clear call-to-action
   */
  private hasCallToAction(content: string): boolean {
    const ctaPatterns = [
      /what do you think/i,
      /share your/i,
      /let me know/i,
      /drop a comment/i,
      /comment below/i,
      /connect with me/i,
      /follow for/i,
      /join the conversation/i,
      /what's your experience/i,
      /have you tried/i,
    ];

    return ctaPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Check if content provides professional value
   */
  private hasValueIndicators(content: string): boolean {
    const valuePatterns = [
      /\d+%/, // Percentages
      /\d+ (years|months|weeks)/, // Time indicators
      /learned/i,
      /discovered/i,
      /insight/i,
      /lesson/i,
      /strategy/i,
      /approach/i,
      /framework/i,
      /results/i,
      /data shows/i,
      /research/i,
      /analysis/i,
      /case study/i,
    ];

    return valuePatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Generate contextual suggestions for improvement
   */
  private generateSuggestions(content: string, context: ContentContext): string[] {
    const suggestions: string[] = [];

    // Length suggestions
    if (content.length < this.OPTIMAL_MIN_LENGTH) {
      suggestions.push(
        `Expand to ${this.OPTIMAL_MIN_LENGTH}-${this.OPTIMAL_MAX_LENGTH} characters for optimal engagement`,
      );
    }

    // Hook suggestions
    const hook = content.substring(0, this.HOOK_CHAR_LIMIT);
    if (!hook.includes('?') && !(/\d/.test(hook))) {
      suggestions.push('Consider adding a question or specific number in your hook');
    }

    // Formatting suggestions
    const lineBreaks = (content.match(/\n/g) || []).length;
    if (lineBreaks < 3 && content.length > 500) {
      suggestions.push('Add more line breaks for better readability');
    }

    // Engagement suggestions
    if (!this.hasCallToAction(content)) {
      suggestions.push('Add a call-to-action to encourage comments and engagement');
    }

    // Value suggestions
    if (!(/\d/.test(content))) {
      suggestions.push('Include specific numbers, data, or metrics to add credibility');
    }

    if (!this.hasValueIndicators(content)) {
      suggestions.push('Add concrete insights, lessons learned, or professional experiences');
    }

    // Hashtag suggestions
    const hashtagCount = (content.match(/#/g) || []).length;
    if (hashtagCount === 0 && context.includeHashtags) {
      suggestions.push(`Add ${this.RECOMMENDED_HASHTAGS.min}-${this.RECOMMENDED_HASHTAGS.max} relevant hashtags`);
    }

    return suggestions;
  }
}
