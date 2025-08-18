const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface DocumentInfo {
  id: string;
  name: string;
  title: string;
  outline: OutlineItem[];
  language: string;
  upload_timestamp: string;
}

export interface OutlineItem {
  level: string;
  text: string;
  page: number;
}

export interface RelatedSection {
  document: string;
  section_title: string;
  page_number: number;
  relevance_score: number;
  explanation: string;
}

export interface Insight {
  type: 'takeaway' | 'fact' | 'contradiction' | 'connection' | 'info' | 'error';
  content: string;
}

export interface ComprehensiveInsights {
  insights: Insight[];
  persona_insights: Array<{
    type: 'relevance' | 'action' | 'skill';
    content: string;
  }>;
  topic_analysis: {
    main_themes?: string;
    trending_topics?: string;
    research_opportunities?: string;
  };
  web_facts: Array<{
    type: string;
    query: string;
    description: string;
  }>;
  keywords: string[];
  search_queries: string[];
}

export interface ReadingProgress {
  progress_percentage: number;
  time_spent_minutes: number;
  estimated_remaining_minutes: number;
  estimated_total_minutes: number;
}

export interface HighlightData {
  text: string;
  color: string;
  page: number;
  documentName: string;
}

export interface SimplifiedText {
  text: string;
  original: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async uploadPDFs(files: File[], persona?: string, jobToBeDone?: string): Promise<DocumentInfo[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (persona) {
      formData.append('persona', persona);
    }
    if (jobToBeDone) {
      formData.append('job_to_be_done', jobToBeDone);
    }

    const response = await fetch(`${this.baseUrl}/upload-pdfs`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getDocuments(): Promise<DocumentInfo[]> {
    const response = await fetch(`${this.baseUrl}/documents`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteDocument(docId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${docId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }
  }

  async analyzeDocuments(documentIds: string[], persona: string, jobToBeDone: string) {
    const response = await fetch(`${this.baseUrl}/analyze-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_ids: documentIds,
        persona,
        job_to_be_done: jobToBeDone,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getRelatedSections(
    documentIds: string[],
    currentPage: number,
    currentSection: string,
    persona: string,
    jobToBeDone: string
  ): Promise<RelatedSection[]> {
    const response = await fetch(`${this.baseUrl}/related-sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_ids: documentIds,
        current_page: currentPage,
        current_section: currentSection,
        persona,
        job_to_be_done: jobToBeDone,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get related sections: ${response.statusText}`);
    }

    const data = await response.json();
    return data.related_sections;
  }

  async generateInsights(
    text: string,
    persona: string,
    jobToBeDone: string,
    documentContext?: string
  ): Promise<Insight[]> {
    const response = await fetch(`${this.baseUrl}/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        persona,
        job_to_be_done: jobToBeDone,
        document_context: documentContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate insights: ${response.statusText}`);
    }

    const data = await response.json();
    return data.insights;
  }

  async generateComprehensiveInsights(
    text: string,
    persona: string,
    jobToBeDone: string,
    documentContext?: string
  ): Promise<ComprehensiveInsights> {
    const response = await fetch(`${this.baseUrl}/comprehensive-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        persona,
        job_to_be_done: jobToBeDone,
        document_context: documentContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate comprehensive insights: ${response.statusText}`);
    }

    return response.json();
  }

  async generatePodcast(
    text: string,
    relatedSections: string[],
    insights: string[]
  ): Promise<{ script: string; audio_url: string }> {
    const response = await fetch(`${this.baseUrl}/podcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        related_sections: relatedSections,
        insights,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate podcast: ${response.statusText}`);
    }

    return response.json();
  }

  async simplifyText(text: string, difficultyLevel?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/simplify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          difficulty_level: difficultyLevel || 'simple'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to simplify text: ${response.statusText}`);
      }

      const data = await response.json();
      return data.simplified_text || data.text || text;
    } catch (error) {
      console.error('API simplify error:', error);
      // Fallback with mock simplification
      return this.mockSimplifyText(text, difficultyLevel);
    }
  }

  private mockSimplifyText(text: string, difficultyLevel?: string): string {
    // Mock simplification based on difficulty level
    switch (difficultyLevel) {
      case 'simple':
        return `Simple version: ${text.split('.')[0].substring(0, 100)}. This means the main idea is clear and easy to understand.`;
      case 'moderate':
        return `Moderate version: ${text.substring(0, 150)}. The key concepts are explained with some detail while keeping it accessible.`;
      case 'advanced':
        return `Advanced version: ${text.substring(0, 200)}. Technical terms are preserved but the structure is clearer.`;
      default:
        return `Simplified: ${text.substring(0, 120)}...`;
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          target_language: targetLanguage
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to translate text: ${response.statusText}`);
      }

      const data = await response.json();
      return data.translated_text || data.text || text;
    } catch (error) {
      console.error('API translate error:', error);
      // Fallback with mock translation
      return this.mockTranslateText(text, targetLanguage);
    }
  }

  private mockTranslateText(text: string, targetLanguage: string): string {
    const languageGreetings: { [key: string]: string } = {
      'spanish': '¡Hola! Texto traducido al español:',
      'french': 'Bonjour! Texte traduit en français:',
      'german': 'Hallo! Text übersetzt ins Deutsche:',
      'italian': 'Ciao! Testo tradotto in italiano:',
      'portuguese': 'Olá! Texto traduzido para português:',
      'chinese': '你好！翻译成中文的文本：',
      'japanese': 'こんにちは！日本語に翻訳されたテキスト：',
      'korean': '안녕하세요! 한국어로 번역된 텍스트:',
      'arabic': 'مرحبا! النص المترجم إلى العربية:',
      'hindi': 'नमस्ते! हिंदी में अनुवादित पाठ:',
      'russian': 'Привет! Текст переведен на русский:',
      'dutch': 'Hallo! Tekst vertaald naar het Nederlands:'
    };

    const greeting = languageGreetings[targetLanguage] || 'Translated text:';
    return `${greeting} ${text.substring(0, 150)}...`;
  }

  async defineTerm(term: string, context: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/define-term`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        term,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to define term: ${response.statusText}`);
    }

    const data = await response.json();
    return data.definition;
  }

  async defineTerms(text: string, context: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/define-terms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to define terms: ${response.statusText}`);
    }

    const data = await response.json();
    return data.definitions;
  }

  async findConnections(text: string, documentId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/find-connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        document_id: documentId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to find connections: ${response.statusText}`);
    }

    const data = await response.json();
    return data.connections;
  }

  async trackReadingProgress(
    docId: string,
    currentPage: number,
    totalPages: number,
    timeSpent: number
  ): Promise<ReadingProgress> {
    const formData = new FormData();
    formData.append('doc_id', docId);
    formData.append('current_page', currentPage.toString());
    formData.append('total_pages', totalPages.toString());
    formData.append('time_spent', timeSpent.toString());

    const response = await fetch(`${this.baseUrl}/reading-progress`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to track progress: ${response.statusText}`);
    }

