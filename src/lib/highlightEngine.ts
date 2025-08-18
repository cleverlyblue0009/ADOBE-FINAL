// Enhanced Highlighting Engine
// Integrates with text analysis service to create intelligent highlights

import { textAnalysisService, AnalyzedText } from './textAnalysis';
import { Highlight } from '@/components/PDFReader';

export interface SmartHighlight extends Highlight {
  contentType: 'key-concept' | 'statistic' | 'definition' | 'action-item' | 'conclusion';
  keywords: string[];
  isSmartGenerated: boolean;
}

export class HighlightEngine {
  private colorMap = {
    'key-concept': 'primary' as const,    // Yellow
    'statistic': 'tertiary' as const,     // Blue  
    'definition': 'secondary' as const,   // Green
    'action-item': 'quaternary' as const, // Orange (we'll need to add this)
    'conclusion': 'primary' as const      // Yellow
  };

  // Generate smart highlights from document text
  generateSmartHighlights(
    documentText: string, 
    pageTexts: Map<number, string>,
    persona?: string,
    jobToBeDone?: string
  ): SmartHighlight[] {
    const smartHighlights: SmartHighlight[] = [];
    
    // Analyze the entire document for context
    const documentAnalysis = textAnalysisService.analyzeDocument(
      documentText, 
      persona, 
      jobToBeDone
    );

    // Process each page
    pageTexts.forEach((pageText, pageNumber) => {
      const pageAnalysis = textAnalysisService.analyzeText(pageText, `${persona} ${jobToBeDone}`);
      
      // Filter for high-quality highlights
      const qualityHighlights = pageAnalysis.filter(item => 
        item.relevanceScore > 0.7 && 
        item.contentType.priority >= 6 &&
        item.text.length >= 30 && // Minimum text length
        item.text.length <= 500   // Maximum text length
      );

      qualityHighlights.forEach((analyzedText, index) => {
        const highlight: SmartHighlight = {
          id: `smart-${pageNumber}-${index}-${Date.now()}`,
          text: analyzedText.text.trim(),
          page: pageNumber,
          color: this.colorMap[analyzedText.contentType.type] || 'primary',
          relevanceScore: analyzedText.relevanceScore,
          explanation: this.enhanceExplanation(analyzedText, persona, jobToBeDone),
          contentType: analyzedText.contentType.type,
          keywords: analyzedText.keywords,
          isSmartGenerated: true
        };

        smartHighlights.push(highlight);
      });
    });

    // Sort by relevance and priority, limit results
    return smartHighlights
      .sort((a, b) => (b.relevanceScore * 10) - (a.relevanceScore * 10))
      .slice(0, 15); // Limit to top 15 highlights to avoid overwhelming the user
  }

  // Generate highlights for a specific text selection
  generateContextualHighlights(
    selectedText: string,
    surroundingContext: string,
    pageNumber: number,
    persona?: string,
    jobToBeDone?: string
  ): SmartHighlight[] {
    const contextualText = `${surroundingContext} ${selectedText}`;
    const analysis = textAnalysisService.analyzeText(contextualText, `${persona} ${jobToBeDone}`);
    
    return analysis
      .filter(item => 
        item.text.includes(selectedText.substring(0, 30)) || 
        selectedText.includes(item.text.substring(0, 30))
      )
      .map((analyzedText, index) => ({
        id: `contextual-${pageNumber}-${index}-${Date.now()}`,
        text: analyzedText.text,
        page: pageNumber,
        color: this.colorMap[analyzedText.contentType.type] || 'primary',
        relevanceScore: analyzedText.relevanceScore,
        explanation: this.enhanceExplanation(analyzedText, persona, jobToBeDone),
        contentType: analyzedText.contentType.type,
        keywords: analyzedText.keywords,
        isSmartGenerated: true
      }));
  }

  // Enhance explanation with persona and job context
  private enhanceExplanation(
    analyzedText: AnalyzedText, 
    persona?: string, 
    jobToBeDone?: string
  ): string {
    let explanation = analyzedText.explanation;
    
    if (persona && jobToBeDone) {
      const contextualExplanations = {
        'key-concept': `This key concept is particularly relevant for ${persona} working on ${jobToBeDone}`,
        'statistic': `This statistical data provides important quantitative insights for your ${jobToBeDone} analysis`,
        'definition': `Understanding this definition is crucial for ${persona} to effectively ${jobToBeDone}`,
        'action-item': `This action item is directly applicable to your role as ${persona} in ${jobToBeDone}`,
        'conclusion': `This conclusion has strategic implications for your ${jobToBeDone} objectives`
      };
      
      explanation = contextualExplanations[analyzedText.contentType.type] || explanation;
    }

    // Add priority indicator
    const priorityText = analyzedText.contentType.priority >= 8 ? ' [HIGH PRIORITY]' : 
                        analyzedText.contentType.priority >= 6 ? ' [MEDIUM PRIORITY]' : 
                        ' [LOW PRIORITY]';
    
    return explanation + priorityText;
  }

