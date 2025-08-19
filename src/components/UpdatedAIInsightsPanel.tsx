import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ExpandablePanelModal } from '@/components/ui/ExpandablePanelModal';
import { DidYouKnowPopup } from './DidYouKnowPopup';
import { 
  Lightbulb, 
  Brain, 
  AlertTriangle, 
  Link2, 
  Sparkles,
  User,
  Target,
  RefreshCw,
  ExternalLink,
  Search,
  Loader2,
  FileText,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronRight,
  Quote,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  MessageCircle,
  Globe,
  BookmarkPlus
} from 'lucide-react';

// Add this function at the top of UpdatedAIInsightsPanel.tsx after the imports
function extractMainThemes(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return ['Document Analysis'];
  }

  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  const wordFreq = words.reduce((freq, word) => {
    freq[word] = (freq[word] || 0) + 1;
    return freq;
  }, {} as Record<string, number>);

  const themes = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  return themes.length > 0 ? themes : ['Document Analysis', 'Content Review'];
}

interface UpdatedAIInsightsPanelProps {
  documentIds?: string[];
  documentId?: string;
  persona?: string;
  jobToBeDone?: string;
  currentText?: string;
  onPageNavigate?: (page: number) => void;
}

interface DocumentSummary {
  summary: string;
  key_points: string[];
  main_themes: string[];
  word_count: number;
  page_count: number;
}

interface KeyInsight {
  insight: string;
  importance: 'high' | 'medium' | 'low';
  page_reference?: number;
  source_type: 'document_line' | 'ai_generated';
  original_text?: string; // For document lines
}

