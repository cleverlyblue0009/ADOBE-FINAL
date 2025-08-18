// Text Analysis Service for Intelligent Highlighting
// This service analyzes PDF text content to identify different types of information
// and provides intelligent highlighting suggestions

export interface ContentType {
  type: 'key-concept' | 'statistic' | 'definition' | 'action-item' | 'conclusion';
  color: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  priority: number; // 1-10, higher is more important
}

export interface AnalyzedText {
  text: string;
  contentType: ContentType;
  relevanceScore: number;
  explanation: string;
  keywords: string[];
}

export class TextAnalysisService {
  private keyConceptPatterns = [
    /\b(?:key|important|crucial|significant|essential|fundamental|critical|main|primary|central|core)\s+(?:concept|idea|principle|factor|element|aspect|point)\b/gi,
    /\b(?:this is|it is|these are)\s+(?:important|significant|crucial|essential)\b/gi,
    /\b(?:note that|remember that|keep in mind|it's important to)\b/gi,
    /\b(?:definition|meaning|refers to|is defined as|can be understood as)\b/gi
  ];

  private statisticPatterns = [
    /\b\d+(?:\.\d+)?%\b/g, // Percentages
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|thousand|k|m|b)\b/gi, // Large numbers
    /\b(?:increased|decreased|grew|fell|rose|dropped)\s+by\s+\d+/gi, // Change indicators
    /\b\d+(?:\.\d+)?\s*(?:times|fold|x)\s+(?:higher|lower|more|less)\b/gi, // Comparisons
    /\b(?:average|median|mean|total|sum|approximately|roughly)\s+\d+/gi, // Statistical terms
    /\b\d+\s*(?:years?|months?|days?|hours?|minutes?)\b/gi // Time periods
  ];

  private definitionPatterns = [
    /\b(.+?)\s+(?:is|are|means?|refers? to|can be (?:defined|described) as|is known as)\s+(.+?)(?:\.|$)/gi,
    /\b(?:definition|terminology|glossary|meaning):/gi,
    /\b(.+?):\s*(.+?)(?:\n|$)/g, // Colon definitions
    /\b(?:in other words|that is|i\.e\.|namely|specifically)\b/gi
  ];

  private actionItemPatterns = [
    /\b(?:should|must|need to|have to|ought to|required to|necessary to)\b/gi,
    /\b(?:action|step|measure|approach|strategy|method|solution|recommendation)\b/gi,
    /\b(?:implement|execute|perform|conduct|carry out|take action)\b/gi,
    /\b(?:next steps?|following actions?|recommendations?|suggestions?)\b/gi,
    /\b(?:conclusion|summary|in conclusion|to summarize|finally)\b/gi
  ];

  private conclusionPatterns = [
    /\b(?:therefore|thus|hence|consequently|as a result|in conclusion|to conclude)\b/gi,
    /\b(?:findings|results|outcomes|implications|significance)\b/gi,
    /\b(?:this (?:shows|demonstrates|indicates|suggests|reveals|proves))\b/gi,
    /\b(?:we can conclude|it can be concluded|the evidence suggests)\b/gi
  ];

  // Keywords that indicate importance in academic/business contexts
  private importanceKeywords = [
    'breakthrough', 'revolutionary', 'significant', 'major', 'critical', 'essential',
    'fundamental', 'key', 'primary', 'main', 'central', 'core', 'vital', 'crucial',
    'important', 'notable', 'remarkable', 'substantial', 'considerable', 'extensive'
  ];

  // Technical terms that might need definitions
  private technicalTerms = [
    'algorithm', 'methodology', 'framework', 'paradigm', 'protocol', 'infrastructure',
    'architecture', 'implementation', 'optimization', 'analysis', 'synthesis', 'evaluation'
  ];

  analyzeText(text: string, context?: string): AnalyzedText[] {
    const analyzedTexts: AnalyzedText[] = [];
    const sentences = this.splitIntoSentences(text);

    sentences.forEach((sentence, index) => {
      const analysis = this.analyzeSentence(sentence, index, context);
      if (analysis && analysis.contentType.priority >= 5) { // Only include high-priority content
        analyzedTexts.push(analysis);
      }
    });

    // Sort by priority and relevance score
    return analyzedTexts.sort((a, b) => 
      (b.contentType.priority * b.relevanceScore) - (a.contentType.priority * a.relevanceScore)
    );
  }

  private splitIntoSentences(text: string): string[] {
    // Split text into sentences while preserving context
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
    return sentences.map(s => s.trim()).filter(s => s.length > 20); // Filter out very short sentences
  }

