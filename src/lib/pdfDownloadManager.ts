// PDF Download Manager
// Handles the creation and download of highlighted PDFs using PDF-lib

import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { Highlight } from '@/components/PDFReader';

export interface HighlightAnnotation {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: { r: number; g: number; b: number; alpha: number };
  text: string;
  explanation: string;
}

export interface DownloadOptions {
  includeMetadata: boolean;
  includeAnnotations: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  colorProfile: 'standard' | 'accessible' | 'printer-friendly';
}

export class PDFDownloadManager {
  private colorMap = {
    primary: { r: 1, g: 0.94, b: 0.54, alpha: 0.4 },     // Yellow
    secondary: { r: 0.53, g: 0.94, b: 0.67, alpha: 0.4 }, // Green
    tertiary: { r: 0.58, g: 0.77, b: 0.99, alpha: 0.4 },  // Blue
    quaternary: { r: 0.98, g: 0.57, b: 0.24, alpha: 0.4 } // Orange
  };

  private accessibleColorMap = {
    primary: { r: 1, g: 0.9, b: 0.2, alpha: 0.5 },        // High contrast yellow
    secondary: { r: 0.2, g: 0.8, b: 0.2, alpha: 0.5 },    // High contrast green
    tertiary: { r: 0.2, g: 0.4, b: 0.9, alpha: 0.5 },     // High contrast blue
    quaternary: { r: 0.9, g: 0.4, b: 0.1, alpha: 0.5 }    // High contrast orange
  };

  async createHighlightedPDF(
    originalPdfUrl: string,
    highlights: Highlight[],
    options: Partial<DownloadOptions> = {}
  ): Promise<Uint8Array> {
    const defaultOptions: DownloadOptions = {
      includeMetadata: true,
      includeAnnotations: true,
      compressionLevel: 'medium',
      colorProfile: 'standard'
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      // Fetch the original PDF
      const existingPdfBytes = await this.fetchPDFBytes(originalPdfUrl);
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Add metadata if requested
      if (finalOptions.includeMetadata) {
        await this.addMetadata(pdfDoc, highlights);
      }

      // Process highlights by page
      const highlightsByPage = this.groupHighlightsByPage(highlights);
      
      // Add highlights to each page
      for (const [pageIndex, pageHighlights] of highlightsByPage.entries()) {
        await this.addHighlightsToPage(
          pdfDoc, 
          pageIndex, 
          pageHighlights, 
          finalOptions
        );
      }

      // Apply compression
      const pdfBytes = await this.serializePDF(pdfDoc, finalOptions.compressionLevel);
      
      return pdfBytes;
      
    } catch (error) {
      console.error('Error creating highlighted PDF:', error);
      throw new Error('Failed to create highlighted PDF. Please try again.');
    }
  }

