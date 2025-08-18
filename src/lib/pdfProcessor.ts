import { PDFDocument, rgb, PageSizes } from 'pdf-lib';
import { SmartHighlight } from './highlightEngine';

export interface HighlightAnnotation {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: { r: number; g: number; b: number };
  type: string;
  text: string;
}

export class PDFProcessor {
  /**
   * Add highlights to a PDF and return the modified PDF as bytes
   */
  async addHighlightsToPDF(
    pdfUrl: string, 
    highlights: SmartHighlight[]
  ): Promise<Uint8Array> {
    try {
      // Fetch the original PDF
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      
      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Group highlights by page
      const highlightsByPage = this.groupHighlightsByPage(highlights);
      
      // Process each page
      for (const [pageNum, pageHighlights] of highlightsByPage.entries()) {
        await this.addHighlightsToPage(pdfDoc, pageNum - 1, pageHighlights); // PDF pages are 0-indexed
      }
      
      // Add metadata about highlights
      this.addHighlightMetadata(pdfDoc, highlights);
      
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to add highlights to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Group highlights by page number
   */
  private groupHighlightsByPage(highlights: SmartHighlight[]): Map<number, SmartHighlight[]> {
    const grouped = new Map<number, SmartHighlight[]>();
    
    highlights.forEach(highlight => {
      if (!grouped.has(highlight.page)) {
        grouped.set(highlight.page, []);
      }
      grouped.get(highlight.page)!.push(highlight);
    });
    
    return grouped;
  }

  /**
   * Add highlights to a specific page
   */
  private async addHighlightsToPage(
    pdfDoc: PDFDocument, 
    pageIndex: number, 
    highlights: SmartHighlight[]
  ): Promise<void> {
    const pages = pdfDoc.getPages();
    if (pageIndex >= pages.length) {
      console.warn(`Page ${pageIndex + 1} not found in PDF`);
      return;
    }
    
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    
    // Add highlight annotations
    highlights.forEach(highlight => {
      try {
        const color = this.getHighlightColor(highlight.color, highlight.type);
        
        // Convert screen coordinates to PDF coordinates (approximate)
        // Note: This is a simplified conversion - in a real implementation,
        // you'd need more precise coordinate mapping
        const pdfCoords = this.convertToPDFCoordinates(
          highlight.segment.startIndex,
          highlight.segment.endIndex,
          width,
          height
        );
        
        // Create highlight annotation
        page.drawRectangle({
          x: pdfCoords.x,
          y: height - pdfCoords.y - pdfCoords.height, // PDF coordinates are bottom-up
          width: pdfCoords.width,
          height: pdfCoords.height,
          color: rgb(color.r, color.g, color.b),
          opacity: 0.3,
          borderColor: rgb(color.r * 0.8, color.g * 0.8, color.b * 0.8),
          borderWidth: 1,
        });
        
        // Add a small type indicator
        const typeIndicator = this.getTypeIndicator(highlight.type);
        page.drawText(typeIndicator, {
          x: pdfCoords.x - 10,
          y: height - pdfCoords.y - 5,
          size: 8,
          color: rgb(0.2, 0.2, 0.2),
        });
        
      } catch (error) {
        console.warn(`Failed to add highlight for "${highlight.text.substring(0, 30)}...":`, error);
      }
    });
  }

  /**
   * Convert text indices to approximate PDF coordinates
   * This is a simplified approach - real implementation would need more precise mapping
   */
  private convertToPDFCoordinates(
    startIndex: number, 
    endIndex: number, 
    pageWidth: number, 
    pageHeight: number
  ): { x: number; y: number; width: number; height: number } {
    // This is a very simplified coordinate conversion
    // In a real implementation, you'd need to:
    // 1. Extract text layout information from the PDF
    // 2. Map character indices to actual positions
    // 3. Handle line breaks and text flow properly
    
    const textLength = endIndex - startIndex;
    const avgCharWidth = 6; // Approximate character width
    const lineHeight = 12; // Approximate line height
    
    // Estimate position based on character indices (very rough approximation)
    const charsPerLine = Math.floor(pageWidth / avgCharWidth);
    const lineNumber = Math.floor(startIndex / charsPerLine);
    const charInLine = startIndex % charsPerLine;
    
    return {
      x: charInLine * avgCharWidth + 50, // Add margin
      y: lineNumber * lineHeight + 100, // Add top margin
      width: Math.min(textLength * avgCharWidth, pageWidth - 100),
      height: lineHeight
    };
  }

  /**
   * Get RGB color values for different highlight types
   */
  private getHighlightColor(
    color: string, 
    type: string
  ): { r: number; g: number; b: number } {
    switch (type) {
      case 'concept':
        return { r: 0.996, g: 0.941, b: 0.541 }; // Yellow
      case 'statistic':
        return { r: 0.576, g: 0.773, b: 0.992 }; // Blue
      case 'definition':
        return { r: 0.525, g: 0.937, b: 0.675 }; // Green
      case 'action':
        return { r: 0.984, g: 0.573, b: 0.235 }; // Orange
      default:
        return { r: 0.996, g: 0.941, b: 0.541 }; // Default to yellow
    }
  }

  /**
   * Get type indicator symbol
   */
  private getTypeIndicator(type: string): string {
    switch (type) {
      case 'concept': return '💡';
      case 'statistic': return '📊';
      case 'definition': return '📖';
      case 'action': return '✅';
      default: return '⭐';
    }
  }

  /**
   * Add metadata about highlights to the PDF
   */
  private addHighlightMetadata(pdfDoc: PDFDocument, highlights: SmartHighlight[]): void {
    const stats = this.calculateHighlightStats(highlights);
    
    // Add custom metadata
    pdfDoc.setTitle('Enhanced PDF with Smart Highlights');
    pdfDoc.setSubject(`PDF enhanced with ${stats.total} intelligent highlights`);
    pdfDoc.setCreator('Smart PDF Viewer');
    pdfDoc.setProducer('Smart PDF Viewer - AI-Enhanced Document Processing');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    
    // Add highlight summary as metadata
    const summary = `Smart Highlights Summary:
- Key Concepts: ${stats.concepts}
- Statistics/Data: ${stats.statistics}
- Definitions: ${stats.definitions}
- Action Items: ${stats.actions}
Total: ${stats.total} highlights`;
    
    pdfDoc.setKeywords([
      'smart-highlights',
      'ai-enhanced',
      'concepts',
      'statistics',
      'definitions',
      'actions',
      `total-${stats.total}`
    ]);
  }

  /**
   * Calculate highlight statistics
   */
  private calculateHighlightStats(highlights: SmartHighlight[]) {
    return {
      total: highlights.length,
      concepts: highlights.filter(h => h.type === 'concept').length,
      statistics: highlights.filter(h => h.type === 'statistic').length,
      definitions: highlights.filter(h => h.type === 'definition').length,
      actions: highlights.filter(h => h.type === 'action').length
    };
  }

  /**
   * Create a summary page with highlight information
   */
  async createHighlightSummaryPDF(highlights: SmartHighlight[]): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    const stats = this.calculateHighlightStats(highlights);
    
    // Title
    page.drawText('Smart Highlights Summary', {
      x: 50,
      y: height - 50,
      size: 24,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Statistics
    let yPosition = height - 100;
    const statLines = [
      `Total Highlights: ${stats.total}`,
      `Key Concepts: ${stats.concepts}`,
      `Statistics/Data: ${stats.statistics}`,
      `Definitions: ${stats.definitions}`,
      `Action Items: ${stats.actions}`
    ];
    
    statLines.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 25;
    });
    
    // Highlight details
    yPosition -= 20;
    page.drawText('Highlight Details:', {
      x: 50,
      y: yPosition,
      size: 18,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    yPosition -= 30;
    highlights.slice(0, 20).forEach((highlight, index) => { // Limit to first 20
      if (yPosition < 100) return; // Prevent overflow
      
      const typeIcon = this.getTypeIndicator(highlight.type);
      const text = `${typeIcon} Page ${highlight.page}: ${highlight.text.substring(0, 80)}${highlight.text.length > 80 ? '...' : ''}`;
      
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: 10,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 20;
    });
    
    if (highlights.length > 20) {
      page.drawText(`... and ${highlights.length - 20} more highlights`, {
        x: 50,
        y: yPosition,
        size: 10,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
    
    return await pdfDoc.save();
  }

  /**
   * Download PDF as file
   */
  downloadPDF(pdfBytes: Uint8Array, filename: string): void {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

// Export singleton instance
export const pdfProcessor = new PDFProcessor();