  private analyzeSentence(sentence: string, index: number, context?: string): AnalyzedText | null {
    const lowerSentence = sentence.toLowerCase();
    
    // Check for key concepts
    if (this.matchesPatterns(sentence, this.keyConceptPatterns) || 
        this.containsImportanceKeywords(lowerSentence)) {
      return {
        text: sentence,
        contentType: {
          type: 'key-concept',
          color: 'primary',
          priority: this.calculatePriority(sentence, 'key-concept')
        },
        relevanceScore: this.calculateRelevanceScore(sentence, context),
        explanation: 'Key concept identified - contains important information relevant to understanding the topic',
        keywords: this.extractKeywords(sentence)
      };
    }

    // Check for statistics
    if (this.matchesPatterns(sentence, this.statisticPatterns)) {
      return {
        text: sentence,
        contentType: {
          type: 'statistic',
          color: 'tertiary', // Blue for statistics
          priority: this.calculatePriority(sentence, 'statistic')
        },
        relevanceScore: this.calculateRelevanceScore(sentence, context),
        explanation: 'Statistical data or quantitative information that supports the main arguments',
        keywords: this.extractKeywords(sentence)
      };
    }

    // Check for definitions
    if (this.matchesPatterns(sentence, this.definitionPatterns)) {
      return {
        text: sentence,
        contentType: {
          type: 'definition',
          color: 'secondary', // Green for definitions
          priority: this.calculatePriority(sentence, 'definition')
        },
        relevanceScore: this.calculateRelevanceScore(sentence, context),
        explanation: 'Definition or explanation of important terms and concepts',
        keywords: this.extractKeywords(sentence)
      };
    }

    // Check for action items
    if (this.matchesPatterns(sentence, this.actionItemPatterns)) {
      return {
        text: sentence,
        contentType: {
          type: 'action-item',
          color: 'quaternary', // Orange for action items
          priority: this.calculatePriority(sentence, 'action-item')
        },
        relevanceScore: this.calculateRelevanceScore(sentence, context),
        explanation: 'Action item, recommendation, or step that requires attention',
        keywords: this.extractKeywords(sentence)
      };
    }

    // Check for conclusions
    if (this.matchesPatterns(sentence, this.conclusionPatterns)) {
      return {
        text: sentence,
        contentType: {
          type: 'conclusion',
          color: 'primary', // Yellow for conclusions
          priority: this.calculatePriority(sentence, 'conclusion')
        },
        relevanceScore: this.calculateRelevanceScore(sentence, context),
        explanation: 'Conclusion or key finding that summarizes important results',
        keywords: this.extractKeywords(sentence)
      };
    }

    return null;
  }

  private matchesPatterns(text: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(text));
  }

  private containsImportanceKeywords(text: string): boolean {
    return this.importanceKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  private calculatePriority(sentence: string, type: string): number {
    let priority = 5; // Base priority
    
    // Increase priority based on sentence characteristics
    if (sentence.length > 100 && sentence.length < 300) priority += 1; // Good length
    if (this.containsImportanceKeywords(sentence.toLowerCase())) priority += 2;
    if (sentence.includes('important') || sentence.includes('significant')) priority += 1;
    
    // Type-specific priority adjustments
    switch (type) {
      case 'key-concept':
        priority += 2;
        break;
      case 'statistic':
        priority += 1;
        break;
      case 'definition':
        priority += 1;
        break;
      case 'action-item':
        priority += 2;
        break;
      case 'conclusion':
        priority += 3;
        break;
    }

    return Math.min(10, Math.max(1, priority));
  }

  private calculateRelevanceScore(sentence: string, context?: string): number {
    let score = 0.7; // Base score

    // Increase score based on sentence quality
    const wordCount = sentence.split(' ').length;
    if (wordCount >= 10 && wordCount <= 40) score += 0.1; // Good length
    
    if (this.containsImportanceKeywords(sentence.toLowerCase())) score += 0.1;
    
    // Context relevance
    if (context) {
      const contextWords = context.toLowerCase().split(' ');
      const sentenceWords = sentence.toLowerCase().split(' ');
      const overlap = sentenceWords.filter(word => 
        contextWords.includes(word) && word.length > 3
      ).length;
      
      if (overlap > 0) {
        score += Math.min(0.2, overlap * 0.05);
      }
    }

    return Math.min(1.0, Math.max(0.1, score));
  }

  private extractKeywords(sentence: string): string[] {
    // Extract meaningful keywords from the sentence
    const words = sentence.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !this.isStopWord(word)
      );

    // Return top 5 most relevant words
    return words.slice(0, 5);
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is',
      'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  // Analyze an entire document to find the most relevant sections
  analyzeDocument(fullText: string, persona?: string, jobToBeDone?: string): AnalyzedText[] {
    const context = `${persona || ''} ${jobToBeDone || ''}`.trim();
    const analyzed = this.analyzeText(fullText, context);
    
    // Filter and deduplicate
    const uniqueTexts = new Map<string, AnalyzedText>();
    
    analyzed.forEach(item => {
      const key = item.text.substring(0, 50); // Use first 50 chars as key
      if (!uniqueTexts.has(key) || uniqueTexts.get(key)!.relevanceScore < item.relevanceScore) {
        uniqueTexts.set(key, item);
      }
    });
    
    return Array.from(uniqueTexts.values())
      .sort((a, b) => (b.contentType.priority * b.relevanceScore) - (a.contentType.priority * a.relevanceScore))
      .slice(0, 20); // Return top 20 most relevant items
  }

  // Get terms that might need "Do You Know?" tooltips
  getComplexTerms(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 6); // Focus on longer words

    const complexTerms = words.filter(word => 
      this.technicalTerms.includes(word) ||
      this.isLikelyTechnicalTerm(word)
    );

    // Remove duplicates and return
    return [...new Set(complexTerms)];
  }

  private isLikelyTechnicalTerm(word: string): boolean {
    // Heuristics for identifying technical terms
    return (
      word.length > 8 || // Long words are often technical
      word.includes('tion') || // Common technical suffix
      word.includes('ology') || // Scientific terms
      word.includes('ment') || // Process terms
      /[A-Z]{2,}/.test(word) // Acronyms (if original case preserved)
    );
  }
}

export const textAnalysisService = new TextAnalysisService();