    return response.json();
  }

  getPDFUrl(docId: string): string {
    return `${this.baseUrl}/pdf/${docId}`;
  }

  getAudioUrl(filename: string): string {
    return `${this.baseUrl}/audio/${filename}`;
  }

  async getLibraryDocuments(persona?: string, jobToBeDone?: string): Promise<DocumentInfo[]> {
    const params = new URLSearchParams();
    if (persona) params.append('persona', persona);
    if (jobToBeDone) params.append('job_to_be_done', jobToBeDone);
    
    const url = `${this.baseUrl}/library/documents${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch library documents: ${response.statusText}`);
    }

    return response.json();
  }

  async getPersonas(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/library/personas`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch personas: ${response.statusText}`);
    }

    return response.json();
  }

  async getJobs(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/library/jobs`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    return response.json();
  }

  async getCrossConnections(docId: string): Promise<CrossConnectionsResponse> {
    const response = await fetch(`${this.baseUrl}/cross-connections/${docId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get cross connections: ${response.statusText}`);
    }

    return response.json();
  }

  async generateMultiDocumentInsights(
    documentIds: string[],
    persona: string,
    jobToBeDone: string
  ): Promise<MultiDocumentInsights> {
    const response = await fetch(`${this.baseUrl}/multi-document-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_ids: documentIds,
        persona,
        job_to_be_done: jobToBeDone,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate multi-document insights: ${response.statusText}`);
    }

    return response.json();
  }

  async generateStrategicInsights(
    text: string,
    persona: string,
    jobToBeDone: string,
    documentContext?: string
  ): Promise<StrategicInsights> {
    const response = await fetch(`${this.baseUrl}/strategic-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        persona,
        job_to_be_done: jobToBeDone,
        document_context: documentContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate strategic insights: ${response.statusText}`);
    }

    const data = await response.json();
    return data.strategic_insights;
  }

  async analyzeDocumentContext(
    docId: string,
    pageNumber: number,
    sectionText: string
  ): Promise<ContextualAnalysis> {
    const response = await fetch(`${this.baseUrl}/contextual-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doc_id: docId,
        page_number: pageNumber,
        section_text: sectionText,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze document context: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }

  async addHighlight(highlight: HighlightData): Promise<void> {
    const response = await fetch(`${this.baseUrl}/highlights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(highlight),
    });

    if (!response.ok) {
      throw new Error(`Failed to add highlight: ${response.statusText}`);
    }
  }

  async getHighlights(documentName: string): Promise<HighlightData[]> {
    const response = await fetch(`${this.baseUrl}/highlights/${encodeURIComponent(documentName)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch highlights: ${response.statusText}`);
    }

    return response.json();
  }

  async downloadHighlightedPDF(documentName: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/download-highlighted/${encodeURIComponent(documentName)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download highlighted PDF: ${response.statusText}`);
    }

    return response.blob();
  }
}