  private async fetchPDFBytes(url: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error fetching PDF:', error);
      throw new Error('Could not load the original PDF file');
    }
  }

  private async addMetadata(pdfDoc: PDFDocument, highlights: Highlight[]) {
    const now = new Date();
    const highlightStats = this.calculateHighlightStats(highlights);
    
    pdfDoc.setTitle(`Highlighted Document - ${now.toLocaleDateString()}`);
    pdfDoc.setSubject('Document with intelligent highlights');
    pdfDoc.setKeywords([
      'highlighted',
      'intelligent',
      'analysis',
      ...highlightStats.topKeywords
    ]);
    pdfDoc.setProducer('DocuSense PDF Highlighter');
    pdfDoc.setCreator('DocuSense');
    pdfDoc.setCreationDate(now);
    pdfDoc.setModificationDate(now);

    // Add custom metadata about highlights
    pdfDoc.setCustomMetadata('HighlightCount', highlights.length.toString());
    pdfDoc.setCustomMetadata('HighlightTypes', JSON.stringify(highlightStats.typeDistribution));
    pdfDoc.setCustomMetadata('AverageRelevance', highlightStats.averageRelevance.toFixed(2));
  }

  private calculateHighlightStats(highlights: Highlight[]) {
    const typeDistribution: Record<string, number> = {};
    let totalRelevance = 0;
    const allKeywords: string[] = [];

    highlights.forEach(highlight => {
      // Determine type from color (basic mapping)
      const type = this.getTypeFromColor(highlight.color);
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      totalRelevance += highlight.relevanceScore;
      
      // Extract keywords from text
      const keywords = this.extractKeywords(highlight.text);
      allKeywords.push(...keywords);
    });

    const averageRelevance = highlights.length > 0 ? totalRelevance / highlights.length : 0;
    const topKeywords = this.getTopKeywords(allKeywords, 10);

    return {
      typeDistribution,
      averageRelevance,
      topKeywords
    };
  }

  private getTypeFromColor(color: string): string {
    const typeMap: Record<string, string> = {
      primary: 'key-concept',
      secondary: 'definition',
      tertiary: 'statistic',
      quaternary: 'action-item'
    };
    return typeMap[color] || 'general';
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  private getTopKeywords(keywords: string[], limit: number): string[] {
    const frequency: Record<string, number> = {};
    keywords.forEach(keyword => {
      frequency[keyword] = (frequency[keyword] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([keyword]) => keyword);
  }

  private groupHighlightsByPage(highlights: Highlight[]): Map<number, Highlight[]> {
    const grouped = new Map<number, Highlight[]>();
    
    highlights.forEach(highlight => {
      const pageIndex = highlight.page - 1; // Convert to 0-based index
      if (!grouped.has(pageIndex)) {
        grouped.set(pageIndex, []);
      }
      grouped.get(pageIndex)!.push(highlight);
    });
    
    return grouped;
  }

  private async addHighlightsToPage(
    pdfDoc: PDFDocument,
    pageIndex: number,
    highlights: Highlight[],
    options: DownloadOptions
  ) {
    const pages = pdfDoc.getPages();
    if (pageIndex >= pages.length) {
      console.warn(`Page ${pageIndex + 1} does not exist in PDF`);
      return;
    }

    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    highlights.forEach((highlight, index) => {
      try {
        // Calculate highlight position (this is a simplified approach)
        // In a real implementation, you'd need to map text positions more accurately
        const position = this.calculateHighlightPosition(
          highlight.text,
          width,
          height,
          index
        );

        // Get color based on profile
        const colorMap = options.colorProfile === 'accessible' 
          ? this.accessibleColorMap 
          : this.colorMap;
        
        const color = colorMap[highlight.color as keyof typeof colorMap] || colorMap.primary;

        // Draw highlight rectangle
        page.drawRectangle({
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          color: rgb(color.r, color.g, color.b),
          opacity: color.alpha,
          borderColor: rgb(color.r * 0.8, color.g * 0.8, color.b * 0.8),
          borderWidth: 0.5
        });

        // Add annotation if enabled
        if (options.includeAnnotations) {
          this.addTextAnnotation(page, position, highlight);
        }

      } catch (error) {
        console.error(`Error adding highlight ${index} to page ${pageIndex + 1}:`, error);
      }
    });
  }

  private calculateHighlightPosition(
    text: string,
    pageWidth: number,
    pageHeight: number,
    index: number
  ): { x: number; y: number; width: number; height: number } {
    // This is a simplified position calculation
    // In a real implementation, you would need to:
    // 1. Parse the PDF text layer to find exact text positions
    // 2. Match the highlight text with the PDF text
    // 3. Calculate accurate bounding boxes
    
    const margin = 50;
    const lineHeight = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Estimate text width (very rough approximation)
    const estimatedWidth = Math.min(text.length * 6, maxWidth);
    
    // Position highlights in a grid pattern for demo purposes
    const x = margin + (index % 2) * (maxWidth / 2);
    const y = pageHeight - margin - (Math.floor(index / 2) * lineHeight * 2);
    
    return {
      x,
      y: Math.max(margin, y - lineHeight),
      width: estimatedWidth,
      height: lineHeight
    };
  }

  private addTextAnnotation(
    page: any,
    position: { x: number; y: number; width: number; height: number },
    highlight: Highlight
  ) {
    // Add a text annotation with the highlight explanation
    // This creates a popup note when the highlight is clicked in PDF viewers
    try {
      const annotation = page.doc.context.obj({
        Type: 'Annot',
        Subtype: 'Text',
        Rect: [position.x, position.y, position.x + 20, position.y + 20],
        Contents: `${highlight.explanation}\n\nRelevance: ${Math.round(highlight.relevanceScore * 100)}%`,
        Name: 'Note',
        Open: false,
        Color: [1, 0.9, 0.2] // Yellow note icon
      });

      page.node.addAnnot(annotation);
    } catch (error) {
      console.error('Error adding text annotation:', error);
    }
  }

  private async serializePDF(
    pdfDoc: PDFDocument,
    compressionLevel: 'none' | 'low' | 'medium' | 'high'
  ): Promise<Uint8Array> {
    const compressionOptions = {
      none: { useObjectStreams: false, addDefaultPage: false },
      low: { useObjectStreams: true, addDefaultPage: false },
      medium: { useObjectStreams: true, addDefaultPage: false },
      high: { useObjectStreams: true, addDefaultPage: false }
    };

    return await pdfDoc.save(compressionOptions[compressionLevel]);
  }

  // Utility method to download the PDF
  async downloadHighlightedPDF(
    originalPdfUrl: string,
    highlights: Highlight[],
    filename: string = 'highlighted-document.pdf',
    options?: Partial<DownloadOptions>
  ): Promise<void> {
    try {
      const pdfBytes = await this.createHighlightedPDF(originalPdfUrl, highlights, options);
      
      // Create blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      console.error('Error downloading highlighted PDF:', error);
      throw error;
    }
  }

  // Method to get PDF as blob for other uses
  async getHighlightedPDFBlob(
    originalPdfUrl: string,
    highlights: Highlight[],
    options?: Partial<DownloadOptions>
  ): Promise<Blob> {
    const pdfBytes = await this.createHighlightedPDF(originalPdfUrl, highlights, options);
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  // Method to validate highlights before processing
  validateHighlights(highlights: Highlight[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (highlights.length === 0) {
      errors.push('No highlights provided');
    }
    
    highlights.forEach((highlight, index) => {
      if (!highlight.text || highlight.text.trim().length === 0) {
        errors.push(`Highlight ${index + 1}: Empty text`);
      }
      
      if (!highlight.page || highlight.page < 1) {
        errors.push(`Highlight ${index + 1}: Invalid page number`);
      }
      
      if (!['primary', 'secondary', 'tertiary', 'quaternary'].includes(highlight.color)) {
        errors.push(`Highlight ${index + 1}: Invalid color`);
      }
      
      if (highlight.relevanceScore < 0 || highlight.relevanceScore > 1) {
        errors.push(`Highlight ${index + 1}: Invalid relevance score`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const pdfDownloadManager = new PDFDownloadManager();