import { Injectable, Logger } from '@nestjs/common';

export interface QualityScore {
  overall: number; // 0-10
  authenticity: number; // 0-10
  engagement: number; // 0-10
  clarity: number; // 0-10
  platform: number; // 0-10
}

export interface ContentQualityResult {
  score: QualityScore;
  issues: {
    critical: string[];
    warnings: string[];
    suggestions: string[];
  };
  metrics: {
    readabilityScore: number;
    sentenceVariety: number;
    aiSlopCount: number;
    engagementElements: string[];
  };
}

@Injectable()
export class ContentValidatorService {
  private readonly logger = new Logger(ContentValidatorService.name);

  // AI slop indicators - phrases that scream "AI-generated"
  private readonly AI_SLOP_PHRASES = [
    'delve',
    'delve into',
    'unlock the power',
    'unlock',
    'game-changer',
    'game changer',
    'revolutionize',
    'in conclusion',
    'in summary',
    'to summarize',
    "it's important to note",
    'it is important to note',
    'tapestry',
    'landscape',
    'realm',
    'leverage',
    'synergy',
    'paradigm shift',
    'cutting-edge',
    'state-of-the-art',
    'best practices',
    'world-class',
    'robust',
    'seamless',
    'holistic',
    'innovative',
    'disruptive',
    'transformative',
    'at the end of the day',
    'think outside the box',
    'low-hanging fruit',
    'move the needle',
    'deep dive',
  ];

  // Corporate jargon to avoid
  private readonly CORPORATE_JARGON = [
    'circle back',
    'touch base',
    'synergize',
    'drill down',
    'bandwidth',
    'take it offline',
    'run it up the flagpole',
    'boil the ocean',
    'drinking from the fire hose',
  ];

  // Good engagement indicators
  private readonly ENGAGEMENT_ELEMENTS = {
    question: /\?/,
    numbers: /\d+/,
    listFormat: /^(\d+\.|[-•])/m,
    hook: /^(Stop|Start|Here's|I spent|The biggest)/i,
    actionWord: /\b(learn|discover|create|build|avoid|start|stop)\b/i,
  };

  /**
   * Validate content quality and check for AI slop
   */
  validateContent(content: string): ContentQualityResult {
    const issues = {
      critical: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
    };

    // Check for AI slop
    const slopFound = this.detectAISlop(content);
    if (slopFound.length > 0) {
      issues.warnings.push(
        `AI slop detected: "${slopFound.join('", "')}". Consider rewriting for authenticity.`,
      );
    }

    // Check for corporate jargon
    const jargonFound = this.detectCorporateJargon(content);
    if (jargonFound.length > 0) {
      issues.warnings.push(
        `Corporate jargon found: "${jargonFound.join('", "')}". Use plain language.`,
      );
    }

    // Check engagement elements
    const engagementElements = this.detectEngagementElements(content);
    if (engagementElements.length === 0) {
      issues.suggestions.push('Add engagement elements: questions, numbers, or action words.');
    }

    // Check readability
    const readabilityScore = this.calculateReadability(content);
    if (readabilityScore < 60) {
      issues.warnings.push('Content is hard to read. Simplify sentences and use shorter words.');
    }

    // Check sentence variety
    const sentenceVariety = this.calculateSentenceVariety(content);
    if (sentenceVariety < 0.3) {
      issues.suggestions.push('Vary sentence length for better flow.');
    }

    // Check for generic content
    if (this.isGeneric(content)) {
      issues.critical.push('Content is too generic. Add specific examples, data, or insights.');
    }

    // Calculate scores
    const score = this.calculateQualityScore(
      content,
      slopFound.length,
      jargonFound.length,
      engagementElements.length,
      readabilityScore,
      sentenceVariety,
    );

    const metrics = {
      readabilityScore,
      sentenceVariety,
      aiSlopCount: slopFound.length,
      engagementElements,
    };

    this.logger.debug(
      `Content validated. Overall score: ${score.overall}/10, AI slop: ${slopFound.length}`,
    );

    return {
      score,
      issues,
      metrics,
    };
  }

  /**
   * Detect AI slop phrases in content
   */
  private detectAISlop(content: string): string[] {
    const lowerContent = content.toLowerCase();
    return this.AI_SLOP_PHRASES.filter((phrase) => lowerContent.includes(phrase.toLowerCase()));
  }

  /**
   * Detect corporate jargon
   */
  private detectCorporateJargon(content: string): string[] {
    const lowerContent = content.toLowerCase();
    return this.CORPORATE_JARGON.filter((jargon) => lowerContent.includes(jargon.toLowerCase()));
  }

  /**
   * Detect engagement elements
   */
  private detectEngagementElements(content: string): string[] {
    const elements: string[] = [];

    for (const [element, regex] of Object.entries(this.ENGAGEMENT_ELEMENTS)) {
      if (regex.test(content)) {
        elements.push(element);
      }
    }

    return elements;
  }

  /**
   * Calculate Flesch Reading Ease score (simplified)
   */
  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const syllables = this.countSyllables(content);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in text (simplified)
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;

    for (const word of words) {
      // Simple syllable counting
      const vowels = word.match(/[aeiouy]+/g);
      let syllables = vowels ? vowels.length : 0;

      // Adjust for silent e
      if (word.endsWith('e')) {
        syllables--;
      }

      // Minimum 1 syllable per word
      totalSyllables += Math.max(1, syllables);
    }

    return totalSyllables;
  }