  // Remove duplicate highlights based on text similarity
  deduplicateHighlights(highlights: SmartHighlight[]): SmartHighlight[] {
    const uniqueHighlights: SmartHighlight[] = [];
    const seenTexts = new Set<string>();

    highlights.forEach(highlight => {
      const textKey = this.normalizeTextForComparison(highlight.text);
      
      if (!seenTexts.has(textKey)) {
        seenTexts.add(textKey);
        uniqueHighlights.push(highlight);
      } else {
        // If we've seen similar text, keep the one with higher relevance
        const existingIndex = uniqueHighlights.findIndex(h => 
          this.normalizeTextForComparison(h.text) === textKey
        );
        
        if (existingIndex !== -1 && highlight.relevanceScore > uniqueHighlights[existingIndex].relevanceScore) {
          uniqueHighlights[existingIndex] = highlight;
        }
      }
    });

    return uniqueHighlights;
  }

  // Normalize text for comparison (remove minor differences)
  private normalizeTextForComparison(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100); // Use first 100 chars for comparison
  }

  // Get highlights by content type
  getHighlightsByType(
    highlights: SmartHighlight[], 
    contentType: 'key-concept' | 'statistic' | 'definition' | 'action-item' | 'conclusion'
  ): SmartHighlight[] {
    return highlights.filter(h => h.contentType === contentType);
  }

  // Get highlights by page
  getHighlightsByPage(highlights: SmartHighlight[], pageNumber: number): SmartHighlight[] {
    return highlights.filter(h => h.page === pageNumber);
  }

  // Convert SmartHighlight to regular Highlight for compatibility
  toRegularHighlight(smartHighlight: SmartHighlight): Highlight {
    return {
      id: smartHighlight.id,
      text: smartHighlight.text,
      page: smartHighlight.page,
      color: smartHighlight.color,
      relevanceScore: smartHighlight.relevanceScore,
      explanation: smartHighlight.explanation
    };
  }

  // Convert regular highlights to smart highlights
  fromRegularHighlights(highlights: Highlight[]): SmartHighlight[] {
    return highlights.map(h => ({
      ...h,
      contentType: 'key-concept' as const, // Default type
      keywords: [],
      isSmartGenerated: false
    }));
  }

  // Analyze existing highlights and suggest improvements
  analyzeExistingHighlights(highlights: Highlight[], documentText: string): {
    suggestions: string[];
    missingTypes: string[];
    qualityScore: number;
  } {
    const suggestions: string[] = [];
    const missingTypes: string[] = [];
    let qualityScore = 0;

    // Check for content type diversity
    const smartHighlights = this.fromRegularHighlights(highlights);
    const types = new Set(smartHighlights.map(h => h.contentType));
    
    const allTypes = ['key-concept', 'statistic', 'definition', 'action-item', 'conclusion'];
    allTypes.forEach(type => {
      if (!types.has(type as any)) {
        missingTypes.push(type);
      }
    });

    // Quality assessment
    const avgLength = highlights.reduce((sum, h) => sum + h.text.length, 0) / highlights.length;
    const avgRelevance = highlights.reduce((sum, h) => sum + h.relevanceScore, 0) / highlights.length;

    qualityScore = Math.round(
      (avgRelevance * 50) + // Relevance score weight
      (Math.min(avgLength / 100, 1) * 20) + // Length quality weight
      ((5 - missingTypes.length) * 6) // Type diversity weight
    );

    // Generate suggestions
    if (avgLength < 50) {
      suggestions.push("Consider highlighting longer, more complete sentences for better context");
    }
    if (avgRelevance < 0.7) {
      suggestions.push("Focus on more relevant content that directly relates to your goals");
    }
    if (missingTypes.length > 2) {
      suggestions.push("Try to highlight different types of content (statistics, definitions, conclusions)");
    }

    return { suggestions, missingTypes, qualityScore };
  }
}

export const highlightEngine = new HighlightEngine();