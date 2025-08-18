import nlp from 'compromise';

export interface AnalyzedText {
  concepts: string[];
  statistics: string[];
  definitions: string[];
  actionItems: string[];
}

export interface HighlightableSegment {
  text: string;
  type: 'concept' | 'statistic' | 'definition' | 'action';
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export class TextAnalyzer {
  private conceptKeywords = [
    'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
    'algorithm', 'methodology', 'framework', 'approach', 'technique', 'model',
    'system', 'technology', 'innovation', 'development', 'implementation',
    'analysis', 'research', 'study', 'investigation', 'examination',
    'concept', 'theory', 'principle', 'foundation', 'basis'
  ];

  private statisticPatterns = [
    /\d+(\.\d+)?%/g,
    /\d+(\.\d+)?\s*(percent|percentage)/gi,
    /\d+(\.\d+)?\s*(times|fold|x)/gi,
    /\d+(\.\d+)?\s*(million|billion|thousand)/gi,
    /\$\d+(\.\d+)?[kmb]?/gi,
    /\d+(\.\d+)?\s*(years?|months?|days?|hours?)/gi,
    /\d+(\.\d+)?\s*(patients?|participants?|subjects?)/gi,
    /accuracy|sensitivity|specificity|precision|recall/gi,
    /p\s*[<>=]\s*0\.\d+/gi,
    /\d+(\.\d+)?\s*(standard deviations?|sd)/gi
  ];

  private definitionIndicators = [
    'is defined as', 'refers to', 'means', 'is', 'are', 'represents',
    'denotes', 'indicates', 'signifies', 'characterizes', 'describes',
    'encompasses', 'involves', 'consists of', 'comprises', 'includes'
  ];

  private actionIndicators = [
    'should', 'must', 'need to', 'required to', 'recommended',
    'suggest', 'propose', 'recommend', 'advise', 'urge',
    'conclude', 'determine', 'establish', 'implement', 'develop',
    'create', 'build', 'design', 'construct', 'formulate',
    'future work', 'next steps', 'further research', 'follow-up'
  ];

  /**
   * Analyze text and identify segments for highlighting
   */
  analyzeText(text: string): HighlightableSegment[] {
    const segments: HighlightableSegment[] = [];
    const doc = nlp(text);
    
    // Find concepts (important terms and technical concepts)
    this.findConcepts(text, doc, segments);
    
    // Find statistics and data
    this.findStatistics(text, segments);
    
    // Find definitions
    this.findDefinitions(text, doc, segments);
    
    // Find action items and conclusions
    this.findActionItems(text, doc, segments);
    
    // Sort by confidence and remove overlaps
    return this.removeOverlaps(segments.sort((a, b) => b.confidence - a.confidence));
  }

  /**
   * Find key concepts in the text
   */
  private findConcepts(text: string, doc: any, segments: HighlightableSegment[]): void {
    // Find technical terms and important nouns
    const nouns = doc.nouns().out('array');
    const terms = doc.terms().out('array');
    
    // Check for concept keywords
    this.conceptKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        segments.push({
          text: match[0],
          type: 'concept',
          confidence: 0.8,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });
    
    // Find capitalized terms (likely important concepts)
    const capitalizedTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    capitalizedTerms.forEach(term => {
      if (term.length > 3 && !this.isCommonWord(term)) {
        const index = text.indexOf(term);
        if (index !== -1) {
          segments.push({
            text: term,
            type: 'concept',
            confidence: 0.6,
            startIndex: index,
            endIndex: index + term.length
          });
        }
      }
    });
    
    // Find technical acronyms
    const acronyms = text.match(/\b[A-Z]{2,}\b/g) || [];
    acronyms.forEach(acronym => {
      if (acronym.length >= 2 && acronym.length <= 6) {
        const index = text.indexOf(acronym);
        if (index !== -1) {
          segments.push({
            text: acronym,
            type: 'concept',
            confidence: 0.7,
            startIndex: index,
            endIndex: index + acronym.length
          });
        }
      }
    });
  }

  /**
   * Find statistics and numerical data
   */
  private findStatistics(text: string, segments: HighlightableSegment[]): void {
    this.statisticPatterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(text)) !== null) {
        // Expand match to include surrounding context
        const contextStart = Math.max(0, match.index - 20);
        const contextEnd = Math.min(text.length, match.index + match[0].length + 20);
        const context = text.substring(contextStart, contextEnd);
        
        // Find sentence boundaries
        const sentenceStart = text.lastIndexOf('.', match.index) + 1;
        const sentenceEnd = text.indexOf('.', match.index + match[0].length);
        const sentence = text.substring(
          Math.max(0, sentenceStart),
          sentenceEnd === -1 ? text.length : sentenceEnd
        ).trim();
        
        if (sentence.length > 10 && sentence.length < 200) {
          segments.push({
            text: sentence,
            type: 'statistic',
            confidence: 0.9,
            startIndex: Math.max(0, sentenceStart),
            endIndex: sentenceEnd === -1 ? text.length : sentenceEnd
          });
        }
      }
    });
  }

  /**
   * Find definitions in the text
   */
  private findDefinitions(text: string, doc: any, segments: HighlightableSegment[]): void {
    this.definitionIndicators.forEach(indicator => {
      const regex = new RegExp(`([^.!?]+)\\s+${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+([^.!?]+[.!?])`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const fullMatch = match[0];
        if (fullMatch.length > 20 && fullMatch.length < 300) {
          segments.push({
            text: fullMatch.trim(),
            type: 'definition',
            confidence: 0.85,
            startIndex: match.index,
            endIndex: match.index + fullMatch.length
          });
        }
      }
    });
    
    // Find parenthetical definitions
    const parentheticalDefs = text.match(/\w+\s*\([^)]+\)/g) || [];
    parentheticalDefs.forEach(def => {
      if (def.length > 10 && def.length < 100) {
        const index = text.indexOf(def);
        if (index !== -1) {
          segments.push({
            text: def,
            type: 'definition',
            confidence: 0.7,
            startIndex: index,
            endIndex: index + def.length
          });
        }
      }
    });
  }

  /**
   * Find action items and conclusions
   */
  private findActionItems(text: string, doc: any, segments: HighlightableSegment[]): void {
    this.actionIndicators.forEach(indicator => {
      const regex = new RegExp(`([^.!?]*\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^.!?]*[.!?])`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const sentence = match[1].trim();
        if (sentence.length > 15 && sentence.length < 250) {
          segments.push({
            text: sentence,
            type: 'action',
            confidence: 0.8,
            startIndex: match.index,
            endIndex: match.index + sentence.length
          });
        }
      }
    });
    
    // Find imperative sentences (commands/recommendations)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      const doc = nlp(trimmed);
      
      if (doc.has('#Imperative') || this.isImperativeSentence(trimmed)) {
        const index = text.indexOf(trimmed);
        if (index !== -1) {
          segments.push({
            text: trimmed,
            type: 'action',
            confidence: 0.6,
            startIndex: index,
            endIndex: index + trimmed.length
          });
        }
      }
    });
  }

  /**
   * Check if a sentence is imperative
   */
  private isImperativeSentence(sentence: string): boolean {
    const imperativeStarters = [
      'consider', 'ensure', 'implement', 'develop', 'create', 'establish',
      'maintain', 'avoid', 'prevent', 'increase', 'decrease', 'improve',
      'optimize', 'enhance', 'evaluate', 'assess', 'monitor', 'track'
    ];
    
    const firstWord = sentence.toLowerCase().split(' ')[0];
    return imperativeStarters.includes(firstWord);
  }

  /**
   * Check if a word is a common word that shouldn't be highlighted
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'The', 'This', 'That', 'These', 'Those', 'And', 'But', 'Or',
      'However', 'Therefore', 'Moreover', 'Furthermore', 'Additionally',
      'Conclusion', 'Introduction', 'Method', 'Results', 'Discussion'
    ];
    return commonWords.includes(word);
  }

  /**
   * Remove overlapping segments, keeping the highest confidence ones
   */
  private removeOverlaps(segments: HighlightableSegment[]): HighlightableSegment[] {
    const result: HighlightableSegment[] = [];
    
    for (const segment of segments) {
      let overlaps = false;
      
      for (const existing of result) {
        if (this.segmentsOverlap(segment, existing)) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        result.push(segment);
      }
    }
    
    return result;
  }

  /**
   * Check if two segments overlap
   */
  private segmentsOverlap(a: HighlightableSegment, b: HighlightableSegment): boolean {
    return !(a.endIndex <= b.startIndex || b.endIndex <= a.startIndex);
  }

  /**
   * Get highlight color for segment type
   */
  getHighlightColor(type: HighlightableSegment['type']): 'primary' | 'secondary' | 'tertiary' | 'quaternary' {
    switch (type) {
      case 'concept': return 'primary';    // Yellow
      case 'statistic': return 'tertiary'; // Blue  
      case 'definition': return 'secondary'; // Green
      case 'action': return 'quaternary';  // Orange
      default: return 'primary';
    }
  }
}

// Export singleton instance
export const textAnalyzer = new TextAnalyzer();