import { pdfjs } from 'react-pdf';

// Types for text content and positioning
export interface TextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
}

export interface TextContent {
  items: TextItem[];
  styles: Record<string, any>;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

export interface HighlightPosition {
  pageNumber: number;
  boundingRect: BoundingBox;
  rects: BoundingBox[];
  text: string;
}

export interface PhraseMatch {
  phrase: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  category: "primary" | "secondary" | "tertiary";
}

/**
 * PDF Highlighter utility class for working with PDF.js text layer
 */
export class PDFHighlighter {
  private document: any = null;
  private pageTextCache: Map<number, TextContent> = new Map();
  private pageTextStringCache: Map<number, string> = new Map();

  constructor(document: any) {
    this.document = document;
  }

  /**
   * Extract text content from a specific page with positioning information
   */
  async getPageTextContent(pageNumber: number): Promise<TextContent> {
    if (this.pageTextCache.has(pageNumber)) {
      return this.pageTextCache.get(pageNumber)!;
    }

    try {
      const page = await this.document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      
      this.pageTextCache.set(pageNumber, textContent);
      return textContent;
    } catch (error) {
      console.error(`Error extracting text from page ${pageNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get plain text string from a page
   */
  async getPageTextString(pageNumber: number): Promise<string> {
    if (this.pageTextStringCache.has(pageNumber)) {
      return this.pageTextStringCache.get(pageNumber)!;
    }

    try {
      const textContent = await this.getPageTextContent(pageNumber);
      const textString = textContent.items
        .map((item: TextItem) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      this.pageTextStringCache.set(pageNumber, textString);
      return textString;
    } catch (error) {
      console.error(`Error getting text string from page ${pageNumber}:`, error);
      return '';
    }
  }

  /**
   * Find all occurrences of phrases in the document
   */
  async findPhrasesInDocument(phrases: PhraseMatch[]): Promise<HighlightPosition[]> {
    const highlights: HighlightPosition[] = [];
    const numPages = this.document.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageHighlights = await this.findPhrasesInPage(pageNum, phrases);
      highlights.push(...pageHighlights);
    }

    return highlights;
  }

  /**
   * Find phrases in a specific page
   */
  async findPhrasesInPage(pageNumber: number, phrases: PhraseMatch[]): Promise<HighlightPosition[]> {
    try {
      const textContent = await this.getPageTextContent(pageNumber);
      const textString = await this.getPageTextString(pageNumber);
      const highlights: HighlightPosition[] = [];

      for (const phraseMatch of phrases) {
        const positions = await this.findPhrasePositions(
          pageNumber,
          phraseMatch.phrase,
          textContent,
          textString
        );
        
        highlights.push(...positions);
      }

      return highlights;
    } catch (error) {
      console.error(`Error finding phrases in page ${pageNumber}:`, error);
      return [];
    }
  }

  /**
   * Find all positions of a specific phrase in a page
   */
  private async findPhrasePositions(
    pageNumber: number,
    phrase: string,
    textContent: TextContent,
    textString: string
  ): Promise<HighlightPosition[]> {
    const positions: HighlightPosition[] = [];
    const normalizedPhrase = this.normalizeText(phrase);
    const normalizedText = this.normalizeText(textString);

    // Find all occurrences of the phrase
    let searchIndex = 0;
    while (true) {
      const index = normalizedText.indexOf(normalizedPhrase, searchIndex);
      if (index === -1) break;

      // Get the actual character positions in the original text
      const startPos = this.getActualPosition(textString, normalizedText, index);
      const endPos = this.getActualPosition(textString, normalizedText, index + normalizedPhrase.length);

      if (startPos !== -1 && endPos !== -1) {
        const position = await this.getTextBounds(
          pageNumber,
          startPos,
          endPos,
          textContent,
          textString
        );

        if (position) {
          positions.push(position);
        }
      }

      searchIndex = index + 1;
    }

    return positions;
  }

  /**
   * Get bounding boxes for text between start and end positions
   */
  private async getTextBounds(
    pageNumber: number,
    startPos: number,
    endPos: number,
    textContent: TextContent,
    textString: string
  ): Promise<HighlightPosition | null> {
    try {
      const page = await this.document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      
      // Find the text items that contain our target text
      const rects: BoundingBox[] = [];
      let currentPos = 0;
      
      for (const item of textContent.items) {
        const itemLength = item.str.length;
        const itemStart = currentPos;
        const itemEnd = currentPos + itemLength;
        
        // Check if this item overlaps with our target range
        if (itemStart < endPos && itemEnd > startPos) {
          // Calculate the bounding box for this text item
          const transform = item.transform;
          const x = transform[4];
          const y = transform[5];
          const width = item.width;
          const height = item.height;
          
          // Convert PDF coordinates to viewport coordinates
          const rect: BoundingBox = {
            x1: x,
            y1: viewport.height - y - height, // Flip Y coordinate
            x2: x + width,
            y2: viewport.height - y,
            width: width,
            height: height,
          };
          
          rects.push(rect);
        }
        
        currentPos = itemEnd + 1; // +1 for space between items
      }

      if (rects.length === 0) return null;

      // Calculate overall bounding rect
      const boundingRect: BoundingBox = {
        x1: Math.min(...rects.map(r => r.x1)),
        y1: Math.min(...rects.map(r => r.y1)),
        x2: Math.max(...rects.map(r => r.x2)),
        y2: Math.max(...rects.map(r => r.y2)),
        width: 0,
        height: 0,
      };
      
      boundingRect.width = boundingRect.x2 - boundingRect.x1;
      boundingRect.height = boundingRect.y2 - boundingRect.y1;

      return {
        pageNumber,
        boundingRect,
        rects,
        text: textString.substring(startPos, endPos),
      };
    } catch (error) {
      console.error('Error getting text bounds:', error);
      return null;
    }
  }

  /**
   * Normalize text for better matching (remove extra spaces, normalize case)
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * Get actual character position in original text from normalized position
   */
  private getActualPosition(originalText: string, normalizedText: string, normalizedPos: number): number {
    let originalPos = 0;
    let normalizedCount = 0;
    
    for (let i = 0; i < originalText.length && normalizedCount < normalizedPos; i++) {
      const char = originalText[i];
      const normalizedChar = char.toLowerCase().replace(/[^\w\s]/g, '');
      
      if (normalizedChar) {
        if (normalizedChar === ' ') {
          // Skip multiple spaces in normalized text
          if (normalizedCount === 0 || normalizedText[normalizedCount - 1] !== ' ') {
            normalizedCount++;
          }
        } else {
          normalizedCount++;
        }
      }
      
      originalPos = i + 1;
    }
    
    return originalPos;
  }

  /**
   * Extract important phrases using simple heuristics
   */
  static extractImportantPhrases(
    text: string,
    heading?: string
  ): PhraseMatch[] {
    const phrases: PhraseMatch[] = [];

    // Add heading as primary
    if (heading && heading.trim()) {
      phrases.push({
        phrase: heading.trim(),
        startIndex: 0,
        endIndex: heading.length,
        confidence: 1.0,
        category: "primary"
      });
    }

    // Split into sentences and analyze
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      
      // Primary: Definitions, key concepts
      if (trimmed.match(/\b(define[sd]?|definition|concept|principle|theory|law|fundamental|essential|critical|key concept)\b/i)) {
        phrases.push({
          phrase: trimmed,
          startIndex: text.indexOf(trimmed),
          endIndex: text.indexOf(trimmed) + trimmed.length,
          confidence: 0.9,
          category: "primary"
        });
      }
      // Secondary: Important facts, processes, methods
      else if (trimmed.match(/\b(important|significant|key|main|primary|process|method|approach|strategy|technique)\b/i)) {
        phrases.push({
          phrase: trimmed,
          startIndex: text.indexOf(trimmed),
          endIndex: text.indexOf(trimmed) + trimmed.length,
          confidence: 0.7,
          category: "secondary"
        });
      }
      // Tertiary: Supporting information, examples
      else if (trimmed.match(/\b(example|instance|case|illustration|furthermore|additionally|moreover|however|therefore)\b/i)) {
        phrases.push({
          phrase: trimmed,
          startIndex: text.indexOf(trimmed),
          endIndex: text.indexOf(trimmed) + trimmed.length,
          confidence: 0.5,
          category: "tertiary"
        });
      }
    });

    // Sort by confidence and limit results
    return phrases
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15); // Limit to prevent overwhelming
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.pageTextCache.clear();
    this.pageTextStringCache.clear();
  }
}

/**
 * Create a PDF highlighter instance
 */
export const createPDFHighlighter = (document: any): PDFHighlighter => {
  return new PDFHighlighter(document);
};

export default PDFHighlighter;