import { Highlight } from '@/components/PDFReader';

export interface TextLayerHighlight {
  id: string;
  text: string;
  pageNumber: number;
  color: string;
  explanation?: string;
  relevanceScore?: number;
}

export class TextbookHighlighter {
  private highlights: Map<string, TextLayerHighlight> = new Map();
  private styleSheet: HTMLStyleElement | null = null;
  private observers: Map<number, MutationObserver> = new Map();

  constructor() {
    this.addHighlightStyles();
  }

  // Add CSS styles for textbook-style highlights
  private addHighlightStyles() {
    if (this.styleSheet) return;

    this.styleSheet = document.createElement('style');
    this.styleSheet.textContent = `
      .highlight {
        background-color: yellow;
        font-weight: inherit;
        padding: 0;
        margin: 0;
        border-radius: 2px;
        transition: background-color 0.2s ease;
      }
      
      .highlight.green {
        background-color: rgba(144, 238, 144, 0.7);
      }
      
      .highlight.blue {
        background-color: rgba(173, 216, 230, 0.7);
      }
      
      .highlight.pink {
        background-color: rgba(255, 182, 193, 0.7);
      }
      
      .highlight.orange {
        background-color: rgba(255, 165, 0, 0.6);
      }
      
      .highlight:hover {
        background-color: rgba(255, 255, 0, 0.8);
        cursor: pointer;
      }
      
      /* Ensure text layer is selectable */
      .react-pdf__Page__textContent {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
      }
      
      .react-pdf__Page__textContent span {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(this.styleSheet);
  }

  // Get text content from PDF.js page
  private async getPageTextContent(pageNumber: number): Promise<any> {
    try {
      // This will be called after PDF.js renders the page
      const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`);
      if (!pageElement) {
        console.warn(`Page element not found for page ${pageNumber}`);
        return null;
      }

      // Wait for text layer to be available
      await this.waitForTextLayer(pageElement as HTMLElement);
      
