// PDF Highlight Management Utilities

export interface Highlight {
  id: string;
  page: number;
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  timestamp: number;
  documentId?: string;
}

export interface AIInsight {
  text: string;
  insight: string;
  timestamp: number;
  type: 'summary' | 'explanation' | 'analysis' | 'translation';
}

// Local storage keys
const HIGHLIGHTS_STORAGE_KEY = 'pdf_highlights';
const INSIGHTS_STORAGE_KEY = 'pdf_insights';

export class PDFHighlightManager {
  private highlights: Map<string, Highlight[]> = new Map();
  private insights: Map<string, AIInsight[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // Highlight management
  addHighlight(documentId: string, highlight: Highlight): void {
    const docHighlights = this.highlights.get(documentId) || [];
    const newHighlight = { ...highlight, documentId };
    docHighlights.push(newHighlight);
    this.highlights.set(documentId, docHighlights);
    this.saveToStorage();
  }

  removeHighlight(documentId: string, highlightId: string): void {
    const docHighlights = this.highlights.get(documentId) || [];
    const filtered = docHighlights.filter(h => h.id !== highlightId);
    this.highlights.set(documentId, filtered);
    this.saveToStorage();
  }

  getHighlights(documentId: string): Highlight[] {
    return this.highlights.get(documentId) || [];
  }

  getHighlightsByPage(documentId: string, page: number): Highlight[] {
    const docHighlights = this.highlights.get(documentId) || [];
    return docHighlights.filter(h => h.page === page);
  }

  // AI Insights management
  addInsight(documentId: string, insight: AIInsight): void {
    const docInsights = this.insights.get(documentId) || [];
    docInsights.push(insight);
    this.insights.set(documentId, docInsights);
    this.saveToStorage();
  }

  getInsights(documentId: string): AIInsight[] {
    return this.insights.get(documentId) || [];
  }

  getInsightForText(documentId: string, text: string): AIInsight | null {
    const docInsights = this.insights.get(documentId) || [];
    return docInsights.find(insight => insight.text === text) || null;
  }

  // Persistence
  private saveToStorage(): void {
    try {
      const highlightsData = Object.fromEntries(this.highlights);
      const insightsData = Object.fromEntries(this.insights);
      
      localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlightsData));
      localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(insightsData));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const highlightsData = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
      const insightsData = localStorage.getItem(INSIGHTS_STORAGE_KEY);

      if (highlightsData) {
        const parsed = JSON.parse(highlightsData);
        this.highlights = new Map(Object.entries(parsed));
      }

      if (insightsData) {
        const parsed = JSON.parse(insightsData);
        this.insights = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }

  // Export/Import functionality
  exportHighlights(documentId: string): string {
    const docHighlights = this.highlights.get(documentId) || [];
    return JSON.stringify(docHighlights, null, 2);
  }

  importHighlights(documentId: string, highlightsJson: string): void {
    try {
      const highlights = JSON.parse(highlightsJson) as Highlight[];
      this.highlights.set(documentId, highlights);
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to import highlights:', error);
      throw new Error('Invalid highlights format');
    }
  }

  // Clear all data for a document
  clearDocument(documentId: string): void {
    this.highlights.delete(documentId);
    this.insights.delete(documentId);
    this.saveToStorage();
  }

  // Clear all data
  clearAll(): void {
    this.highlights.clear();
    this.insights.clear();
    localStorage.removeItem(HIGHLIGHTS_STORAGE_KEY);
    localStorage.removeItem(INSIGHTS_STORAGE_KEY);
  }
}

// AI API Integration
export class AIInsightService {
  private apiEndpoint: string;
  private apiKey?: string;

  constructor(apiEndpoint: string = '/api/ai-insights', apiKey?: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  async getInsights(text: string, type: 'summary' | 'explanation' | 'analysis' | 'translation' = 'analysis'): Promise<string> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({
          text,
          type,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.insight || data.result || 'No insights available';
    } catch (error) {
      console.error('AI Insights API error:', error);
      
      // Fallback to mock insights for demo purposes
      return this.getMockInsight(text, type);
    }
  }

  private getMockInsight(text: string, type: string): string {
    const insights = {
      summary: `Summary: This text discusses ${text.substring(0, 50)}... Key points include the main concepts and their implications.`,
      explanation: `Explanation: This passage explains ${text.substring(0, 30)}... The core idea is about understanding the fundamental principles involved.`,
      analysis: `Analysis: The selected text reveals important insights about ${text.substring(0, 40)}... This suggests broader implications for the topic.`,
      translation: `Translation: [This would contain the translated version of the text in the target language]`,
    };

    return insights[type as keyof typeof insights] || insights.analysis;
  }
}

// Utility functions for highlight rendering
export const highlightUtils = {
  // Generate unique highlight ID
  generateHighlightId(): string {
    return `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Get highlight colors
  getHighlightColors(): { [key: string]: string } {
    return {
      yellow: '#fef08a',
      green: '#bbf7d0',
      blue: '#bfdbfe',
      pink: '#f9a8d4',
      purple: '#ddd6fe',
      orange: '#fed7aa',
    };
  },

  // Apply highlight to text element
  applyHighlightToElement(element: HTMLElement, highlight: Highlight): void {
    const textContent = element.textContent || '';
    if (textContent.includes(highlight.text)) {
      const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedText, 'gi');
      
      element.innerHTML = element.innerHTML.replace(
        regex,
        `<span class="highlight" style="background-color: ${highlight.color}; opacity: 1;" data-highlight-id="${highlight.id}">$&</span>`
      );
    }
  },

  // Remove highlight from text element
  removeHighlightFromElement(element: HTMLElement, highlightId: string): void {
    const highlightSpans = element.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    highlightSpans.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(span.textContent || ''), span);
        parent.normalize(); // Merge adjacent text nodes
      }
    });
  },
};

// Create singleton instances
export const highlightManager = new PDFHighlightManager();
export const aiInsightService = new AIInsightService();