  /**
   * Calculate sentence variety (coefficient of variation)
   */
  private calculateSentenceVariety(content: string): number {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    if (sentences.length < 2) return 1;

    const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((sum, length) => sum + Math.pow(length - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? stdDev / mean : 0;
  }

  /**
   * Check if content is too generic
   */
  private isGeneric(content: string): boolean {
    // Generic indicators
    const genericPhrases = [
      'many people',
      'it is well known',
      'everyone knows',
      'as we all know',
      'generally speaking',
      "in today's world",
      'in this day and age',
    ];

    const lowerContent = content.toLowerCase();
    const genericCount = genericPhrases.filter((phrase) => lowerContent.includes(phrase)).length;

    // Check for lack of specifics (no numbers, names, or concrete examples)
    const hasNumbers = /\d+/.test(content);
    const hasSpecifics = /\b(because|example|specifically|for instance)\b/i.test(content);

    return genericCount > 0 || (!hasNumbers && !hasSpecifics && content.length > 100);
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    content: string,
    slopCount: number,
    jargonCount: number,
    engagementCount: number,
    readability: number,
    sentenceVariety: number,
  ): QualityScore {
    // Authenticity score (10 - slop/jargon penalties)
    let authenticity = 10 - slopCount * 2 - jargonCount;
    authenticity = Math.max(0, Math.min(10, authenticity));

    // Engagement score (based on engagement elements)
    let engagement = Math.min(10, engagementCount * 3);
    if (this.isGeneric(content)) {
      engagement = Math.max(0, engagement - 3);
    }

    // Clarity score (based on readability)
    const clarity = Math.min(10, readability / 10);

    // Platform score (sentence variety and structure)
    const platform = Math.min(10, sentenceVariety * 10 + 5);

    // Overall score (weighted average)
    const overall = authenticity * 0.3 + engagement * 0.3 + clarity * 0.2 + platform * 0.2;

    return {
      overall: Math.round(overall * 10) / 10,
      authenticity: Math.round(authenticity * 10) / 10,
      engagement: Math.round(engagement * 10) / 10,
      clarity: Math.round(clarity * 10) / 10,
      platform: Math.round(platform * 10) / 10,
    };
  }

  /**
   * Quick check if content passes minimum quality threshold
   */
  isAcceptableQuality(content: string, minScore: number = 6): boolean {
    const result = this.validateContent(content);
    return result.score.overall >= minScore && result.issues.critical.length === 0;
  }
}