      return pageElement;
    } catch (error) {
      console.error('Error getting page text content:', error);
      return null;
    }
  }

  // Wait for text layer to be rendered
  private waitForTextLayer(pageElement: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const checkTextLayer = () => {
        const textLayer = pageElement.querySelector('.react-pdf__Page__textContent');
        if (textLayer && textLayer.children.length > 0) {
          resolve();
        } else {
          setTimeout(checkTextLayer, 50);
        }
      };
      checkTextLayer();
    });
  }

  // Find text spans in the text layer that match the highlight text
  private findTextSpansInLayer(textLayer: Element, searchText: string): Element[] {
    const spans: Element[] = [];
    const textSpans = Array.from(textLayer.querySelectorAll('span'));
    
    // Clean and normalize the search text
    const normalizedSearch = searchText.trim().toLowerCase().replace(/\s+/g, ' ');
    const searchWords = normalizedSearch.split(' ');
    
    // Try to find exact phrase first
    let currentText = '';
    let currentSpans: Element[] = [];
    
    for (const span of textSpans) {
      const spanText = span.textContent?.trim().toLowerCase() || '';
      
      if (spanText) {
        currentText += (currentText ? ' ' : '') + spanText;
        currentSpans.push(span);
        
        // Check if we have a match
        if (currentText.includes(normalizedSearch)) {
          spans.push(...currentSpans);
          break;
        }
        
        // Reset if we've gone too far
        if (currentText.length > normalizedSearch.length * 2) {
          currentText = spanText;
          currentSpans = [span];
        }
      }
    }
    
    // If exact phrase not found, try word-by-word matching
    if (spans.length === 0) {
      for (const word of searchWords) {
        const wordSpans = textSpans.filter(span => 
          span.textContent?.toLowerCase().includes(word)
        );
        spans.push(...wordSpans);
      }
    }
    
    return spans;
  }

  // Apply highlight to specific text spans
  private highlightTextSpans(spans: Element[], highlight: TextLayerHighlight): void {
    spans.forEach(span => {
      const text = span.textContent || '';
      const normalizedText = text.toLowerCase();
      const searchText = highlight.text.toLowerCase();
      
      // Check if this span contains part of our search text
      const words = searchText.split(' ');
      const shouldHighlight = words.some(word => normalizedText.includes(word));
      
      if (shouldHighlight && !span.querySelector('.highlight')) {
        // Wrap the text content in a highlight span
        const highlightSpan = document.createElement('span');
        highlightSpan.className = `highlight ${highlight.color}`;
        highlightSpan.setAttribute('data-highlight-id', highlight.id);
        highlightSpan.textContent = text;
        
        // Add click handler for flashcard generation
        highlightSpan.addEventListener('click', () => {
          this.onHighlightClick(highlight);
        });
        
        // Replace the original text with highlighted version
        span.innerHTML = '';
        span.appendChild(highlightSpan);
      }
    });
  }

  // Handle highlight click for flashcard generation
  private onHighlightClick(highlight: TextLayerHighlight): void {
    console.log('Highlight clicked:', highlight);
    // Dispatch custom event for flashcard generation
    window.dispatchEvent(new CustomEvent('highlightClicked', {
      detail: highlight
    }));
  }

  // Apply highlights to a specific page
  public async applyHighlightsToPage(pageNumber: number, highlights: TextLayerHighlight[]): Promise<void> {
    const pageElement = await this.getPageTextContent(pageNumber);
    if (!pageElement) return;

    const textLayer = pageElement.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) {
      console.warn(`Text layer not found for page ${pageNumber}`);
      return;
    }

    // Apply each highlight
    for (const highlight of highlights) {
      if (highlight.pageNumber === pageNumber) {
        const spans = this.findTextSpansInLayer(textLayer, highlight.text);
        if (spans.length > 0) {
          this.highlightTextSpans(spans, highlight);
          console.log(`Applied highlight "${highlight.text}" to ${spans.length} spans on page ${pageNumber}`);
        } else {
          console.warn(`No spans found for highlight "${highlight.text}" on page ${pageNumber}`);
        }
      }
    }
  }

  // Add a new highlight
  public addHighlight(highlight: TextLayerHighlight): void {
    this.highlights.set(highlight.id, highlight);
    
    // Apply to current page if it's visible
    this.applyHighlightsToPage(highlight.pageNumber, [highlight]);
  }

  // Remove a highlight
  public removeHighlight(highlightId: string): void {
    const highlight = this.highlights.get(highlightId);
    if (!highlight) return;

    this.highlights.delete(highlightId);
    
    // Remove from DOM
    const highlightElements = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    highlightElements.forEach(element => {
      const parent = element.parentElement;
      if (parent) {
        parent.textContent = element.textContent || '';
      }
    });
  }

  // Get all highlights
  public getHighlights(): TextLayerHighlight[] {
    return Array.from(this.highlights.values());
  }

  // Get highlights for a specific page
  public getHighlightsForPage(pageNumber: number): TextLayerHighlight[] {
    return Array.from(this.highlights.values()).filter(h => h.pageNumber === pageNumber);
  }

  // Clear all highlights
  public clearHighlights(): void {
    // Remove from DOM
    const highlightElements = document.querySelectorAll('.highlight');
    highlightElements.forEach(element => {
      const parent = element.parentElement;
      if (parent) {
        parent.textContent = element.textContent || '';
      }
    });

    this.highlights.clear();
  }

  // Convert from old highlight format
  public static fromLegacyHighlight(legacyHighlight: Highlight): TextLayerHighlight {
    return {
      id: legacyHighlight.id,
      text: legacyHighlight.text,
      pageNumber: legacyHighlight.page,
      color: legacyHighlight.color || 'yellow',
      explanation: legacyHighlight.explanation,
      relevanceScore: legacyHighlight.relevanceScore
    };
  }
}

// Create a global instance
export const textbookHighlighter = new TextbookHighlighter();