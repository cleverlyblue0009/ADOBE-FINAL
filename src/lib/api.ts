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

  async simplifyText(text: string, difficultyLevel: string = 'simple'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/simplify-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        difficulty_level: difficultyLevel,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to simplify text: ${response.statusText}`);
    }

    const data = await response.json();
    return data.simplified_text;
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
    try {
      const params = new URLSearchParams();
      if (persona) params.append('persona', persona);
      if (jobToBeDone) params.append('job_to_be_done', jobToBeDone);
      
      const url = `/library/documents${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching library documents from:', url);
      
      const response = await fetch(`${this.baseUrl}${url}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Library documents fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch library documents: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Library documents response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching library documents:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend server. Please ensure the backend is running on http://localhost:8000');
      }
      throw error;
    }
  }

  async getPersonas(): Promise<string[]> {
    try {
      console.log('Fetching personas...');
      const response = await fetch(`${this.baseUrl}/library/personas`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Personas fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch personas: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Personas response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching personas:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend server. Please ensure the backend is running on http://localhost:8000');
      }
      throw error;
    }
  }

  async getJobs(): Promise<string[]> {
    try {
      console.log('Fetching jobs...');
      const response = await fetch(`${this.baseUrl}/library/jobs`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jobs fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch jobs: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Jobs response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend server. Please ensure the backend is running on http://localhost:8000');
      }
      throw error;
    }
  }

  async getCrossConnections(docId: string): Promise<CrossConnectionsResponse> {
    const response = await fetch(`${this.baseUrl}/documents/${docId}/cross-connections`, {
      method: 'POST',
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

export const apiService = new ApiService();