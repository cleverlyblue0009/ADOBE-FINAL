import { Highlight } from '@/components/PDFReader';
import { textAnalysisService, AnalyzedText } from './textAnalysisService';

export interface EnhancedHighlight extends Highlight {
  type: 'concept' | 'data' | 'definition' | 'action' | 'normal';
  importance: number;
  context: string;
}

export interface TextPosition {
  pageNumber: number;
  textContent: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class EnhancedPdfHighlighter {
  private highlights: Map<string, EnhancedHighlight> = new Map();
  private styleSheet: HTMLStyleElement | null = null;

  constructor() {
    this.addHighlightStyles();
  }

  // Add CSS styles for enhanced highlights
  addHighlightStyles() {
    if (this.styleSheet) return; // Already added

    this.styleSheet = document.createElement('style');
    this.styleSheet.textContent = `
      .enhanced-pdf-highlight {
        position: absolute;
        pointer-events: none;
        mix-blend-mode: multiply;
        border-radius: 3px;
        transition: all 0.2s ease-in-out;
        z-index: 10;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .enhanced-pdf-highlight.primary {
        background: linear-gradient(135deg, rgba(254, 240, 138, 0.4), rgba(251, 191, 36, 0.3));
        border: 1px solid rgba(251, 191, 36, 0.6);
      }
      
      .enhanced-pdf-highlight.secondary {
        background: linear-gradient(135deg, rgba(134, 239, 172, 0.4), rgba(34, 197, 94, 0.3));
        border: 1px solid rgba(34, 197, 94, 0.6);
      }
      
      .enhanced-pdf-highlight.tertiary {
        background: linear-gradient(135deg, rgba(147, 197, 253, 0.4), rgba(59, 130, 246, 0.3));
        border: 1px solid rgba(59, 130, 246, 0.6);
      }
      
      .enhanced-pdf-highlight.quaternary {
        background: linear-gradient(135deg, rgba(253, 186, 116, 0.4), rgba(251, 146, 60, 0.3));
        border: 1px solid rgba(251, 146, 60, 0.6);
      }
      
      .enhanced-pdf-highlight:hover {
        opacity: 0.9;
        pointer-events: auto;
        cursor: pointer;
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .enhanced-pdf-highlight.high-importance {
        animation: pulse-glow 2s infinite;
      }
      
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        50% { box-shadow: 0 4px 16px rgba(0,0,0,0.2), 0 0 8px rgba(59, 130, 246, 0.3); }
      }
      
      .pdf-text-layer {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
      }
      
      .pdf-text-layer span {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
      }

      .highlight-tooltip {
        position: absolute;
        background: rgba(17, 24, 39, 0.95);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        max-width: 200px;
        z-index: 50;
        pointer-events: none;
        transform: translateY(-100%);
        margin-top: -8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        backdrop-filter: blur(8px);
      }
      
      .highlight-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: rgba(17, 24, 39, 0.95);
      }
    `;
    document.head.appendChild(this.styleSheet);
  }

  /**
   * Generate intelligent highlights from PDF text content
   */
  async generateIntelligentHighlights(pageContent: string, pageNumber: number): Promise<EnhancedHighlight[]> {
    try {
      // Analyze the text content
      const analyzedTexts = textAnalysisService.analyzeText(pageContent, pageNumber);
      
      // Convert analyzed texts to highlights, but limit to top 5 most important
      const topAnalyzedTexts = analyzedTexts.slice(0, 5);
      
      const highlights: EnhancedHighlight[] = topAnalyzedTexts.map((analyzed, index) => ({
        id: `intelligent-${pageNumber}-${index}`,
        text: analyzed.text,
        page: pageNumber,
        color: this.getColorForType(analyzed.type),
        relevanceScore: analyzed.importance,
        explanation: analyzed.context,
        type: analyzed.type,
        importance: analyzed.importance,
        context: analyzed.context
      }));

      return highlights;
    } catch (error) {
      console.error('Error generating intelligent highlights:', error);
      return [];
    }
  }

  /**
   * Get color mapping for different content types
   */
  private getColorForType(type: 'concept' | 'data' | 'definition' | 'action' | 'normal'): 'primary' | 'secondary' | 'tertiary' | 'quaternary' {
    const colorMap = {
      concept: 'primary',     // Yellow - Key concepts
      definition: 'secondary', // Green - Definitions
      data: 'tertiary',       // Blue - Statistics/data
      action: 'quaternary',   // Orange - Action items
      normal: 'primary'       // Default
    } as const;

    return colorMap[type];
  }

  /**
   * Find text positions in PDF page using enhanced text matching
   */
  findTextPositions(text: string, pageElement: HTMLElement): TextPosition[] {
    const positions: TextPosition[] = [];
    
    if (!text || text.length < 3) return positions;

    // Look for text layer in PDF.js rendered page
    const textLayer = pageElement.querySelector('.react-pdf__Page__textContent') as HTMLElement;
    if (!textLayer) return positions;

    const normalizedSearchText = text.toLowerCase().trim();
    
    // Get all text spans in the text layer
    const textSpans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
    
    // Build full text content with position mapping
    let fullText = '';
    const spanMap: { span: HTMLSpanElement; start: number; end: number }[] = [];
    
    textSpans.forEach(span => {
      const spanText = span.textContent || '';
      const start = fullText.length;
      fullText += spanText + ' ';
      const end = fullText.length - 1;
      spanMap.push({ span, start, end });
    });
    
    const fullTextLower = fullText.toLowerCase();
    
    // Use more intelligent text matching
    const matches = this.findBestTextMatches(normalizedSearchText, fullTextLower);
    
    matches.forEach(match => {
      const matchingSpans = spanMap.filter(({ start, end }) => 
        (match.start <= end && match.end >= start)
      );
      
      if (matchingSpans.length > 0) {
        // Calculate bounding box for all matching spans
        const rects = matchingSpans.map(({ span }) => span.getBoundingClientRect());
        const pageRect = pageElement.getBoundingClientRect();
        
        if (rects.length > 0) {
          const minX = Math.min(...rects.map(r => r.left));
          const minY = Math.min(...rects.map(r => r.top));
          const maxX = Math.max(...rects.map(r => r.right));
          const maxY = Math.max(...rects.map(r => r.bottom));
          
          positions.push({
            pageNumber: this.getPageNumber(pageElement),
            textContent: text,
            boundingBox: {
              x: minX - pageRect.left,
              y: minY - pageRect.top,
              width: maxX - minX,
              height: maxY - minY
            }
          });
        }
      }
    });
    
    return positions;
  }

  /**
   * Find best text matches using fuzzy matching for better accuracy
   */
  private findBestTextMatches(searchText: string, fullText: string): Array<{ start: number; end: number }> {
    const matches: Array<{ start: number; end: number }> = [];
    
    // Try exact match first
    let index = fullText.indexOf(searchText);
    if (index !== -1) {
      matches.push({ start: index, end: index + searchText.length });
      return matches;
    }
    
    // Try partial matches with different strategies
    const words = searchText.split(/\s+/).filter(word => word.length > 2);
    
    if (words.length > 1) {
      // Try matching first and last few words
      const firstWords = words.slice(0, Math.min(3, words.length)).join(' ');
      const lastWords = words.slice(-Math.min(3, words.length)).join(' ');
      
      index = fullText.indexOf(firstWords);
      if (index !== -1) {
        matches.push({ start: index, end: index + firstWords.length });
      }
      
      if (firstWords !== lastWords) {
        index = fullText.indexOf(lastWords);
        if (index !== -1) {
          matches.push({ start: index, end: index + lastWords.length });
        }
      }
    }
    
    // Try matching individual significant words
    words.forEach(word => {
      if (word.length > 4) { // Only match longer words
        index = fullText.indexOf(word);
        if (index !== -1) {
          matches.push({ start: index, end: index + word.length });
        }
      }
    });
    
    return matches;
  }

  /**
   * Apply enhanced highlights to a specific page
   */
  applyEnhancedHighlights(highlights: EnhancedHighlight[], pageNumber: number, pageElement?: HTMLElement) {
    // Remove existing highlights for this page
    this.removeHighlights(pageNumber);
    
    if (!pageElement) {
      pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`) as HTMLElement;
    }
    
    if (!pageElement) {
      console.warn(`Page element not found for page ${pageNumber}`);
      return;
    }

    const pageHighlights = highlights.filter(h => h.page === pageNumber);
    
    // Sort by importance so most important highlights are rendered last (on top)
    const sortedHighlights = pageHighlights.sort((a, b) => a.importance - b.importance);
    
    sortedHighlights.forEach(highlight => {
      this.createEnhancedHighlightOverlay(highlight, pageElement!);
    });
  }

  /**
   * Create enhanced highlight overlay element
   */
  private createEnhancedHighlightOverlay(highlight: EnhancedHighlight, pageElement: HTMLElement) {
    const positions = this.findTextPositions(highlight.text, pageElement);
    
    positions.forEach((position, index) => {
      const highlightElement = document.createElement('div');
      highlightElement.className = `enhanced-pdf-highlight ${highlight.color}`;
      
      // Add high importance class for animation
      if (highlight.importance > 0.8) {
        highlightElement.classList.add('high-importance');
      }
      
      highlightElement.id = `enhanced-highlight-${highlight.id}-${index}`;
      
      // Position the highlight
      highlightElement.style.cssText = `
        left: ${position.boundingBox.x}px;
        top: ${position.boundingBox.y}px;
        width: ${position.boundingBox.width}px;
        height: ${position.boundingBox.height}px;
      `;
      
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'highlight-tooltip';
      tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">
          ${this.getTypeLabel(highlight.type)} (${Math.round(highlight.importance * 100)}%)
        </div>
        <div style="font-size: 11px; opacity: 0.9;">
          ${highlight.context}
        </div>
      `;
      tooltip.style.display = 'none';
      
      // Add event handlers
      highlightElement.addEventListener('mouseenter', (e) => {
        tooltip.style.display = 'block';
        const rect = highlightElement.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top}px`;
        tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
      });
      
      highlightElement.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
      
      highlightElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onHighlightClick(highlight);
      });
      
      // Add to page element
      pageElement.style.position = 'relative';
      pageElement.appendChild(highlightElement);
      pageElement.appendChild(tooltip);
      
      // Store reference
      this.highlights.set(`${highlight.id}-${index}`, highlight);
    });
  }

  /**
   * Get human-readable label for highlight type
   */
  private getTypeLabel(type: string): string {
    const labels = {
      concept: 'Key Concept',
      definition: 'Definition',
      data: 'Data/Statistics',
      action: 'Action Item',
      normal: 'Important'
    };
    return labels[type as keyof typeof labels] || 'Important';
  }

  /**
   * Get page number from page element
   */
  private getPageNumber(pageElement: HTMLElement): number {
    const pageAttr = pageElement.getAttribute('data-page-number');
    if (pageAttr) return parseInt(pageAttr, 10);
    
    let element = pageElement;
    while (element) {
      const pageMatch = element.className.match(/page-(\d+)/);
      if (pageMatch) return parseInt(pageMatch[1], 10);
      element = element.parentElement as HTMLElement;
    }
    
    return 1;
  }

  /**
   * Handle highlight click
   */
  private onHighlightClick(highlight: EnhancedHighlight) {
    console.log('Enhanced highlight clicked:', highlight);
    
    // Dispatch custom event with enhanced data
    const event = new CustomEvent('enhancedHighlightClick', {
      detail: highlight,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Remove highlights for a specific page
   */
  removeHighlights(pageNumber: number) {
    const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`) as HTMLElement;
    if (!pageElement) return;
    
    const existingHighlights = pageElement.querySelectorAll('.enhanced-pdf-highlight');
    const existingTooltips = pageElement.querySelectorAll('.highlight-tooltip');
    
    existingHighlights.forEach(el => el.remove());
    existingTooltips.forEach(el => el.remove());
    
    // Clean up stored references
    for (const [key, highlight] of this.highlights.entries()) {
      if (highlight.page === pageNumber) {
        this.highlights.delete(key);
      }
    }
  }

  /**
   * Remove all highlights
   */
  removeAllHighlights() {
    const allHighlights = document.querySelectorAll('.enhanced-pdf-highlight');
    const allTooltips = document.querySelectorAll('.highlight-tooltip');
    
    allHighlights.forEach(el => el.remove());
    allTooltips.forEach(el => el.remove());
    this.highlights.clear();
  }

  /**
   * Enable text selection on PDF pages
   */
  enableTextSelection() {
    const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
    textLayers.forEach(layer => {
      layer.classList.add('pdf-text-layer');
    });
  }

  /**
   * Get current text selection
   */
  getTextSelection(): { text: string; pageNumber: number } | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const selectedText = selection.toString().trim();
    if (!selectedText) return null;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    let pageElement = container as Element;
    while (pageElement && !pageElement.matches('[data-page-number]')) {
      pageElement = pageElement.parentElement as Element;
    }
    
    if (!pageElement) return null;
    
    const pageNumber = this.getPageNumber(pageElement as HTMLElement);
    
    return {
      text: selectedText,
      pageNumber
    };
  }

  /**
   * Create highlight from current selection with intelligent typing
   */
  createHighlightFromSelection(color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary'): EnhancedHighlight | null {
    const selection = this.getTextSelection();
    if (!selection || selection.text.length < 5) return null;
    
    // Analyze the selected text to determine its type
    const analyzed = textAnalysisService.analyzeText(selection.text, selection.pageNumber);
    const analysis = analyzed[0] || {
      type: 'normal' as const,
      importance: 0.7,
      context: 'User-selected content'
    };
    
    const highlight: EnhancedHighlight = {
      id: `enhanced-user-highlight-${Date.now()}`,
      text: selection.text,
      page: selection.pageNumber,
      color: color || this.getColorForType(analysis.type),
      relevanceScore: analysis.importance,
      explanation: analysis.context,
      type: analysis.type,
      importance: analysis.importance,
      context: analysis.context
    };
    
    return highlight;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.removeAllHighlights();
    if (this.styleSheet) {
      this.styleSheet.remove();
      this.styleSheet = null;
    }
  }
}

// Export singleton instance
export const enhancedPdfHighlighter = new EnhancedPdfHighlighter();