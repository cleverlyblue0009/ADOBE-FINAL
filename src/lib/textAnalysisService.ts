import nlp from 'compromise';

export interface AnalyzedText {
  text: string;
  type: 'concept' | 'data' | 'definition' | 'action' | 'normal';
  importance: number;
  context: string;
  page: number;
  position: { start: number; end: number };
}

export interface HighlightColor {
  concept: 'primary';    // Yellow
  data: 'tertiary';      // Blue  
  definition: 'secondary'; // Green
  action: 'quaternary';   // Orange
}

export class TextAnalysisService {
  private conceptKeywords = [
    'concept', 'theory', 'principle', 'approach', 'methodology', 'framework',
    'model', 'paradigm', 'strategy', 'technique', 'method', 'system',
    'important', 'significant', 'crucial', 'essential', 'fundamental', 'key',
    'critical', 'vital', 'primary', 'main', 'core', 'central'
  ];

  private dataKeywords = [
    'data', 'statistics', 'number', 'percent', 'percentage', 'ratio', 'rate',
    'analysis', 'results', 'findings', 'evidence', 'research', 'study',
    'survey', 'experiment', 'test', 'measurement', 'metric', 'value',
    'figure', 'chart', 'graph', 'table', 'dataset'
  ];

  private definitionKeywords = [
    'define', 'definition', 'means', 'refers to', 'is defined as',
    'can be described as', 'is characterized by', 'involves', 'includes',
    'consists of', 'comprises', 'encompasses', 'terminology', 'term',
    'glossary', 'vocabulary', 'meaning', 'interpretation'
  ];

  private actionKeywords = [
    'should', 'must', 'need to', 'required', 'necessary', 'recommend',
    'suggest', 'propose', 'conclude', 'action', 'implementation',
    'next steps', 'future work', 'implications', 'recommendations',
    'conclusion', 'summary', 'takeaway', 'key points', 'objectives',
    'goals', 'targets', 'outcomes', 'deliverables'
  ];

