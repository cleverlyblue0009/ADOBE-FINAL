import { Highlight } from '@/components/PDFReader';

interface HighlightPosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PDFHighlighter {
  private highlightOverlayContainer: HTMLElement | null = null;
  private currentHighlights: Map<string, HTMLElement[]> = new Map();
  
  constructor() {
    this.initializeOverlayContainer();
  }

  private initializeOverlayContainer(): void {
    // Check if overlay container already exists
    this.highlightOverlayContainer = document.getElementById('pdf-highlight-overlay-container');
    
    if (!this.highlightOverlayContainer) {
      this.highlightOverlayContainer = document.createElement('div');
      this.highlightOverlayContainer.id = 'pdf-highlight-overlay-container';
      this.highlightOverlayContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 10;
      `;
    }
  }

  /**
   * Find all occurrences of text in the PDF content
   */
  public findTextInPDF(searchText: string, container: HTMLElement): HighlightPosition[] {
    const positions: HighlightPosition[] = [];
    
    if (!searchText || searchText.length < 3) return positions;
    
    console.log(`Searching for text: "${searchText}" in container:`, container);
    
    // Try multiple search strategies
    
    // Strategy 1: Direct text content search
    const directPositions = this.findTextDirect(searchText, container);
    if (directPositions.length > 0) {
      positions.push(...directPositions);
    }
    
    // Strategy 2: Normalized text search
    if (positions.length === 0) {
      const normalizedPositions = this.findTextNormalized(searchText, container);
      positions.push(...normalizedPositions);
    }
    
    // Strategy 3: Partial text search (for long texts)
    if (positions.length === 0 && searchText.length > 50) {
      const words = searchText.split(/\s+/);
      if (words.length > 3) {
        // Try searching for the first few words
        const partialText = words.slice(0, 3).join(' ');
        const partialPositions = this.findTextDirect(partialText, container);
        positions.push(...partialPositions);
      }
    }
    
    console.log(`Found ${positions.length} positions for text search`);
    return positions;
  }

  /**
   * Direct text search without normalization
   */
  private findTextDirect(searchText: string, container: HTMLElement): HighlightPosition[] {
    const positions: HighlightPosition[] = [];
    const textNodes = this.getTextNodes(container);
    
    textNodes.forEach((node, nodeIndex) => {
      const nodeText = node.textContent || '';
      let startIndex = 0;
      
      while (true) {
        const index = nodeText.indexOf(searchText, startIndex);
        if (index === -1) break;
        
        const position = this.getPositionFromTextNode(node, index, searchText.length, container);
        if (position) {
          positions.push(position);
        }
        
        startIndex = index + 1;
      }
    });
    
    return positions;
  }

  /**
   * Normalized text search
   */
  private findTextNormalized(searchText: string, container: HTMLElement): HighlightPosition[] {
    const positions: HighlightPosition[] = [];
    
    // Normalize search text
    const normalizedSearch = this.normalizeText(searchText);
    
    // Get all text nodes in the container
    const textNodes = this.getTextNodes(container);
    
    // Build full text content
    const fullText = textNodes.map(node => node.textContent || '').join(' ');
    const normalizedFullText = this.normalizeText(fullText);
    
    // Find matches
    const matches = this.findMatches(normalizedSearch, normalizedFullText);
    
    // Convert matches to positions
    matches.forEach(match => {
      const position = this.getPositionFromMatch(match, textNodes, container);
      if (position) {
        positions.push(position);
      }
    });
    
    return positions;
  }

  /**
   * Apply highlights to the PDF viewer
   */
  public applyHighlights(highlights: Highlight[], currentPage: number): void {
    // Clear existing highlights
    this.clearHighlights();
    
    // Get the PDF container
    const pdfContainer = this.getPDFContainer();
    if (!pdfContainer) {
      console.warn('PDF container not found');
      return;
    }
    
    // Ensure overlay container is attached
    this.attachOverlayContainer(pdfContainer);
    
    // Filter highlights for current page
    const pageHighlights = highlights.filter(h => h.page === currentPage);
    
    // Apply each highlight
    pageHighlights.forEach(highlight => {
      this.applyHighlight(highlight, pdfContainer);
    });
  }

  /**
   * Apply a single highlight to the PDF
   */
  private applyHighlight(highlight: Highlight, container: HTMLElement): void {
    try {
      // Find text positions
      const positions = this.findTextInPDF(highlight.text, container);
      
      if (positions.length === 0) {
        // Try partial match if exact match fails
        const partialText = highlight.text.substring(0, Math.min(50, highlight.text.length));
        const partialPositions = this.findTextInPDF(partialText, container);
        if (partialPositions.length > 0) {
          positions.push(...partialPositions);
        }
      }
      
      // Create highlight elements
      const highlightElements: HTMLElement[] = [];
      
      positions.forEach((position, index) => {
        const highlightElement = this.createHighlightElement(highlight, position, index);
        if (this.highlightOverlayContainer) {
          this.highlightOverlayContainer.appendChild(highlightElement);
          highlightElements.push(highlightElement);
        }
      });
      
      // Store highlight elements for later removal
      if (highlightElements.length > 0) {
        this.currentHighlights.set(highlight.id, highlightElements);
      }
      
    } catch (error) {
      console.error('Failed to apply highlight:', error);
    }
  }

  /**
   * Create a highlight element
   */
  private createHighlightElement(highlight: Highlight, position: HighlightPosition, index: number): HTMLElement {
    const element = document.createElement('div');
    element.className = `pdf-highlight pdf-highlight-${highlight.color}`;
    element.id = `highlight-${highlight.id}-${index}`;
    
    // Set color based on highlight type
    const colorMap = {
      'primary': 'rgba(254, 240, 138, 0.6)',
      'secondary': 'rgba(134, 239, 172, 0.6)',
      'tertiary': 'rgba(147, 197, 253, 0.6)'
    };
    
    element.style.cssText = `
      position: absolute;
      left: ${position.x}px;
      top: ${position.y}px;
      width: ${position.width}px;
      height: ${position.height}px;
      background-color: ${colorMap[highlight.color] || colorMap.primary};
      mix-blend-mode: multiply;
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 2px;
      border: 1px solid ${highlight.color === 'primary' ? '#F59E0B' : 
                          highlight.color === 'secondary' ? '#10B981' : '#3B82F6'};
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    `;
    
    // Add hover effect
    element.addEventListener('mouseenter', () => {
      element.style.backgroundColor = highlight.color === 'primary' ? 'rgba(254, 240, 138, 0.6)' :
                                      highlight.color === 'secondary' ? 'rgba(134, 239, 172, 0.6)' :
                                      'rgba(147, 197, 253, 0.6)';
      element.style.transform = 'scale(1.02)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.backgroundColor = colorMap[highlight.color] || colorMap.primary;
      element.style.transform = 'scale(1)';
    });
    
    // Add click handler
    element.addEventListener('click', () => {
      this.showHighlightTooltip(highlight, element);
    });
    
    // Add tooltip
    element.title = `${highlight.explanation}\n${highlight.text.substring(0, 100)}${highlight.text.length > 100 ? '...' : ''}`;
    
    return element;
  }

  /**
   * Show tooltip for highlight
   */
  private showHighlightTooltip(highlight: Highlight, element: HTMLElement): void {
    // Remove existing tooltip
    const existingTooltip = document.getElementById('highlight-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    // Create new tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'highlight-tooltip';
    tooltip.className = 'highlight-tooltip';
    
    const rect = element.getBoundingClientRect();
    
    tooltip.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 10}px;
      left: ${rect.left}px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px;
      border-radius: 8px;
      max-width: 300px;
      z-index: 1000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.3s ease;
    `;
    
    tooltip.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600;">
        Page ${highlight.page} • ${Math.round(highlight.relevanceScore * 100)}% Relevant
      </div>
      <div style="margin-bottom: 8px; opacity: 0.9;">
        ${highlight.explanation}
      </div>
      <div style="font-size: 12px; opacity: 0.7; font-style: italic;">
        "${highlight.text.substring(0, 150)}${highlight.text.length > 150 ? '...' : ''}"
      </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Remove tooltip after 5 seconds or on click outside
    const removeTooltip = () => {
      tooltip.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => tooltip.remove(), 300);
    };
    
    setTimeout(removeTooltip, 5000);
    
    const handleClickOutside = (e: MouseEvent) => {
      if (!tooltip.contains(e.target as Node) && e.target !== element) {
        removeTooltip();
        document.removeEventListener('click', handleClickOutside);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
  }

  /**
   * Clear all highlights
   */
  public clearHighlights(): void {
    this.currentHighlights.forEach(elements => {
      elements.forEach(element => element.remove());
    });
    this.currentHighlights.clear();
  }

  /**
   * Get PDF container element
   */
  private getPDFContainer(): HTMLElement | null {
    // Try multiple selectors to find the PDF container
    const selectors = [
      '#adobe-dc-view',
      '.adobe-dc-view',
      '#adobe-pdf-viewer',
      '.pdf-viewer-container',
      '#pdf-content',
      'iframe',
      '[data-pdf-viewer]',
      '.pdf-viewer',
      '.adobe-pdf-embed',
      '#pdf-viewer-container'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`Found PDF container using selector: ${selector}`);
        return element as HTMLElement;
      }
    }
    
    // If no specific container found, try to find any element that looks like it contains PDF content
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      if (div.innerHTML.includes('pdf') || div.className.includes('pdf') || 
          div.id.includes('pdf') || div.innerHTML.includes('Adobe')) {
        console.log('Found PDF container by content search:', div);
        return div as HTMLElement;
      }
    }
    
