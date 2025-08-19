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
        border-radius: 2px;
        transition: opacity 0.2s ease-in-out;
        z-index: 10;
        mix-blend-mode: multiply;
      }
      
      .custom-pdf-highlight.primary {
        background-color: rgba(255, 235, 59, 0.35);
        border: 1px solid rgba(255, 235, 59, 0.6);
      }
      
      .custom-pdf-highlight.secondary {
        background-color: rgba(76, 175, 80, 0.35);
        border: 1px solid rgba(76, 175, 80, 0.6);
      }
      
      .custom-pdf-highlight.tertiary {
        background-color: rgba(33, 150, 243, 0.35);
        border: 1px solid rgba(33, 150, 243, 0.6);
      }
      
      .custom-pdf-highlight.quaternary {
        background-color: rgba(255, 152, 0, 0.35);
        border: 1px solid rgba(255, 152, 0, 0.6);
      }
      
      /* Standard highlight colors like real PDF highlighters */
      .custom-pdf-highlight.yellow {
        background-color: rgba(255, 235, 59, 0.4);
        border: 1px solid rgba(255, 235, 59, 0.7);
      }
      
      .custom-pdf-highlight.green {
        background-color: rgba(76, 175, 80, 0.4);
        border: 1px solid rgba(76, 175, 80, 0.7);
      }
      
      .custom-pdf-highlight.blue {
        background-color: rgba(33, 150, 243, 0.4);
        border: 1px solid rgba(33, 150, 243, 0.7);
      }
      
      .custom-pdf-highlight.pink {
        background-color: rgba(233, 30, 99, 0.4);
        border: 1px solid rgba(233, 30, 99, 0.7);
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
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(this.styleSheet);
  }

  // Find text positions in PDF page
  findTextPositions(text: string, pageElement: HTMLElement): TextPosition[] {
    const positions: TextPosition[] = [];
    
    if (!text || text.length < 3) return positions;

    // Look for text layer in PDF.js rendered page - try multiple selectors
    let textLayer = pageElement.querySelector('.react-pdf__Page__textContent') as HTMLElement;
    
    // If text layer not found, try alternative selectors
    if (!textLayer) {
      textLayer = pageElement.querySelector('.textLayer') as HTMLElement;
    }
    if (!textLayer) {
      textLayer = pageElement.querySelector('[class*="textContent"]') as HTMLElement;
    }
    if (!textLayer) {
      textLayer = pageElement.querySelector('[class*="textLayer"]') as HTMLElement;
    }
    
    // If still no text layer, create fallback positioning based on page dimensions
    if (!textLayer) {
      console.warn('No text layer found, creating fallback highlight position');
      return this.createFallbackPosition(text, pageElement);
    }

    const normalizedSearchText = text.toLowerCase().trim();
    const searchWords = normalizedSearchText.split(/\s+/).filter(word => word.length > 1);
    
    // Get all text spans in the text layer
    const textSpans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
    
    if (textSpans.length === 0) {
      console.warn('No text spans found, creating fallback highlight position');
      return this.createFallbackPosition(text, pageElement);
    }
    
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
    
    // If still no match, try individual words
    if (searchIndex === -1 && searchWords.length > 0) {
      for (const word of searchWords) {
        if (word.length > 3) {
          searchIndex = fullTextLower.indexOf(word);
          if (searchIndex !== -1) break;
        }
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
    
    // If no positions found, create fallback
    if (positions.length === 0) {
      return this.createFallbackPosition(text, pageElement);
    }
    
    return positions;
  }

  // Create fallback position when text cannot be found
  private createFallbackPosition(text: string, pageElement: HTMLElement): TextPosition[] {
    const pageRect = pageElement.getBoundingClientRect();
    const pageNumber = this.getPageNumber(pageElement);
    
    // Create multiple highlight positions distributed across the page
    const positions: TextPosition[] = [];
    const numHighlights = Math.min(3, Math.max(1, Math.floor(text.length / 50)));
    
    for (let i = 0; i < numHighlights; i++) {
      const yOffset = (pageRect.height * 0.2) + (i * pageRect.height * 0.2);
      positions.push({
        pageNumber,
        textContent: text,
        boundingBox: {
          x: pageRect.width * 0.1,
          y: yOffset,
          width: pageRect.width * 0.8,
          height: 20
        }
      });
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
    
    if (positions.length === 0) {
      console.warn(`No positions found for highlight: ${highlight.text.substring(0, 50)}...`);
      return;
    }
    
    positions.forEach((position, index) => {
      const highlightElement = document.createElement('div');
      highlightElement.className = `custom-pdf-highlight ${highlight.color}`;
      highlightElement.id = `highlight-${highlight.id}-${index}`;
      highlightElement.title = `${highlight.explanation} (${Math.round(highlight.relevanceScore * 100)}% relevant)`;
      
      // Ensure minimum dimensions for visibility
      const width = Math.max(position.boundingBox.width, 100);
      const height = Math.max(position.boundingBox.height, 16);
      
      // Position the highlight
      highlightElement.style.cssText = `
        left: ${position.boundingBox.x}px;
        top: ${position.boundingBox.y}px;
        width: ${width}px;
        height: ${height}px;
        z-index: 1000;
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
      
      // Simple fade-in effect
      highlightElement.style.opacity = '0';
      setTimeout(() => {
        highlightElement.style.opacity = '1';
      }, index * 50);
      
      console.log(`Created highlight overlay at position:`, position.boundingBox);
    });
    
    // Show notification
    this.showHighlightNotification(highlight, positions.length);
  }

  // Show notification when highlight is created
  private showHighlightNotification(highlight: Highlight, count: number) {
    const notification = document.createElement('div');
    notification.className = 'highlight-notification';
    notification.textContent = `✨ Highlight added: ${highlight.text.substring(0, 30)}...`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
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
  createHighlightFromSelection(color: 'primary' | 'secondary' | 'tertiary' | 'yellow' | 'green' | 'blue' | 'pink' = 'yellow'): Highlight | null {
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