  /**
   * Analyze text content and identify important sections for highlighting
   */
  analyzeText(text: string, page: number): AnalyzedText[] {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const analyzedTexts: AnalyzedText[] = [];
    let currentPosition = 0;

    sentences.forEach((sentence: string) => {
      const analysis = this.analyzeSentence(sentence, page, currentPosition);
      if (analysis.importance > 0.3) { // Only include sentences with reasonable importance
        analyzedTexts.push(analysis);
      }
      currentPosition += sentence.length + 1; // +1 for space/punctuation
    });

    return analyzedTexts.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Analyze a single sentence to determine its type and importance
   */
  private analyzeSentence(sentence: string, page: number, startPosition: number): AnalyzedText {
    const lowerSentence = sentence.toLowerCase();
    const doc = nlp(sentence);
    
    let type: 'concept' | 'data' | 'definition' | 'action' | 'normal' = 'normal';
    let importance = 0.1;
    let context = '';

    // Check for definitions
    if (this.containsKeywords(lowerSentence, this.definitionKeywords) || 
        this.isDefinitionSentence(sentence)) {
      type = 'definition';
      importance = 0.8;
      context = 'Contains definition or explanation of terms';
    }
    // Check for data and statistics
    else if (this.containsKeywords(lowerSentence, this.dataKeywords) || 
             this.containsNumbers(sentence)) {
      type = 'data';
      importance = 0.7;
      context = 'Contains statistical data or research findings';
    }
    // Check for key concepts
    else if (this.containsKeywords(lowerSentence, this.conceptKeywords) || 
             this.isConceptSentence(doc)) {
      type = 'concept';
      importance = 0.9;
      context = 'Contains important concepts or principles';
    }
    // Check for action items and conclusions
    else if (this.containsKeywords(lowerSentence, this.actionKeywords) || 
             this.isActionSentence(sentence)) {
      type = 'action';
      importance = 0.6;
      context = 'Contains actionable insights or conclusions';
    }

    // Boost importance for sentences with emphasis markers
    if (this.hasEmphasisMarkers(sentence)) {
      importance = Math.min(1.0, importance + 0.2);
      context += ' (emphasized content)';
    }

    // Boost importance for sentences in headers or with formatting
    if (this.isLikelyHeader(sentence)) {
      importance = Math.min(1.0, importance + 0.3);
      context += ' (likely header or title)';
    }

    return {
      text: sentence.trim(),
      type,
      importance,
      context,
      page,
      position: { start: startPosition, end: startPosition + sentence.length }
    };
  }

  /**
   * Check if sentence contains specific keywords
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check if sentence contains numbers or statistical data
   */
  private containsNumbers(text: string): boolean {
    const numberRegex = /\b\d+\.?\d*%?\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i;
    return numberRegex.test(text);
  }

  /**
   * Check if sentence is likely a definition
   */
  private isDefinitionSentence(sentence: string): boolean {
    const definitionPatterns = [
      /\b\w+\s+(is|are|means?|refers?\s+to|can\s+be\s+defined\s+as)/i,
      /\b(the\s+)?\w+\s+of\s+\w+\s+(is|are)/i,
      /\b\w+\s*:\s*.+/i // Colon-based definitions
    ];
    return definitionPatterns.some(pattern => pattern.test(sentence));
  }

  /**
   * Check if sentence contains important concepts using NLP
   */
  private isConceptSentence(doc: any): boolean {
    // Look for noun phrases that might be concepts
    const nounPhrases = doc.nouns().out('array');
    const hasImportantNouns = nounPhrases.some((noun: string) => 
      noun.length > 6 || // Longer nouns are often more conceptual
      this.conceptKeywords.some(keyword => noun.toLowerCase().includes(keyword))
    );

    // Look for adjectives that indicate importance
    const adjectives = doc.adjectives().out('array');
    const hasImportantAdjectives = adjectives.some((adj: string) =>
      ['important', 'significant', 'crucial', 'essential', 'key', 'major', 'primary'].includes(adj.toLowerCase())
    );

    return hasImportantNouns || hasImportantAdjectives;
  }

  /**
   * Check if sentence is action-oriented
   */
  private isActionSentence(sentence: string): boolean {
    const actionPatterns = [
      /\b(should|must|need\s+to|recommend|suggest|conclude)\b/i,
      /\b(next\s+steps?|action\s+items?|to\s+do)\b/i,
      /\b(therefore|thus|hence|consequently)\b/i
    ];
    return actionPatterns.some(pattern => pattern.test(sentence));
  }

  /**
   * Check if sentence has emphasis markers
   */
  private hasEmphasisMarkers(sentence: string): boolean {
    // Look for formatting that suggests emphasis
    return /\*\*.*\*\*|__.*__|IMPORTANT|NOTE:|WARNING:|KEY POINT/i.test(sentence) ||
           sentence.includes('!') ||
           /\b[A-Z]{2,}\b/.test(sentence); // ALL CAPS words
  }

  /**
   * Check if sentence is likely a header or title
   */
  private isLikelyHeader(sentence: string): boolean {
    return sentence.length < 100 && // Headers are usually short
           sentence.split(' ').length < 10 && // Not too many words
           (/^[A-Z]/.test(sentence) || // Starts with capital
            /^\d+\./.test(sentence) || // Numbered section
            sentence.includes(':') || // Section with colon
            /^[IVX]+\./.test(sentence)); // Roman numerals
  }

  /**
   * Get highlight color based on content type
   */
  getHighlightColor(type: 'concept' | 'data' | 'definition' | 'action' | 'normal'): 'primary' | 'secondary' | 'tertiary' | 'quaternary' {
    const colorMap = {
      concept: 'primary',     // Yellow - Key concepts
      data: 'tertiary',       // Blue - Statistics/data  
      definition: 'secondary', // Green - Definitions
      action: 'quaternary',    // Orange - Action items/conclusions
      normal: 'primary'        // Default to primary
    } as const;

    return colorMap[type] || 'primary';
  }

  /**
   * Extract key terms from text for hover tooltips
   */
  extractKeyTerms(text: string): Array<{ term: string; context: string; position: number }> {
    const doc = nlp(text);
    const terms: Array<{ term: string; context: string; position: number }> = [];
    
    // Extract technical terms (noun phrases with 2+ words)
    const nounPhrases = doc.match('#Noun+ #Noun+').out('array');
    nounPhrases.forEach((phrase: string) => {
      const position = text.toLowerCase().indexOf(phrase.toLowerCase());
      if (position !== -1 && phrase.length > 5) {
        terms.push({
          term: phrase,
          context: 'Technical term or concept',
          position
        });
      }
    });

    // Extract acronyms
    const acronyms = text.match(/\b[A-Z]{2,}\b/g) || [];
    acronyms.forEach(acronym => {
      const position = text.indexOf(acronym);
      terms.push({
        term: acronym,
        context: 'Acronym or abbreviation',
        position
      });
    });

    // Extract domain-specific terms (words ending in common technical suffixes)
    const technicalSuffixes = /-tion|-ism|-ology|-graphy|-metry|-ics$/;
    const words = doc.terms().out('array');
    words.forEach((word: string) => {
      if (technicalSuffixes.test(word) && word.length > 6) {
        const position = text.toLowerCase().indexOf(word.toLowerCase());
        if (position !== -1) {
          terms.push({
            term: word,
            context: 'Specialized terminology',
            position
          });
        }
      }
    });

    return terms.sort((a, b) => a.position - b.position);
  }
}

export const textAnalysisService = new TextAnalysisService();