    console.warn('No PDF container found');
    return null;
  }

  /**
   * Attach overlay container to PDF container
   */
  private attachOverlayContainer(pdfContainer: HTMLElement): void {
    if (!this.highlightOverlayContainer) return;
    
    // Check if it's an iframe
    if (pdfContainer.tagName === 'IFRAME') {
      const parent = pdfContainer.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        if (!parent.contains(this.highlightOverlayContainer)) {
          parent.appendChild(this.highlightOverlayContainer);
        }
      }
    } else {
      pdfContainer.style.position = 'relative';
      if (!pdfContainer.contains(this.highlightOverlayContainer)) {
        pdfContainer.appendChild(this.highlightOverlayContainer);
      }
    }
  }

  /**
   * Get all text nodes from container
   */
  private getTextNodes(container: HTMLElement): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent || '';
          return text.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    
    return textNodes;
  }

  /**
   * Get position from text node and offset
   */
  private getPositionFromTextNode(node: Text, startOffset: number, length: number, container: HTMLElement): HighlightPosition | null {
    try {
      const range = document.createRange();
      range.setStart(node, startOffset);
      range.setEnd(node, Math.min(startOffset + length, node.textContent?.length || 0));
      
      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      if (rect.width === 0 || rect.height === 0) {
        return null;
      }
      
      return {
        page: 1, // Default page, should be determined by context
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      };
    } catch (error) {
      console.error('Failed to get position from text node:', error);
      return null;
    }
  }

  /**
   * Normalize text for matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * Find matches in text
   */
  private findMatches(searchText: string, fullText: string): Array<{ start: number; end: number }> {
    const matches: Array<{ start: number; end: number }> = [];
    let startIndex = 0;
    
    while (startIndex < fullText.length) {
      const index = fullText.indexOf(searchText, startIndex);
      if (index === -1) break;
      
      matches.push({
        start: index,
        end: index + searchText.length
      });
      
      startIndex = index + 1;
    }
    
    return matches;
  }

  /**
   * Get position from text match
   */
  private getPositionFromMatch(
    match: { start: number; end: number },
    textNodes: Text[],
    container: HTMLElement
  ): HighlightPosition | null {
    let currentOffset = 0;
    
    for (const node of textNodes) {
      const nodeText = this.normalizeText(node.textContent || '');
      const nodeLength = nodeText.length;
      
      // Check if match is in this node
      if (match.start >= currentOffset && match.start < currentOffset + nodeLength) {
        try {
          const range = document.createRange();
          const startInNode = match.start - currentOffset;
          const endInNode = Math.min(nodeLength, match.end - currentOffset);
          
          // Handle text node boundaries
          const actualStartInNode = Math.min(startInNode, (node.textContent || '').length - 1);
          const actualEndInNode = Math.min(endInNode, (node.textContent || '').length);
          
          if (actualStartInNode >= 0 && actualEndInNode > actualStartInNode) {
            range.setStart(node, actualStartInNode);
            range.setEnd(node, actualEndInNode);
            
            const rect = range.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
              return {
                page: 1, // Will be set by caller
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top,
                width: rect.width,
                height: rect.height
              };
            }
          }
        } catch (error) {
          console.error('Error creating range:', error);
        }
      }
      
      currentOffset += nodeLength + 1; // Add 1 for space between nodes
    }
    
    return null;
  }

  /**
   * Add CSS styles for highlights
   */
  public addHighlightStyles(): void {
    if (document.getElementById('pdf-highlight-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'pdf-highlight-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }
      
      @keyframes highlightPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 0.9; }
      }
      
      @keyframes highlightAppear {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 0.6; transform: scale(1); }
      }
      
      .pdf-highlight {
        animation: highlightAppear 0.5s ease-out, highlightPulse 3s ease-in-out 0.5s;
      }
      
      .pdf-highlight:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transform: scale(1.02);
      }
      
      .pdf-highlight-primary {
        background: linear-gradient(135deg, rgba(254, 240, 138, 0.6), rgba(251, 191, 36, 0.4));
      }
      
      .pdf-highlight-secondary {
        background: linear-gradient(135deg, rgba(134, 239, 172, 0.6), rgba(34, 197, 94, 0.4));
      }
      
      .pdf-highlight-tertiary {
        background: linear-gradient(135deg, rgba(147, 197, 253, 0.6), rgba(59, 130, 246, 0.4));
      }
      
      .highlight-tooltip {
        animation: fadeIn 0.3s ease;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Export singleton instance
export const pdfHighlighter = new PDFHighlighter();