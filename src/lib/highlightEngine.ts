import { Highlight } from '@/components/PDFReader';
import { textAnalyzer, HighlightableSegment } from './textAnalysis';

export interface SmartHighlight extends Highlight {
  type: 'concept' | 'statistic' | 'definition' | 'action';
  confidence: number;
  segment: HighlightableSegment;
}

export class HighlightEngine {
  private highlights: Map<string, SmartHighlight> = new Map();
  private styleSheet: HTMLStyleElement | null = null;

  constructor() {
    this.addHighlightStyles();
  }

  /**
   * Add enhanced CSS styles for different highlight types
   */
  private addHighlightStyles() {
    if (this.styleSheet) return;

    this.styleSheet = document.createElement('style');
    this.styleSheet.textContent = `
      .smart-pdf-highlight {
        position: absolute;
        pointer-events: none;
        mix-blend-mode: multiply;
        border-radius: 3px;
        transition: all 0.2s ease-in-out;
        z-index: 10;
        border-width: 1px;
        border-style: solid;
      }
      
      /* Key Concepts - Yellow */
      .smart-pdf-highlight.primary {
        background-color: rgba(254, 240, 138, 0.5);
        border-color: rgba(251, 191, 36, 0.8);
        box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.2);
      }
      
      /* Definitions - Green */
      .smart-pdf-highlight.secondary {
        background-color: rgba(134, 239, 172, 0.5);
        border-color: rgba(34, 197, 94, 0.8);
        box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.2);
      }
      
      /* Statistics - Blue */
      .smart-pdf-highlight.tertiary {
        background-color: rgba(147, 197, 253, 0.5);
        border-color: rgba(59, 130, 246, 0.8);
        box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
      }
      
      /* Action Items - Orange */
      .smart-pdf-highlight.quaternary {
        background-color: rgba(251, 146, 60, 0.5);
        border-color: rgba(249, 115, 22, 0.8);
        box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.2);
      }
      
      .smart-pdf-highlight:hover {
        opacity: 0.8;
        pointer-events: auto;
        cursor: pointer;
        transform: scale(1.02);
        z-index: 15;
      }
      
      .smart-pdf-highlight.high-confidence {
        border-width: 2px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .smart-pdf-highlight.medium-confidence {
        border-width: 1px;
      }
      
      .smart-pdf-highlight.low-confidence {
        border-width: 1px;
        opacity: 0.7;
      }
      
      /* Highlight type indicators */
      .smart-pdf-highlight::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      }
      
      .smart-pdf-highlight:hover::before {
        opacity: 1;
      }
      
      .smart-pdf-highlight.primary::before {
        background-color: #f59e0b;
      }
      
      .smart-pdf-highlight.secondary::before {
        background-color: #10b981;
      }
      
      .smart-pdf-highlight.tertiary::before {
        background-color: #3b82f6;
      }
      
      .smart-pdf-highlight.quaternary::before {
        background-color: #f97316;
      }
    `;
    document.head.appendChild(this.styleSheet);
  }

  /**
   * Analyze text content and generate intelligent highlights
   */
  generateSmartHighlights(textContent: string, pageNumber: number): SmartHighlight[] {
    const segments = textAnalyzer.analyzeText(textContent);
    const highlights: SmartHighlight[] = [];

    segments.forEach((segment, index) => {
      const highlight: SmartHighlight = {
        id: `smart-highlight-${pageNumber}-${index}`,
        text: segment.text,
        page: pageNumber,
        color: textAnalyzer.getHighlightColor(segment.type),
        relevanceScore: segment.confidence,
        explanation: this.getExplanationForType(segment.type, segment.confidence),
        type: segment.type,
        confidence: segment.confidence,
        segment: segment
      };

      highlights.push(highlight);
    });

    return highlights;
  }

  /**
   * Get explanation text for different highlight types
   */
  private getExplanationForType(type: string, confidence: number): string {
    const confidenceText = confidence > 0.8 ? 'High confidence' : 
                          confidence > 0.6 ? 'Medium confidence' : 'Low confidence';
    
    switch (type) {
      case 'concept':
        return `Key concept identified - ${confidenceText}`;
      case 'statistic':
        return `Important data/statistic - ${confidenceText}`;
      case 'definition':
        return `Definition or explanation - ${confidenceText}`;
      case 'action':
        return `Action item or conclusion - ${confidenceText}`;
      default:
        return `Highlighted content - ${confidenceText}`;
    }
  }

  /**
   * Apply smart highlights to a page element
   */
  applySmartHighlights(highlights: SmartHighlight[], pageElement: HTMLElement): void {
    // Remove existing highlights
    this.removeHighlights(pageElement);

    highlights.forEach(highlight => {
      this.createHighlightOverlay(highlight, pageElement);
    });
  }

