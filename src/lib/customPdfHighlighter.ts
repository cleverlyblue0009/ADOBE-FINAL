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
    // Add global test functions for debugging
    setTimeout(() => this.addGlobalTestFunction(), 1000);
  }

  // Add CSS styles for highlights
  addHighlightStyles() {
    if (this.styleSheet) return; // Already added

    this.styleSheet = document.createElement('style');
    this.styleSheet.textContent = `
      .custom-pdf-highlight {
        position: absolute;
        pointer-events: none;
        border-radius: 1px;
        transition: opacity 0.2s ease-in-out;
        z-index: 10;
        box-sizing: border-box;
      }
      
      .custom-pdf-highlight.primary {
        background-color: rgba(255, 255, 0, 0.6);
        border: 1px solid rgba(255, 255, 0, 0.8);
        box-shadow: 0 0 3px rgba(255, 255, 0, 0.4);
      }
      
      .custom-pdf-highlight.secondary {
        background-color: rgba(0, 255, 0, 0.5);
        border: 1px solid rgba(0, 255, 0, 0.8);
        box-shadow: 0 0 3px rgba(0, 255, 0, 0.4);
      }
      
      .custom-pdf-highlight.tertiary {
        background-color: rgba(0, 150, 255, 0.5);
        border: 1px solid rgba(0, 150, 255, 0.8);
        box-shadow: 0 0 3px rgba(0, 150, 255, 0.4);
      }
      
      .custom-pdf-highlight.quaternary {
        background-color: rgba(255, 165, 0, 0.6);
        border: 1px solid rgba(255, 165, 0, 0.8);
        box-shadow: 0 0 3px rgba(255, 165, 0, 0.4);
      }
      
      /* Standard highlight colors like real PDF highlighters */
      .custom-pdf-highlight.yellow {
        background-color: rgba(255, 255, 0, 0.6);
        border: 1px solid rgba(255, 255, 0, 0.8);
        box-shadow: 0 0 3px rgba(255, 255, 0, 0.4);
      }
      
      .custom-pdf-highlight.green {
        background-color: rgba(0, 255, 0, 0.5);
        border: 1px solid rgba(0, 255, 0, 0.8);
        box-shadow: 0 0 3px rgba(0, 255, 0, 0.4);
      }
      
      .custom-pdf-highlight.blue {
        background-color: rgba(0, 150, 255, 0.5);
        border: 1px solid rgba(0, 150, 255, 0.8);
        box-shadow: 0 0 3px rgba(0, 150, 255, 0.4);
      }
      
      .custom-pdf-highlight.pink {
        background-color: rgba(255, 20, 147, 0.5);
        border: 1px solid rgba(255, 20, 147, 0.8);
        box-shadow: 0 0 3px rgba(255, 20, 147, 0.4);
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
    
    if (!text || text.length < 3) {
      console.log('Text too short for highlighting:', text);
      return positions;
    }

    console.log(`🔍 Finding positions for text: "${text.substring(0, 50)}..."`);

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
    
    console.log(`📄 Text layer found:`, !!textLayer, textLayer?.className);
    
    // If still no text layer, create fallback positioning based on page dimensions
    if (!textLayer) {
      console.warn('❌ No text layer found, creating fallback highlight position');
      return this.createFallbackPosition(text, pageElement);
    }

    const normalizedSearchText = this.normalizeText(text);
    const searchWords = normalizedSearchText.split(/\s+/).filter(word => word.length > 1);
    
    // Get all text spans in the text layer
    const textSpans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
    
    console.log(`📝 Found ${textSpans.length} text spans in layer`);
    
    if (textSpans.length === 0) {
      console.warn('❌ No text spans found, creating fallback highlight position');
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
    
    const fullTextNormalized = this.normalizeText(fullText);
    
    console.log(`📖 Full page text (first 200 chars): "${fullTextNormalized.substring(0, 200)}..."`);
    console.log(`🎯 Searching for: "${normalizedSearchText}"`);
    
    // Try multiple matching strategies
    let searchIndex = -1;
    let matchLength = normalizedSearchText.length;
    
    // Strategy 1: Exact match
    searchIndex = fullTextNormalized.indexOf(normalizedSearchText);
    if (searchIndex !== -1) {
      console.log(`✅ Exact match found at index ${searchIndex}`);
    }
    
    // Strategy 2: Partial matches with the first few words
    if (searchIndex === -1 && searchWords.length > 1) {
      for (let i = Math.min(searchWords.length, 4); i >= 2; i--) {
        const partialSearch = searchWords.slice(0, i).join(' ');
        searchIndex = fullTextNormalized.indexOf(partialSearch);
        if (searchIndex !== -1) {
          matchLength = partialSearch.length;
          console.log(`✅ Partial match found (${i} words) at index ${searchIndex}: "${partialSearch}"`);
          break;
        }
      }
    }
    
    // Strategy 3: Try fuzzy matching for similar text
    if (searchIndex === -1) {
      searchIndex = this.findFuzzyMatch(normalizedSearchText, fullTextNormalized);
      if (searchIndex !== -1) {
        console.log(`✅ Fuzzy match found at index ${searchIndex}`);
      }
    }
    
    // Strategy 4: Individual significant words
    if (searchIndex === -1 && searchWords.length > 0) {
      for (const word of searchWords) {
        if (word.length > 4) { // Only longer words
          searchIndex = fullTextNormalized.indexOf(word);
          if (searchIndex !== -1) {
            matchLength = word.length;
            console.log(`✅ Single word match found: "${word}" at index ${searchIndex}`);
            break;
          }
        }
      }
    }
    
    if (searchIndex !== -1) {
      const matchEnd = searchIndex + matchLength;
      
      // Find spans that contain the matched text
      const matchingSpans = spanMap.filter(({ start, end }) => 
        (searchIndex <= end && matchEnd >= start)
      );
      
      console.log(`📍 Found ${matchingSpans.length} matching spans for highlight`);
      
      if (matchingSpans.length > 0) {
        // Calculate bounding box for all matching spans
        const rects = matchingSpans.map(({ span }) => span.getBoundingClientRect());
        const pageRect = pageElement.getBoundingClientRect();
        
        if (rects.length > 0) {
          const minX = Math.min(...rects.map(r => r.left));
          const minY = Math.min(...rects.map(r => r.top));
          const maxX = Math.max(...rects.map(r => r.right));
          const maxY = Math.max(...rects.map(r => r.bottom));
          
          const position = {
            pageNumber: this.getPageNumber(pageElement),
            textContent: text,
            boundingBox: {
              x: minX - pageRect.left,
              y: minY - pageRect.top,
              width: maxX - minX,
              height: maxY - minY
            }
          };
          
          console.log(`✨ Created highlight position:`, position.boundingBox);
          positions.push(position);
        }
      }
    }
    
    // If no positions found, create visible fallback
    if (positions.length === 0) {
      console.warn(`❌ No text match found, creating fallback position for: "${text.substring(0, 30)}..."`);
      return this.createFallbackPosition(text, pageElement);
    }
    
    return positions;
  }

  // Normalize text for better matching
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Clean up multiple spaces again
      .trim();
  }

  // Simple fuzzy matching for similar text
  private findFuzzyMatch(searchText: string, fullText: string): number {
    const searchWords = searchText.split(/\s+/).filter(word => word.length > 3);
    if (searchWords.length === 0) return -1;
    
    // Look for sequences where at least 60% of words match
    const threshold = Math.max(1, Math.floor(searchWords.length * 0.6));
    const fullWords = fullText.split(/\s+/);
    
    for (let i = 0; i <= fullWords.length - searchWords.length; i++) {
      const segment = fullWords.slice(i, i + searchWords.length);
      const matches = searchWords.filter(word => 
        segment.some(segWord => segWord.includes(word) || word.includes(segWord))
      );
      
      if (matches.length >= threshold) {
        // Find the start position of this segment in the full text
        const segmentText = segment.join(' ');
        const startIndex = fullText.indexOf(segmentText);
        if (startIndex !== -1) {
          console.log(`🔍 Fuzzy match found with ${matches.length}/${searchWords.length} words matching`);
          return startIndex;
        }
      }
    }
    
    return -1;
  }

  // Create fallback position when text cannot be found
  private createFallbackPosition(text: string, pageElement: HTMLElement): TextPosition[] {
    const pageRect = pageElement.getBoundingClientRect();
    const pageNumber = this.getPageNumber(pageElement);
    
    console.log(`🎯 Creating fallback positions for: "${text.substring(0, 30)}..." on page ${pageNumber}`);
    console.log(`📏 Page dimensions:`, { width: pageRect.width, height: pageRect.height });
    
    // Create multiple highlight positions distributed across the page
    const positions: TextPosition[] = [];
    const numHighlights = Math.min(5, Math.max(1, Math.floor(text.length / 40)));
    
    // Create more visible fallback highlights spread across the page
    for (let i = 0; i < numHighlights; i++) {
      const yOffset = (pageRect.height * 0.15) + (i * pageRect.height * 0.15);
      const xOffset = pageRect.width * (0.05 + (i % 2) * 0.1); // Alternate left/right
      
      const position = {
        pageNumber,
        textContent: text,
        boundingBox: {
          x: xOffset,
          y: yOffset,
          width: pageRect.width * 0.7,
          height: 24
        }
      };
      
      console.log(`📍 Fallback position ${i + 1}:`, position.boundingBox);
      positions.push(position);
    }
    
    // Add a debug notification for fallback highlights
    this.showFallbackNotification(text, positions.length);
    
    return positions;
  }

  // Show notification for fallback highlights
  private showFallbackNotification(text: string, count: number) {
    const notification = document.createElement('div');
    notification.className = 'fallback-highlight-notification';
    notification.innerHTML = `
      <div style="font-weight: bold; color: #ff6b35;">⚠️ Fallback Highlight</div>
      <div style="font-size: 12px;">Text not found in PDF, showing approximate position</div>
      <div style="font-size: 11px; opacity: 0.8;">"${text.substring(0, 40)}..."</div>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 107, 53, 0.95);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 10001;
      max-width: 300px;
      border: 2px solid #ff6b35;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      notification.style.transition = 'all 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
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
    console.log(`🎯 Applying highlights to page ${pageNumber}:`, {
      totalHighlights: highlights.length,
      pageHighlights: highlights.filter(h => h.page === pageNumber).length
    });
    
    // Remove existing highlights for this page
    this.removeHighlights(pageNumber);
    
    if (!pageElement) {
      pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`) as HTMLElement;
    }
    
    if (!pageElement) {
      console.warn(`❌ Page element not found for page ${pageNumber}`);
      return;
    }

    const pageHighlights = highlights.filter(h => h.page === pageNumber);
    
    if (pageHighlights.length === 0) {
      console.log(`ℹ️ No highlights found for page ${pageNumber}`);
      return;
    }
    
    console.log(`📝 Highlights for page ${pageNumber}:`, pageHighlights.map(h => ({
      id: h.id,
      text: h.text.substring(0, 40) + '...',
      color: h.color,
      relevance: Math.round(h.relevanceScore * 100) + '%'
    })));
    
    // Create debug panel
    this.createDebugPanel(pageHighlights, pageNumber);
    
    pageHighlights.forEach((highlight, index) => {
      console.log(`🎨 Processing highlight ${index + 1}/${pageHighlights.length}:`, highlight.text.substring(0, 30));
      this.createHighlightOverlay(highlight, pageElement!);
    });
    
    console.log(`✅ Finished applying ${pageHighlights.length} highlights to page ${pageNumber}`);
  }

  // Create debug panel to show applied highlights
  private createDebugPanel(highlights: Highlight[], pageNumber: number) {
    // Remove existing debug panel
    const existingPanel = document.getElementById('highlight-debug-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    const debugPanel = document.createElement('div');
    debugPanel.id = 'highlight-debug-panel';
    debugPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #4CAF50;">
        🎯 Page ${pageNumber} Highlights (${highlights.length})
      </div>
      ${highlights.map((h, i) => `
        <div style="margin-bottom: 6px; padding: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; border-left: 3px solid ${this.getColorHex(h.color)};">
          <div style="font-size: 11px; font-weight: bold; color: ${this.getColorHex(h.color)};">${h.color.toUpperCase()} - ${Math.round(h.relevanceScore * 100)}%</div>
          <div style="font-size: 10px; opacity: 0.9;">"${h.text.substring(0, 60)}${h.text.length > 60 ? '...' : ''}"</div>
        </div>
      `).join('')}
      <div style="text-align: center; margin-top: 8px;">
        <button onclick="this.parentElement.parentElement.remove()" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;">Close</button>
      </div>
    `;
    
    debugPanel.style.cssText = `
      position: fixed;
      top: 80px;
      left: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 10002;
      max-width: 350px;
      max-height: 400px;
      overflow-y: auto;
      border: 2px solid #4CAF50;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    `;
    
    document.body.appendChild(debugPanel);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (debugPanel.parentElement) {
        debugPanel.style.opacity = '0';
        debugPanel.style.transform = 'translateX(-100%)';
        debugPanel.style.transition = 'all 0.3s ease-out';
        setTimeout(() => debugPanel.remove(), 300);
      }
    }, 10000);
  }

  // Get hex color for debug panel
  private getColorHex(color: string): string {
    const colorMap = {
      'primary': '#FFFF00',
      'secondary': '#00FF00', 
      'tertiary': '#0096FF',
      'quaternary': '#FFA500',
      'yellow': '#FFFF00',
      'green': '#00FF00',
      'blue': '#0096FF',
      'pink': '#FF1493',
      'gold': '#FFD700'
    };
    return colorMap[color as keyof typeof colorMap] || '#FFFF00';
  }

  // Create highlight overlay element
  private createHighlightOverlay(highlight: Highlight, pageElement: HTMLElement) {
    console.log(`🎨 Creating highlight overlay for: "${highlight.text.substring(0, 50)}..."`);
    
    const positions = this.findTextPositions(highlight.text, pageElement);
    
    if (positions.length === 0) {
      console.warn(`❌ No positions found for highlight: ${highlight.text.substring(0, 50)}...`);
      return;
    }
    
    console.log(`✨ Creating ${positions.length} highlight overlays`);
    
    positions.forEach((position, index) => {
      const highlightElement = document.createElement('div');
      highlightElement.className = `custom-pdf-highlight ${highlight.color}`;
      highlightElement.id = `highlight-${highlight.id}-${index}`;
      highlightElement.title = `${highlight.explanation} (${Math.round(highlight.relevanceScore * 100)}% relevant)`;
      
      // Use actual text dimensions with padding for better visibility
      const width = Math.max(position.boundingBox.width, 30);
      const height = Math.max(position.boundingBox.height, 16);
      
      // Position the highlight with padding for better visual alignment
      const padding = 3;
      const finalX = Math.max(0, position.boundingBox.x - padding);
      const finalY = Math.max(0, position.boundingBox.y - padding/2);
      const finalWidth = width + padding * 2;
      const finalHeight = height + padding;
      
      highlightElement.style.cssText = `
        position: absolute;
        left: ${finalX}px;
        top: ${finalY}px;
        width: ${finalWidth}px;
        height: ${finalHeight}px;
        z-index: 1000;
        pointer-events: auto;
      `;
      
      // Add debug info as data attributes
      highlightElement.setAttribute('data-highlight-text', highlight.text.substring(0, 50));
      highlightElement.setAttribute('data-highlight-id', highlight.id);
      highlightElement.setAttribute('data-page', position.pageNumber.toString());
      
      // Add click handler
      highlightElement.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🖱️ Highlight clicked:', highlight.text.substring(0, 30));
        this.onHighlightClick(highlight);
      });
      
      // Add hover handler for debugging
      highlightElement.addEventListener('mouseenter', () => {
        console.log(`🎯 Hovering over highlight: "${highlight.text.substring(0, 30)}..."`);
      });
      
      // Ensure page element is positioned relatively
      if (pageElement.style.position !== 'relative' && pageElement.style.position !== 'absolute') {
        pageElement.style.position = 'relative';
      }
      
      // Add to page element
      pageElement.appendChild(highlightElement);
      
      // Store reference
      this.highlights.set(`${highlight.id}-${index}`, highlight);
      
      // Animated fade-in effect
      highlightElement.style.opacity = '0';
      highlightElement.style.transform = 'scale(0.8)';
      highlightElement.style.transition = 'all 0.3s ease-out';
      
      setTimeout(() => {
        highlightElement.style.opacity = '1';
        highlightElement.style.transform = 'scale(1)';
      }, index * 100);
      
      console.log(`✅ Created highlight overlay ${index + 1}/${positions.length}:`, {
        id: highlight.id,
        position: { x: finalX, y: finalY, width: finalWidth, height: finalHeight },
        color: highlight.color,
        text: highlight.text.substring(0, 30) + '...'
      });
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

  // Test highlights with sample data
  testHighlights(pageElement: HTMLElement, pageNumber: number = 1) {
    console.log('🧪 Testing highlights with sample data');
    
    const testHighlights: Highlight[] = [
      {
        id: 'test-1',
        text: 'Bouillabaisse',
        page: pageNumber,
        color: 'yellow',
        relevanceScore: 0.9,
        explanation: 'Test highlight for a famous French dish'
      },
      {
        id: 'test-2', 
        text: 'traditional fish stew',
        page: pageNumber,
        color: 'green',
        relevanceScore: 0.8,
        explanation: 'Test highlight for dish description'
      },
      {
        id: 'test-3',
        text: 'South of France',
        page: pageNumber,
        color: 'blue',
        relevanceScore: 0.85,
        explanation: 'Test highlight for location'
      },
      {
        id: 'test-4',
        text: 'Marseille',
        page: pageNumber,
        color: 'pink',
        relevanceScore: 0.75,
        explanation: 'Test highlight for specific city'
      }
    ];
    
    console.log('🎯 Applying test highlights:', testHighlights);
    this.applyHighlights(testHighlights, pageNumber, pageElement);
    
    return testHighlights;
  }

  // Add global test function for debugging
  addGlobalTestFunction() {
    (window as any).testHighlights = () => {
      console.log('🧪 Running global highlight test');
      const pageElement = document.querySelector('[data-page-number]') as HTMLElement;
      if (pageElement) {
        const pageNumber = parseInt(pageElement.getAttribute('data-page-number') || '1');
        return this.testHighlights(pageElement, pageNumber);
      } else {
        console.warn('❌ No page element found for testing');
        return null;
      }
    };
    
    (window as any).debugHighlighter = this;
    console.log('✅ Added global test functions: testHighlights() and debugHighlighter');
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