export interface CrossConnectionsResponse {
  document_id: string;
  related_documents: RelatedDocument[];
  contradictions: Contradiction[];
  insights: CrossDocumentInsight[];
  total_connections: number;
}

export interface RelatedDocument {
  document_id: string;
  document_title: string;
  connection_type: 'complementary' | 'contradictory' | 'similar' | 'related';
  relevance_score: number;
  explanation: string;
  key_sections: string[];
  similarities?: Array<{
    doc1_quote: string;
    doc2_quote: string;
    similarity_type: 'identical' | 'paraphrased' | 'concept_match';
    explanation: string;
  }>;
  complementary_insights?: Array<{
    insight: string;
    doc1_support: string;
    doc2_support: string;
  }>;
}

export interface Contradiction {
  document_id: string;
  document_title: string;
  contradiction: string;
  severity: 'low' | 'medium' | 'high';
  doc1_quote?: string;
  doc2_quote?: string;
  contradiction_type?: 'direct' | 'methodological' | 'conclusion' | 'general';
}

export interface CrossDocumentInsight {
  type: 'pattern' | 'opportunity' | 'recommendation' | 'takeaway';
  content: string;
  confidence: number;
}

export interface StrategicInsights {
  opportunities: Array<{
    insight: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: 'immediate' | 'short-term' | 'long-term';
  }>;
  critical_decisions: Array<{
    decision: string;
    factors: string[];
    urgency: 'high' | 'medium' | 'low';
  }>;
  risks: Array<{
    risk: string;
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  action_items: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }>;
  knowledge_gaps: Array<{
    gap: string;
    importance: 'high' | 'medium' | 'low';
    source_suggestions: string[];
  }>;
  strategic_context: {
    relevance_to_role: string;
    business_impact: string;
    competitive_advantage: string;
  };
}