  /**
   * Create highlight overlay element
   */
  private createHighlightOverlay(highlight: SmartHighlight, pageElement: HTMLElement): void {
    const positions = this.findTextPositions(highlight.text, pageElement);
    
    positions.forEach((position, index) => {
      const highlightElement = document.createElement('div');
      const confidenceClass = highlight.confidence > 0.8 ? 'high-confidence' :
                             highlight.confidence > 0.6 ? 'medium-confidence' : 'low-confidence';
      
      highlightElement.className = `smart-pdf-highlight ${highlight.color} ${confidenceClass}`;
      highlightElement.id = `${highlight.id}-${index}`;
      highlightElement.title = `${highlight.explanation}\nType: ${highlight.type}\nText: "${highlight.text.substring(0, 100)}${highlight.text.length > 100 ? '...' : ''}"`;
      
      // Position the highlight
      highlightElement.style.cssText = `
        left: ${position.x}px;
        top: ${position.y}px;
        width: ${position.width}px;
        height: ${position.height}px;
      `;
      
      // Add click handler for detailed information
      highlightElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onHighlightClick(highlight);
      });
      
      // Add hover handler for enhanced tooltip
      highlightElement.addEventListener('mouseenter', (e) => {
        this.showDetailedTooltip(e, highlight);
      });
      
      highlightElement.addEventListener('mouseleave', () => {
        this.hideDetailedTooltip();
      });
      
      // Add to page element
      pageElement.style.position = 'relative';
      pageElement.appendChild(highlightElement);
      
      // Store reference
      this.highlights.set(`${highlight.id}-${index}`, highlight);
    });
  }

  /**
   * Find text positions in the page element
   */
  private findTextPositions(text: string, pageElement: HTMLElement): Array<{x: number, y: number, width: number, height: number}> {
    const positions: Array<{x: number, y: number, width: number, height: number}> = [];
    
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
    
    // Find the text in the full content
    let searchIndex = fullTextLower.indexOf(normalizedSearchText);
    
    if (searchIndex !== -1) {
      const matchEnd = searchIndex + normalizedSearchText.length;
      
      // Find spans that contain the matched text
      const matchingSpans = spanMap.filter(({ start, end }) => 
        (searchIndex <= end && matchEnd >= start)
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
            x: minX - pageRect.left,
            y: minY - pageRect.top,
            width: maxX - minX,
            height: maxY - minY
          });
        }
      }
    }
    
    return positions;
  }

  /**
   * Show detailed tooltip on hover
   */
  private showDetailedTooltip(event: MouseEvent, highlight: SmartHighlight): void {
    const existingTooltip = document.getElementById('smart-highlight-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    const tooltip = document.createElement('div');
    tooltip.id = 'smart-highlight-tooltip';
    tooltip.className = 'fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-xl max-w-sm border border-gray-700';
    tooltip.style.cssText = `
      left: ${event.clientX + 10}px;
      top: ${event.clientY - 10}px;
      pointer-events: none;
    `;

    const typeColors = {
      concept: 'text-yellow-400',
      statistic: 'text-blue-400',
      definition: 'text-green-400',
      action: 'text-orange-400'
    };

    tooltip.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <div class="w-3 h-3 rounded-full ${highlight.type === 'concept' ? 'bg-yellow-400' : 
                                           highlight.type === 'statistic' ? 'bg-blue-400' :
                                           highlight.type === 'definition' ? 'bg-green-400' : 'bg-orange-400'}"></div>
        <span class="font-semibold ${typeColors[highlight.type]}">${highlight.type.charAt(0).toUpperCase() + highlight.type.slice(1)}</span>
        <span class="text-xs text-gray-400">${Math.round(highlight.confidence * 100)}% confidence</span>
      </div>
      <div class="text-sm text-gray-300 mb-2">${highlight.explanation}</div>
      <div class="text-xs text-gray-400 border-t border-gray-700 pt-2">
        "${highlight.text.substring(0, 150)}${highlight.text.length > 150 ? '...' : ''}"
      </div>
    `;

    document.body.appendChild(tooltip);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.remove();
      }
    }, 5000);
  }

  /**
   * Hide detailed tooltip
   */
  private hideDetailedTooltip(): void {
    const tooltip = document.getElementById('smart-highlight-tooltip');
    if (tooltip) {
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.remove();
        }
      }, 100); // Small delay to prevent flickering
    }
  }

  /**
   * Handle highlight click
   */
  private onHighlightClick(highlight: SmartHighlight): void {
    console.log('Smart highlight clicked:', highlight);
    
    // Dispatch custom event with detailed information
    const event = new CustomEvent('smartHighlightClick', {
      detail: {
        highlight,
        type: highlight.type,
        confidence: highlight.confidence,
        text: highlight.text
      },
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Remove all highlights from a page element
   */
  removeHighlights(pageElement: HTMLElement): void {
    const existingHighlights = pageElement.querySelectorAll('.smart-pdf-highlight');
    existingHighlights.forEach(el => el.remove());
    
    // Clean up stored references for this page
    const pageNumber = parseInt(pageElement.getAttribute('data-page-number') || '1');
    for (const [key, highlight] of this.highlights.entries()) {
      if (highlight.page === pageNumber) {
        this.highlights.delete(key);
      }
    }
  }

  /**
   * Remove all highlights
   */
  removeAllHighlights(): void {
    const allHighlights = document.querySelectorAll('.smart-pdf-highlight');
    allHighlights.forEach(el => el.remove());
    this.highlights.clear();
  }

  /**
   * Get all highlights for a specific page
   */
  getHighlightsForPage(pageNumber: number): SmartHighlight[] {
    return Array.from(this.highlights.values()).filter(h => h.page === pageNumber);
  }

  /**
   * Get highlight statistics
   */
  getHighlightStats(): {
    total: number;
    concepts: number;
    statistics: number;
    definitions: number;
    actions: number;
  } {
    const highlights = Array.from(this.highlights.values());
    return {
      total: highlights.length,
      concepts: highlights.filter(h => h.type === 'concept').length,
      statistics: highlights.filter(h => h.type === 'statistic').length,
      definitions: highlights.filter(h => h.type === 'definition').length,
      actions: highlights.filter(h => h.type === 'action').length
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.removeAllHighlights();
    if (this.styleSheet) {
      this.styleSheet.remove();
      this.styleSheet = null;
    }
  }
}

// Export singleton instance
export const highlightEngine = new HighlightEngine();