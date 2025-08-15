import { Highlight } from '@/components/PDFReader';

export interface PDFDownloadOptions {
  includeHighlights: boolean;
  includeNotes: boolean;
  format: 'pdf' | 'json';
}

export class PDFUtils {
  static async downloadPDFWithHighlights(
    documentUrl: string,
    documentName: string,
    highlights: Highlight[],
    options: PDFDownloadOptions = { includeHighlights: true, includeNotes: true, format: 'pdf' }
  ) {
    try {
      if (options.format === 'json') {
        // Download highlights as JSON
        const highlightData = {
          documentName,
          documentUrl,
          highlights: highlights.map(h => ({
            id: h.id,
            text: h.text,
            page: h.page,
            color: h.color,
            relevanceScore: h.relevanceScore,
            explanation: h.explanation,
            timestamp: new Date().toISOString()
          })),
          exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(highlightData, null, 2)], {
          type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentName.replace('.pdf', '')}_highlights.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
      }

      // For PDF format, we'll need to use a PDF library like PDF-lib
      // For now, we'll download the original PDF and the highlights separately
      
      // Download original PDF
      const response = await fetch(documentUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = documentName;
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      URL.revokeObjectURL(pdfUrl);

      // Also download highlights as a separate file
      if (options.includeHighlights && highlights.length > 0) {
        setTimeout(() => {
          this.downloadPDFWithHighlights(documentUrl, documentName, highlights, {
            ...options,
            format: 'json'
          });
        }, 1000);
      }

      return true;
    } catch (error) {
      console.error('Error downloading PDF with highlights:', error);
      throw error;
    }
  }

  static generateHighlightsSummary(highlights: Highlight[]): string {
    if (highlights.length === 0) {
      return 'No highlights found.';
    }

    const summary = highlights
      .sort((a, b) => a.page - b.page)
      .map((highlight, index) => {
        return `${index + 1}. Page ${highlight.page} (${highlight.color} highlight):\n   "${highlight.text}"\n   Note: ${highlight.explanation}\n`;
      })
      .join('\n');

    return `Document Highlights Summary\n${'='.repeat(30)}\n\n${summary}`;
  }

  static async downloadHighlightsSummary(
    documentName: string,
    highlights: Highlight[]
  ) {
    const summary = this.generateHighlightsSummary(highlights);
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentName.replace('.pdf', '')}_highlights_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}