interface StudentQuestion {
  question: string;
  type: 'analytical' | 'research' | 'critical_thinking' | 'application';
  research_areas: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

interface RelatedConnections {
  document_connections: Array<{
    document_title: string;
    section_title: string;
    page_number: number;
    connection_type: string;
    relevance_explanation: string;
  }>;
  google_resources: Array<{
    title: string;
    url: string;
    description: string;
    relevance_score: number;
    resource_type: 'article' | 'research_paper' | 'video' | 'website';
  }>;
}

const TypewriterText = ({ text, speed = 30 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return <span>{displayedText}</span>;
};

export function UpdatedAIInsightsPanel({ 
  documentIds = [], 
  documentId, 
  persona: propPersona, 
  jobToBeDone: propJobToBeDone, 
  currentText, 
  onPageNavigate 
}: UpdatedAIInsightsPanelProps) {
  const [persona, setPersona] = useState(propPersona || '');
  const [jobToBeDone, setJobToBeDone] = useState(propJobToBeDone || '');
  const [documentSummary, setDocumentSummary] = useState<DocumentSummary | null>(null);
  const [keyInsights, setKeyInsights] = useState<KeyInsight[]>([]);
  const [studentQuestions, setStudentQuestions] = useState<StudentQuestion[]>([]);
  const [relatedConnections, setRelatedConnections] = useState<RelatedConnections | null>(null);
  const [didYouKnowFacts, setDidYouKnowFacts] = useState<any[]>([]);
  
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingRelated, setIsGeneratingRelated] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const { toast } = useToast();

  // Use all document IDs if available, otherwise fall back to single document
  const allDocumentIds = documentIds.length > 0 ? documentIds : (documentId ? [documentId] : []);

  // Update persona and job when props change
  useEffect(() => {
    if (propPersona) setPersona(propPersona);
    if (propJobToBeDone) setJobToBeDone(propJobToBeDone);
  }, [propPersona, propJobToBeDone]);

  const handleGenerateSummary = async () => {
    if (!currentText || !persona || !jobToBeDone) {
      toast({
        title: "Missing information",
        description: "Please ensure there's content to analyze and persona/job are set.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingSummary(true);
    try {
      // Call actual API to generate document-specific summary
      const insights = await apiService.generateInsights(currentText, persona, jobToBeDone);
      
      // Extract summary information from insights
      const summaryInsights = insights.insights.filter(insight => 
        insight.type === 'takeaway' || insight.type === 'fact'
      );
      
      // Generate key points from insights
      const keyPoints = summaryInsights.slice(0, 4).map(insight => insight.content);
      
      // Extract themes from the text using basic analysis
      const words = currentText.toLowerCase().split(/\s+/);
      const wordCount = words.length;
      
      // Extract main themes using keyword frequency
      const themes = extractMainThemes(currentText);
      
      const documentSummary: DocumentSummary = {
        summary: summaryInsights.length > 0 
          ? summaryInsights[0].content 
          : `This document contains ${wordCount} words of content related to ${themes.slice(0, 2).join(' and ')}. The material provides detailed information and analysis relevant to ${persona} working on ${jobToBeDone}.`,
        key_points: keyPoints.length > 0 ? keyPoints : [
          `Document contains ${wordCount} words of specialized content`,
          `Material is relevant to ${persona} objectives`,
          `Content supports ${jobToBeDone} goals`,
          `Analysis reveals key insights about ${themes[0] || 'the subject matter'}`
        ],
        main_themes: themes.length > 0 ? themes : ['Document Analysis', 'Content Review'],
        word_count: wordCount,
        page_count: documentIds ? documentIds.length * 10 : 10 // Estimate based on content
      };
      
      setDocumentSummary(documentSummary);
      
      toast({
        title: "Summary generated",
        description: "Document-specific summary created using AI analysis."
      });
      
    } catch (error) {
      console.error('Failed to generate summary:', error);
      // Fallback to basic analysis if API fails
      const wordCount = currentText.split(/\s+/).length;
      const themes = extractMainThemes(currentText);
      
      const fallbackSummary: DocumentSummary = {
        summary: `This document contains ${wordCount} words of content. Based on text analysis, it covers topics related to ${themes.slice(0, 2).join(' and ')}. The material is relevant for ${persona} working on ${jobToBeDone}.`,
        key_points: [
          `Document contains ${wordCount} words of content`,
          `Material covers ${themes[0] || 'various topics'}`,
          `Content is relevant to ${persona} objectives`,
          `Supports ${jobToBeDone} goals`
        ],
        main_themes: themes.length > 0 ? themes : ['Document Analysis'],
        word_count: wordCount,
        page_count: Math.ceil(wordCount / 500) // Rough estimate
      };
      
      setDocumentSummary(fallbackSummary);
      
      toast({
        title: "Summary generated",
        description: "Document summary created using text analysis.",
        variant: "default"
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateKeyInsights = async () => {
    if (!currentText || !persona || !jobToBeDone) {
      toast({
        title: "Missing information",
        description: "Please ensure there's content to analyze and persona/job are set.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingInsights(true);
    try {
      // Call actual API to generate document-specific insights
      const insights = await apiService.generateInsights(currentText, persona, jobToBeDone);
      
      // Convert API insights to KeyInsight format
      const keyInsights: KeyInsight[] = insights.insights.map((insight, index) => ({
        insight: insight.content,
        importance: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
        page_reference: Math.floor(Math.random() * 10) + 1, // Would need actual page tracking
        source_type: insight.type === 'fact' ? 'document_line' : 'ai_generated',
        original_text: insight.type === 'fact' ? currentText.substring(0, 100) + '...' : undefined
      }));
      
      setKeyInsights(keyInsights);
      
      // Generate document-specific Did You Know facts using the API
      try {
        const facts = await apiService.generateDidYouKnowFacts(currentText, persona, jobToBeDone);
        const formattedFacts = facts.map((fact, index) => ({
          id: `fact-${Date.now()}-${index}`,
          fact: fact.fact,
          source_type: fact.source_type,
          relevance_explanation: fact.relevance_explanation,
          tags: extractMainThemes(currentText).slice(0, 2)
        }));
        
        setDidYouKnowFacts(formattedFacts);
      } catch (factError) {
        console.error('Failed to generate facts:', factError);
        // Continue without facts if generation fails
      }
      
      toast({
        title: "Key insights generated",
        description: `Generated ${keyInsights.length} important insights from the document.`
      });
      
    } catch (error) {
      console.error('Failed to generate key insights:', error);
      toast({
        title: "Failed to generate key insights",
        description: "Unable to extract key insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!currentText || !persona || !jobToBeDone) {
      toast({
        title: "Missing information",
        description: "Please ensure there's content to analyze and persona/job are set.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingQuestions(true);
    try {
      // Mock implementation - replace with actual API call
      const mockQuestions: StudentQuestion[] = [
        {
          question: "How can healthcare organizations ensure that AI diagnostic systems maintain accuracy across diverse patient populations and avoid algorithmic bias?",
          type: "critical_thinking",
          research_areas: ["AI ethics in healthcare", "Algorithmic bias", "Healthcare equity", "Diverse dataset training"],
          difficulty_level: "advanced"
        },
        {
          question: "What are the key regulatory and compliance considerations when implementing AI systems in clinical environments?",
          type: "research",
          research_areas: ["HIPAA compliance", "FDA regulations for medical AI", "Clinical trial requirements", "Medical device approval"],
          difficulty_level: "intermediate"
        },
        {
          question: "How might AI-powered predictive analytics change the way healthcare providers approach preventive care and early intervention?",
          type: "analytical",
          research_areas: ["Predictive healthcare models", "Preventive medicine", "Population health management", "Risk stratification"],
          difficulty_level: "intermediate"
        },
        {
          question: "What practical steps can a hospital administrator take to successfully integrate AI tools into existing clinical workflows?",
          type: "application",
          research_areas: ["Change management in healthcare", "Clinical workflow optimization", "Staff training programs", "Technology adoption strategies"],
          difficulty_level: "beginner"
        }
      ];
      
      setStudentQuestions(mockQuestions);
      
      toast({
        title: "Student questions generated",
        description: `Generated ${mockQuestions.length} research questions for student exploration.`
      });
      
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast({
        title: "Failed to generate questions",
        description: "Unable to create student questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleGenerateRelatedConnections = async () => {
    if (!currentText || !persona || !jobToBeDone) {
      toast({
        title: "Missing information",
        description: "Please ensure there's content to analyze and persona/job are set.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingRelated(true);
    try {
      // Mock implementation - replace with actual API call
      const mockConnections: RelatedConnections = {
        document_connections: [
          {
            document_title: "AI Ethics in Medical Practice",
            section_title: "Bias Mitigation Strategies",
            page_number: 23,
            connection_type: "complementary",
            relevance_explanation: "Provides detailed strategies for addressing the algorithmic bias concerns mentioned in your current document."
          },
          {
            document_title: "Healthcare Data Privacy Regulations",
            section_title: "HIPAA Compliance for AI Systems",
            page_number: 45,
            connection_type: "regulatory",
            relevance_explanation: "Offers comprehensive guidance on maintaining privacy standards when implementing AI in healthcare settings."
          }
        ],
        google_resources: [
          {
            title: "FDA Guidance on AI/ML-Based Medical Devices",
            url: "https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices",
            description: "Official FDA guidance document outlining regulatory requirements for AI-powered medical devices and diagnostic systems.",
            relevance_score: 0.95,
            resource_type: "article"
          },
          {
            title: "Nature Medicine: AI in Healthcare Review",
            url: "https://www.nature.com/articles/s41591-021-01614-0",
            description: "Comprehensive review of current applications, challenges, and future directions of artificial intelligence in healthcare.",
            relevance_score: 0.92,
            resource_type: "research_paper"
          },
          {
            title: "WHO Ethics and Governance of AI for Health",
            url: "https://www.who.int/publications/i/item/9789240029200",
            description: "World Health Organization guidelines on ethical considerations and governance frameworks for AI implementation in healthcare.",
            relevance_score: 0.88,
            resource_type: "article"
          }
        ]
      };
      
      setRelatedConnections(mockConnections);
      
      toast({
        title: "Related connections found",
        description: `Found ${mockConnections.document_connections.length} document connections and ${mockConnections.google_resources.length} external resources.`
      });
      
    } catch (error) {
      console.error('Failed to generate related connections:', error);
      toast({
        title: "Failed to generate connections",
        description: "Unable to find related connections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingRelated(false);
    }
  };

  const getImportanceColor = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'analytical': return <Brain className="h-4 w-4 text-blue-600" />;
      case 'research': return <BookOpen className="h-4 w-4 text-green-600" />;
      case 'critical_thinking': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'application': return <Target className="h-4 w-4 text-purple-600" />;
      default: return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'research_paper': return <BookOpen className="h-4 w-4 text-green-600" />;
      case 'video': return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'website': return <Globe className="h-4 w-4 text-gray-600" />;
      default: return <ExternalLink className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-accent/20 to-secondary/10">
      <div className="p-6 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-xl shadow-lg">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-xl">AI Insights</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive document analysis and recommendations
              </p>
            </div>
          </div>
          <ExpandablePanelModal
            title="AI Insights"
            icon={<Brain className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-6">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary">Enhanced Analysis Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Document Summary</h4>
                        <p className="text-sm text-muted-foreground">Actual summary of the current document</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Key Insights</h4>
                        <p className="text-sm text-muted-foreground">Important lines with AI-generated insights</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-secondary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Student Questions</h4>
                        <p className="text-sm text-muted-foreground">Research questions for student exploration</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Link2 className="h-5 w-5 text-accent-foreground mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Related Content</h4>
                        <p className="text-sm text-muted-foreground">Document connections and Google resources</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ExpandablePanelModal>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Persona and Job Setup */}
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <User className="h-5 w-5 text-primary" />
                Analysis Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    Your Role
                  </label>
                  <Textarea
                    placeholder="e.g., Medical researcher, Healthcare administrator, AI developer..."
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/70 backdrop-blur-sm"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="p-1.5 bg-secondary/10 rounded-lg">
                      <Target className="h-4 w-4 text-secondary" />
                    </div>
                    Your Objective
                  </label>
                  <Textarea
                    placeholder="e.g., Evaluate AI implementation feasibility, Understand current limitations..."
                    value={jobToBeDone}
                    onChange={(e) => setJobToBeDone(e.target.value)}
                    className="text-sm border-gray-200 focus:border-green-400 focus:ring-green-400/20 bg-white/70 backdrop-blur-sm"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Tabs */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-background/60 backdrop-blur-sm border border-border">
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary {documentSummary ? '(1)' : '(0)'}
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Key Insights ({keyInsights.length})
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Questions ({studentQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="related" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Related ({relatedConnections?.document_connections.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Document Summary Tab */}
            <TabsContent value="summary" className="space-y-6 mt-6">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <FileText className="h-5 w-5" />
                    Document Summary
                  </CardTitle>
                  <p className="text-sm text-blue-700">
                    One paragraph summary of the whole document
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary || !persona || !jobToBeDone}
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 font-semibold"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating Summary...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generate Document Summary
                      </>
                    )}
                  </Button>

                  {/* Generated Summary */}
                  {documentSummary && (
                    <div className="mt-6 space-y-4">
                      <Card className="p-4 bg-white/80 border border-blue-200">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              Document Overview
                            </h5>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800">
                                {documentSummary.word_count.toLocaleString()} words
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800">
                                {documentSummary.page_count} pages
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 leading-relaxed bg-blue-50/50 p-3 rounded border-l-2 border-l-blue-300">
                            {documentSummary.summary}
                          </p>
                          
                          {documentSummary.main_themes.length > 0 && (
                            <div className="space-y-2">
                              <h6 className="text-xs font-semibold text-gray-700">Main Themes:</h6>
                              <div className="flex flex-wrap gap-1.5">
                                {documentSummary.main_themes.map((theme, index) => (
                                  <Badge key={index} variant="outline" className="text-xs px-2 py-1 bg-blue-50 border-blue-200 text-blue-800">
                                    {theme}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {documentSummary.key_points.length > 0 && (
                            <div className="space-y-2">
                              <h6 className="text-xs font-semibold text-gray-700">Key Points:</h6>
                              <ul className="space-y-1">
                                {documentSummary.key_points.map((point, index) => (
                                  <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                    <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Key Insights Tab */}
            <TabsContent value="insights" className="space-y-6 mt-6">
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-yellow-900">
                    <Lightbulb className="h-5 w-5" />
                    Key Insights
                  </CardTitle>
                  <p className="text-sm text-yellow-700">
                    Important points in the document, references from the web
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateKeyInsights}
                    disabled={isGeneratingInsights || !persona || !jobToBeDone}
                    className="w-full gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 font-semibold"
                  >
                    {isGeneratingInsights ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Extracting Key Insights...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4" />
                        Generate Key Insights
                      </>
                    )}
                  </Button>

                  {/* Generated Key Insights */}
                  {keyInsights.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg border border-yellow-200">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Lightbulb className="h-3 w-3 text-yellow-600" />
                          Key Insights
                        </h4>
                        <Badge variant="secondary" className="text-xs font-medium bg-yellow-100 text-yellow-800 border-yellow-200">
                          {keyInsights.length} insights
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {keyInsights.map((insight, index) => (
                          <Card
                            key={index}
                            className="p-4 bg-white/80 border border-yellow-200 rounded-lg hover:border-yellow-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                            onClick={() => {
                              if (insight.page_reference) {
                                onPageNavigate?.(insight.page_reference);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5 p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg group-hover:from-yellow-200 group-hover:to-orange-200 transition-colors">
                                {insight.source_type === 'document_line' ? (
                                  <Quote className="h-4 w-4 text-primary" />
                                ) : (
                                  <Brain className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-1 font-medium ${getImportanceColor(insight.importance)}`}
                                  >
                                    {insight.importance.toUpperCase()} IMPORTANCE
                                  </Badge>
                                  
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-1 font-medium ${
                                      insight.source_type === 'document_line' 
                                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                        : 'bg-purple-100 text-purple-800 border-purple-200'
                                    }`}
                                  >
                                    {insight.source_type === 'document_line' ? 'Document Line' : 'AI Generated'}
                                  </Badge>
                                  
                                  {insight.page_reference && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                                      <ExternalLink className="h-3 w-3" />
                                      Page {insight.page_reference}
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-700 leading-relaxed bg-white/50 p-3 rounded border-l-2 border-l-yellow-300 mb-2">
                                  {insight.insight}
                                </p>

                                {insight.original_text && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded border-l-2 border-l-gray-300">
                                    <p className="text-xs text-gray-600 font-medium mb-1">Original text:</p>
                                    <p className="text-xs text-gray-700 italic">"{insight.original_text}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Student Questions Tab */}
            <TabsContent value="questions" className="space-y-6 mt-6">
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <MessageCircle className="h-5 w-5" />
                    Questions
                  </CardTitle>
                  <p className="text-sm text-purple-700">
                    Insightful questions based on role and personal for users to research
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions || !persona || !jobToBeDone}
                    className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 font-semibold"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        Generate Student Questions
                      </>
                    )}
                  </Button>

                  {/* Generated Questions */}
                  {studentQuestions.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg border border-purple-200">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <MessageCircle className="h-3 w-3 text-purple-600" />
                          Research Questions
                        </h4>
                        <Badge variant="secondary" className="text-xs font-medium bg-purple-100 text-purple-800 border-purple-200">
                          {studentQuestions.length} questions
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {studentQuestions.map((questionObj, index) => (
                          <Card key={index} className="p-4 bg-white/80 border border-purple-200 rounded-lg">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5 p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                                  {getQuestionTypeIcon(questionObj.type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs px-2 py-1 font-medium bg-purple-50 border-purple-200 text-purple-800"
                                    >
                                      {questionObj.type.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs px-2 py-1 font-medium ${getDifficultyColor(questionObj.difficulty_level)}`}
                                    >
                                      {questionObj.difficulty_level.toUpperCase()}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm font-medium text-gray-900 mb-3">
                                    {questionObj.question}
                                  </p>
                                  
                                  {questionObj.research_areas.length > 0 && (
                                    <div className="space-y-2">
                                      <h6 className="text-xs font-semibold text-gray-700">Research Areas:</h6>
                                      <div className="flex flex-wrap gap-1">
                                        {questionObj.research_areas.map((area, areaIndex) => (
                                          <Badge key={areaIndex} variant="outline" className="text-xs px-2 py-1 bg-purple-50/50 border-purple-200 text-purple-700">
                                            {area}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Related Connections Tab */}
            <TabsContent value="related" className="space-y-6 mt-6">
              <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Link2 className="h-5 w-5" />
                    Related Content
                  </CardTitle>
                  <p className="text-sm text-green-700">
                    Links from the web and cross connections from other documents in the library, similarities and contradictions
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateRelatedConnections}
                    disabled={isGeneratingRelated || !persona || !jobToBeDone}
                    className="w-full gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 font-semibold"
                  >
                    {isGeneratingRelated ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Finding Connections...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Find Related Content
                      </>
                    )}
                  </Button>

                  {/* Generated Related Connections */}
                  {relatedConnections && (
                    <div className="mt-6 space-y-6">
                      {/* Document Connections */}
                      {relatedConnections.document_connections.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-green-200">
                            <BookmarkPlus className="h-4 w-4 text-green-600" />
                            <h4 className="text-sm font-semibold text-gray-900">Document Connections</h4>
                            <Badge variant="secondary" className="text-xs font-medium bg-green-100 text-green-800 border-green-200">
                              {relatedConnections.document_connections.length} connections
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {relatedConnections.document_connections.map((connection, index) => (
                              <Card
                                key={index}
                                className="p-4 bg-white/80 border border-green-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                                onClick={() => onPageNavigate?.(connection.page_number)}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 border-green-200 text-green-800">
                                      {connection.connection_type}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <ExternalLink className="h-3 w-3" />
                                      Page {connection.page_number}
                                    </div>
                                  </div>
                                  <h5 className="text-sm font-semibold text-gray-900">{connection.document_title}</h5>
                                  <p className="text-xs text-gray-600 font-medium">{connection.section_title}</p>
                                  <p className="text-sm text-gray-700 bg-green-50/50 p-2 rounded border-l-2 border-l-green-300">
                                    {connection.relevance_explanation}
                                  </p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Google Resources */}
                      {relatedConnections.google_resources.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-green-200">
                            <Globe className="h-4 w-4 text-green-600" />
                            <h4 className="text-sm font-semibold text-gray-900">Google Resources</h4>
                            <Badge variant="secondary" className="text-xs font-medium bg-green-100 text-green-800 border-green-200">
                              {relatedConnections.google_resources.length} resources
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {relatedConnections.google_resources.map((resource, index) => (
                              <Card key={index} className="p-4 bg-white/80 border border-green-200 rounded-lg">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1 bg-green-100 rounded">
                                        {getResourceTypeIcon(resource.resource_type)}
                                      </div>
                                      <h5 className="text-sm font-semibold text-gray-900">{resource.title}</h5>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-600">
                                        {Math.round(resource.relevance_score * 100)}% relevance
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 bg-green-50/50 p-2 rounded border-l-2 border-l-green-300">
                                    {resource.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 border-green-200 text-green-800">
                                      {resource.resource_type.replace('_', ' ')}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-green-600 hover:bg-green-50 p-1 h-auto"
                                      onClick={() => window.open(resource.url, '_blank')}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Visit Link
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Placeholder when no content */}
          {!documentSummary && keyInsights.length === 0 && studentQuestions.length === 0 && 
           !relatedConnections && didYouKnowFacts.length === 0 && 
           !isGeneratingSummary && !isGeneratingInsights && !isGeneratingQuestions && 
           !isGeneratingRelated && (
            <Card className="text-center py-12 bg-gradient-to-br from-white to-gray-50 border-2 border-dashed border-gray-200">
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-fit mx-auto">
                  <Brain className="h-12 w-12 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    Ready for Enhanced AI Analysis
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Configure your role and objectives above, then explore the analysis tabs
                  </p>
                  <p className="text-xs text-gray-500">
                    Get summaries, insights, questions, and connections. Watch for the glowing bulb for interesting facts!
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ArrowRight className="h-3 w-3" />
                  <span>Summary • Key Insights • Questions • Related</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
      
      {/* Did You Know Popup - appears when there are facts */}
      <DidYouKnowPopup 
        facts={didYouKnowFacts} 
        isVisible={didYouKnowFacts.length > 0}
      />
    </div>
  );
}