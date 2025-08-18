import { Highlight } from '@/components/PDFReader';

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

export class CustomPdfHighlighter {
  private highlights: Map<string, Highlight> = new Map();
  private styleSheet: HTMLStyleElement | null = null;

  constructor() {
    this.addHighlightStyles();
  }

  // Add CSS styles for highlights
  addHighlightStyles() {
    if (this.styleSheet) return; // Already added

    this.styleSheet = document.createElement('style');
    this.styleSheet.textContent = `
      .custom-pdf-highlight {
        position: absolute;
        pointer-events: none;
        mix-blend-mode: multiply;
        border-radius: 2px;
        transition: opacity 0.2s ease-in-out;
        z-index: 10;
      }
      
      .custom-pdf-highlight.primary {
        background-color: rgba(254, 240, 138, 0.4);
        border: 1px solid rgba(251, 191, 36, 0.6);
      }
      
      .custom-pdf-highlight.secondary {
        background-color: rgba(134, 239, 172, 0.4);
        border: 1px solid rgba(34, 197, 94, 0.6);
      }
      
      .custom-pdf-highlight.tertiary {
        background-color: rgba(147, 197, 253, 0.4);
        border: 1px solid rgba(59, 130, 246, 0.6);
      }
      
      .custom-pdf-highlight.quaternary {
        background-color: rgba(251, 146, 60, 0.4);
        border: 1px solid rgba(249, 115, 22, 0.6);
      }
      
      .custom-pdf-highlight:hover {
        opacity: 0.8;
        pointer-events: auto;
        cursor: pointer;
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
    `;
    document.head.appendChild(this.styleSheet);
  }

  // Find text positions in PDF page
  findTextPositions(text: string, pageElement: HTMLElement): TextPosition[] {
    const positions: TextPosition[] = [];
    
    if (!text || text.length < 3) return positions;

    // Look for text layer in PDF.js rendered page
    const textLayer = pageElement.querySelector('.react-pdf__Page__textContent') as HTMLElement;
    if (!textLayer) return positions;

    const normalizedSearchText = text.toLowerCase().trim();
    const searchWords = normalizedSearchText.split(/\s+/).filter(word => word.length > 1);
    
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
    
    // Try exact match first
    let searchIndex = fullTextLower.indexOf(normalizedSearchText);
    
    // If no exact match, try partial matches with the first few words
    if (searchIndex === -1 && searchWords.length > 0) {
      for (let i = Math.min(searchWords.length, 3); i >= 1; i--) {
        const partialSearch = searchWords.slice(0, i).join(' ');
        searchIndex = fullTextLower.indexOf(partialSearch);
        if (searchIndex !== -1) break;
      }
    }
    
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
    }
    
    return positions;
  }

  // Get page number from page element
  private getPageNumber(pageElement: HTMLElement): number {
    // Try to extract page number from data attributes or class names
    const pageAttr = pageElement.getAttribute('data-page-number');
    if (pageAttr) return parseInt(pageAttr, 10);
    
    // Fallback: look for page number in parent elements
    let element = pageElement;
    while (element) {
      const pageMatch = element.className.match(/page-(\d+)/);
      if (pageMatch) return parseInt(pageMatch[1], 10);
      element = element.parentElement as HTMLElement;
    }
    
    return 1; // Default fallback
  }

  // Apply highlights to a specific page
  applyHighlights(highlights: Highlight[], pageNumber: number, pageElement?: HTMLElement) {
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
    
    pageHighlights.forEach(highlight => {
      this.createHighlightOverlay(highlight, pageElement!);
    });
  }

  // Create highlight overlay element
  private createHighlightOverlay(highlight: Highlight, pageElement: HTMLElement) {
    const positions = this.findTextPositions(highlight.text, pageElement);
    
    positions.forEach((position, index) => {
      const highlightElement = document.createElement('div');
      highlightElement.className = `custom-pdf-highlight ${highlight.color}`;
      highlightElement.id = `highlight-${highlight.id}-${index}`;
      highlightElement.title = `${highlight.explanation} (${Math.round(highlight.relevanceScore * 100)}% relevant)`;
      
      // Position the highlight
      highlightElement.style.cssText = `
        left: ${position.boundingBox.x}px;
        top: ${position.boundingBox.y}px;
        width: ${position.boundingBox.width}px;
        height: ${position.boundingBox.height}px;
      `;
      
      // Add click handler
      highlightElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onHighlightClick(highlight);
      });
      
      // Add to page element
      pageElement.style.position = 'relative';
      pageElement.appendChild(highlightElement);
      
      // Store reference
      this.highlights.set(`${highlight.id}-${index}`, highlight);
    });
  }

  // Handle highlight click
  private onHighlightClick(highlight: Highlight) {
    console.log('Highlight clicked:', highlight);
    
    // Dispatch custom event
    const event = new CustomEvent('highlightClick', {
      detail: highlight,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  // Remove highlights for a specific page
  removeHighlights(pageNumber: number) {
    const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`) as HTMLElement;
    if (!pageElement) return;
    
    const existingHighlights = pageElement.querySelectorAll('.custom-pdf-highlight');
    existingHighlights.forEach(el => el.remove());
    
    // Clean up stored references
    for (const [key, highlight] of this.highlights.entries()) {
      if (highlight.page === pageNumber) {
        this.highlights.delete(key);
      }
    }
  }

  // Remove all highlights
  removeAllHighlights() {
    const allHighlights = document.querySelectorAll('.custom-pdf-highlight');
    allHighlights.forEach(el => el.remove());
    this.highlights.clear();
  }

  // Enable text selection on PDF pages
  enableTextSelection() {
    const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
    textLayers.forEach(layer => {
      layer.classList.add('pdf-text-layer');
    });
  }

  // Get current text selection
  getTextSelection(): { text: string; pageNumber: number } | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const selectedText = selection.toString().trim();
    if (!selectedText) return null;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Find the page element containing the selection
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

  // Create highlight from current selection
  createHighlightFromSelection(color: 'primary' | 'secondary' | 'tertiary' | 'quaternary' = 'primary'): Highlight | null {
    const selection = this.getTextSelection();
    if (!selection || selection.text.length < 5) return null;
    
    const highlight: Highlight = {
      id: `custom-highlight-${Date.now()}`,
      text: selection.text,
      page: selection.pageNumber,
      color,
      relevanceScore: 0.9,
      explanation: 'User-created highlight'
    };
    
    return highlight;
  }

  // Cleanup
  destroy() {
    this.removeAllHighlights();
    if (this.styleSheet) {
      this.styleSheet.remove();
      this.styleSheet = null;
    }
  }
}

// Export singleton instance
export const customPdfHighlighter = new CustomPdfHighlighter();