export interface ContextualAnalysis {
  section_summary: string;
  contextual_significance: string;
  personal_relevance: string;
  deeper_implications: string[];
  cross_references: string[];
  expert_perspective: string;
  questions_to_consider: string[];
  next_steps: string[];
  confidence_score: number;
}

export interface MultiDocumentInsights {
  analyzed_documents: number;
  document_titles: string[];
  insights: {
    overarching_patterns: Array<{
      pattern: string;
      documents: string[];
      evidence: string[];
      significance: string;
    }>;
    contradictions: Array<{
      topic: string;
      doc1_position: string;
      doc2_position: string;
      doc1_evidence: string;
      doc2_evidence: string;
      impact: string;
      resolution_suggestion: string;
    }>;
    knowledge_gaps: Array<{
      gap: string;
      importance: 'high' | 'medium' | 'low';
      impact_on_job: string;
      suggested_research: string;
    }>;
    synthesis_insights: Array<{
      insight: string;
      supporting_documents: string[];
      implications: string;
      confidence: number;
    }>;
    actionable_recommendations: Array<{
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
      timeframe: 'immediate' | 'short-term' | 'long-term';
      based_on: string;
      success_metrics: string;
    }>;
  };
}

  async generateDocumentSnippet(
    text: string,
    persona: string,
    jobToBeDone: string,
    documentContext?: string
  ): Promise<{ snippet: string; key_points: string[] }> {
    const response = await fetch(`${this.baseUrl}/document-snippet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        persona,
        job_to_be_done: jobToBeDone,
        document_context: documentContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate document snippet: ${response.statusText}`);
    }

    return response.json();
  }

  async generateKeyInsights(
    text: string,
    persona: string,
    jobToBeDone: string,
    documentContext?: string
  ): Promise<Array<{ insight: string; importance: 'high' | 'medium' | 'low'; page_reference?: number }>> {
    const response = await fetch(`${this.baseUrl}/key-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        persona,
        job_to_be_done: jobToBeDone,
        document_context: documentContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate key insights: ${response.statusText}`);
    }

    const data = await response.json();
    return data.key_insights;
  }

  async generateThoughtfulQuestions(
    text: string,
    persona: string,
    jobToBeDone: string,
    documentContext?: string
  ): Promise<Array<{ question: string; type: 'analytical' | 'strategic' | 'practical' | 'critical'; follow_up_prompts: string[] }>> {
    const response = await fetch(`${this.baseUrl}/thoughtful-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        persona,
        job_to_be_done: jobToBeDone,
        document_context: documentContext,
        prompt_instruction: "Generate really thoughtful questions that encourage deep thinking and user interaction. These questions should be designed for an LLM to engage with and provide meaningful responses."
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate thoughtful questions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.questions;
  }

  async generateRelatedConnections(
    text: string,
    documentIds: string[],
    persona: string,
    jobToBeDone: string
  ): Promise<{
    document_connections: Array<{
      document_title: string;
      section_title: string;
      page_number: number;
      connection_type: string;
      relevance_explanation: string;
    }>;
    external_links: Array<{
      title: string;
      url: string;
      description: string;
      relevance_score: number;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/related-connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        document_ids: documentIds,
        persona,
        job_to_be_done: jobToBeDone,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate related connections: ${response.statusText}`);
    }

    return response.json();
  }

  async generateDidYouKnowFacts(
    text: string,
    persona: string,
    jobToBeDone: string
  ): Promise<Array<{ fact: string; source_type: 'research' | 'statistic' | 'historical' | 'trending'; relevance_explanation: string }>> {
    const response = await fetch(`${this.baseUrl}/did-you-know-facts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        persona,
        job_to_be_done: jobToBeDone,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate did you know facts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.facts;
  }
}

export const apiService = new ApiService();