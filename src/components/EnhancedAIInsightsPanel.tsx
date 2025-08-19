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

interface EnhancedAIInsightsPanelProps {
  documentIds?: string[];
  documentId?: string;
  persona?: string;
  jobToBeDone?: string;
  currentText?: string;
  onPageNavigate?: (page: number) => void;
}

interface DocumentSnippet {
  snippet: string;
  key_points: string[];
}

interface KeyInsight {
  insight: string;
  importance: 'high' | 'medium' | 'low';
  page_reference?: number;
}

interface ThoughtfulQuestion {
  question: string;
  type: 'analytical' | 'strategic' | 'practical' | 'critical';
  follow_up_prompts: string[];
}

interface RelatedConnections {
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
}

interface DidYouKnowFact {
  fact: string;
  source_type: 'research' | 'statistic' | 'historical' | 'trending';
  relevance_explanation: string;
}

interface StrategicAction {
  title: string;
  description: string;
  type: 'immediate' | 'research' | 'implement' | 'review' | 'connect';
  priority: 'high' | 'medium' | 'low';
  estimated_time: string;
  effort?: 'low' | 'medium' | 'high';
  page_reference?: number;
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

export function EnhancedAIInsightsPanel({ 
  documentIds = [], 
  documentId, 
  persona: propPersona, 
  jobToBeDone: propJobToBeDone, 
  currentText, 
  onPageNavigate 
}: EnhancedAIInsightsPanelProps) {
  const [persona, setPersona] = useState(propPersona || '');
  const [jobToBeDone, setJobToBeDone] = useState(propJobToBeDone || '');
  const [documentSnippet, setDocumentSnippet] = useState<DocumentSnippet | null>(null);
  const [keyInsights, setKeyInsights] = useState<KeyInsight[]>([]);
  const [thoughtfulQuestions, setThoughtfulQuestions] = useState<ThoughtfulQuestion[]>([]);
  const [relatedConnections, setRelatedConnections] = useState<RelatedConnections | null>(null);
  const [didYouKnowFacts, setDidYouKnowFacts] = useState<DidYouKnowFact[]>([]);
  const [strategicActions, setStrategicActions] = useState<StrategicAction[]>([]);
  
  const [isGeneratingSnippet, setIsGeneratingSnippet] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingRelated, setIsGeneratingRelated] = useState(false);
  const [isGeneratingFacts, setIsGeneratingFacts] = useState(false);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['snippet']));
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const { toast } = useToast();

  // Use all document IDs if available, otherwise fall back to single document
  const allDocumentIds = documentIds.length > 0 ? documentIds : (documentId ? [documentId] : []);

  // Update persona and job when props change
  useEffect(() => {
    if (propPersona) setPersona(propPersona);
    if (propJobToBeDone) setJobToBeDone(propJobToBeDone);
  }, [propPersona, propJobToBeDone]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleGenerateSnippet = async () => {
    if (!currentText || !persona || !jobToBeDone) {
      toast({
        title: "Missing information",
        description: "Please ensure there's content to analyze and persona/job are set.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingSnippet(true);
    try {
      const snippetData = await apiService.generateDocumentSnippet(
        currentText,
        persona,
        jobToBeDone,
        documentId
      );
      
      setDocumentSnippet(snippetData);
      
      toast({
        title: "Snippet generated",
        description: "Document snippet has been created successfully."
      });
      
    } catch (error) {
      console.error('Failed to generate snippet:', error);
      toast({
        title: "Failed to generate snippet",
        description: "Unable to create document snippet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSnippet(false);
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
      const insights = await apiService.generateKeyInsights(
        currentText,
        persona,
        jobToBeDone,
        documentId
      );
      
      setKeyInsights(insights);
      
      toast({
        title: "Key insights generated",
        description: `Generated ${insights.length} important insights from the document.`
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
      const questions = await apiService.generateThoughtfulQuestions(
        currentText,
        persona,
        jobToBeDone,
        documentId
      );
      
      setThoughtfulQuestions(questions);
      
      toast({
        title: "Thoughtful questions generated",
        description: `Generated ${questions.length} interactive questions for deeper analysis.`
      });
      
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast({
        title: "Failed to generate questions",
        description: "Unable to create thoughtful questions. Please try again.",
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
      const connections = await apiService.generateRelatedConnections(
        currentText,
        allDocumentIds,
        persona,
        jobToBeDone
      );
      
      setRelatedConnections(connections);
      
      toast({
        title: "Related connections found",
        description: `Found ${connections.document_connections.length} document connections and ${connections.external_links.length} external resources.`
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

  const handleGenerateDidYouKnowFacts = async () => {
    if (!currentText || !persona || !jobToBeDone) {
      toast({
        title: "Missing information",
        description: "Please ensure there's content to analyze and persona/job are set.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingFacts(true);
    try {
      const facts = await apiService.generateDidYouKnowFacts(
        currentText,
        persona,
        jobToBeDone
      );
      
      setDidYouKnowFacts(facts);
      
      toast({
        title: "Interesting facts generated",
        description: `Generated ${facts.length} fascinating facts from the internet.`
      });
      
    } catch (error) {
      console.error('Failed to generate facts:', error);
      toast({
        title: "Failed to generate facts",
        description: "Unable to fetch interesting facts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFacts(false);
    }
  };

  const handleGenerateStrategicActions = async () => {
    if (!currentText || !persona || !jobToBeDone) {
      toast({
        title: "Missing information",
        description: "Please ensure there's content to analyze and persona/job are set.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingActions(true);
    try {
      const strategicInsights = await apiService.generateStrategicInsights(
        currentText,
        persona,
        jobToBeDone,
        documentId
      );
      
      // Convert strategic insights to action items
      const actions: StrategicAction[] = [];
      
      // Add opportunities as immediate actions
      strategicInsights.opportunities?.forEach((opp, index) => {
        actions.push({
          title: `Opportunity: ${opp.insight.substring(0, 50)}${opp.insight.length > 50 ? '...' : ''}`,
          description: opp.insight,
          type: opp.timeframe === 'immediate' ? 'immediate' : 'implement',
          priority: opp.priority,
          estimated_time: opp.timeframe === 'immediate' ? '5-10 minutes' : '15-30 minutes'
        });
      });

      // Add action items
      strategicInsights.action_items?.forEach((action, index) => {
        actions.push({
          title: `Action: ${action.action.substring(0, 50)}${action.action.length > 50 ? '...' : ''}`,
          description: action.action,
          type: 'implement',
          priority: action.priority,
          estimated_time: action.effort === 'low' ? '5-10 minutes' : action.effort === 'medium' ? '15-25 minutes' : '30+ minutes',
          effort: action.effort
        });
      });

      // Add knowledge gaps as research actions
      strategicInsights.knowledge_gaps?.forEach((gap, index) => {
        actions.push({
          title: `Research: ${gap.gap.substring(0, 50)}${gap.gap.length > 50 ? '...' : ''}`,
          description: gap.gap,
          type: 'research',
          priority: gap.importance,
          estimated_time: '10-20 minutes'
        });
      });

      // Add critical decisions as review actions
      strategicInsights.critical_decisions?.forEach((decision, index) => {
        actions.push({
          title: `Decision: ${decision.decision.substring(0, 50)}${decision.decision.length > 50 ? '...' : ''}`,
          description: `${decision.decision} Consider factors: ${decision.factors.join(', ')}`,
          type: 'review',
          priority: decision.urgency,
          estimated_time: '15-30 minutes'
        });
      });
      
      setStrategicActions(actions);
      
      toast({
        title: "Strategic actions generated",
        description: `Generated ${actions.length} actionable recommendations based on your role.`
      });
      
    } catch (error) {
      console.error('Failed to generate strategic actions:', error);
      toast({
        title: "Failed to generate actions",
        description: "Unable to create strategic actions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingActions(false);
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
      case 'strategic': return <Target className="h-4 w-4 text-purple-600" />;
      case 'practical': return <Zap className="h-4 w-4 text-green-600" />;
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'research': return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'statistic': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'historical': return <Clock className="h-4 w-4 text-amber-600" />;
      case 'trending': return <Sparkles className="h-4 w-4 text-purple-600" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'immediate': return <Zap className="h-4 w-4 text-orange-600" />;
      case 'research': return <Search className="h-4 w-4 text-blue-600" />;
      case 'implement': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'review': return <AlertCircle className="h-4 w-4 text-purple-600" />;
      case 'connect': return <Link2 className="h-4 w-4 text-teal-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
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
                        <h4 className="font-medium text-foreground">Document Snippet</h4>
                        <p className="text-sm text-muted-foreground">Concise summary of the entire document</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Key Insights</h4>
                        <p className="text-sm text-muted-foreground">Important information across the document</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-secondary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Thoughtful Questions</h4>
                        <p className="text-sm text-muted-foreground">Interactive prompts for deeper analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Link2 className="h-5 w-5 text-accent-foreground mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Related Content</h4>
                        <p className="text-sm text-muted-foreground">Document connections and external resources</p>
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
          <Tabs defaultValue="snippet" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-background/60 backdrop-blur-sm border border-border">
              <TabsTrigger value="snippet" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Key Insights
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Questions
              </TabsTrigger>
              <TabsTrigger value="related" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Related
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Actions
              </TabsTrigger>
            </TabsList>

            {/* Document Summary Tab */}
            <TabsContent value="snippet" className="space-y-6 mt-6">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <FileText className="h-5 w-5" />
                    Document Summary
                  </CardTitle>
                  <p className="text-sm text-blue-700">
                    Get a comprehensive summary of the document tailored to your role
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateSnippet}
                    disabled={isGeneratingSnippet || !persona || !jobToBeDone}
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 font-semibold"
                  >
                    {isGeneratingSnippet ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating Snippet...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generate Document Summary
                      </>
                    )}
                  </Button>

                  {/* Generated Snippet */}
                  {documentSnippet && (
                    <div className="mt-6 space-y-4">
                      <Card className="p-4 bg-white/80 border border-blue-200">
                        <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Document Summary
                        </h5>
                        <p className="text-sm text-gray-700 leading-relaxed mb-4 bg-blue-50/50 p-3 rounded border-l-2 border-l-blue-300">
                          {documentSnippet.snippet}
                        </p>
                        
                        {documentSnippet.key_points.length > 0 && (
                          <div className="space-y-2">
                            <h6 className="text-xs font-semibold text-gray-700">Key Points:</h6>
                            <ul className="space-y-1">
                              {documentSnippet.key_points.map((point, index) => (
                                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                  <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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
                    Extract important information and explanations from the document content
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
                                <Lightbulb className="h-4 w-4 text-primary" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-1 font-medium ${getImportanceColor(insight.importance)}`}
                                  >
                                    {insight.importance.toUpperCase()} IMPORTANCE
                                  </Badge>
                                  
                                  {insight.page_reference && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                                      <ExternalLink className="h-3 w-3" />
                                      Page {insight.page_reference}
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-700 leading-relaxed bg-white/50 p-3 rounded border-l-2 border-l-yellow-300">
                                  {insight.insight}
                                </p>
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

            {/* Thoughtful Questions Tab */}
            <TabsContent value="questions" className="space-y-6 mt-6">
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <MessageCircle className="h-5 w-5" />
                    Thoughtful Questions
                  </CardTitle>
                  <p className="text-sm text-purple-700">
                    Insightful questions based on your persona to guide deeper research
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
                        Generate Thoughtful Questions
                      </>
                    )}
                  </Button>

                  {/* Generated Questions */}
                  {thoughtfulQuestions.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg border border-purple-200">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <MessageCircle className="h-3 w-3 text-purple-600" />
                          Interactive Questions
                        </h4>
                        <Badge variant="secondary" className="text-xs font-medium bg-purple-100 text-purple-800 border-purple-200">
                          {thoughtfulQuestions.length} questions
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {thoughtfulQuestions.map((questionObj, index) => (
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
                                      {questionObj.type.toUpperCase()}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm font-medium text-gray-900 mb-3">
                                    {questionObj.question}
                                  </p>
                                  
                                  {questionObj.follow_up_prompts.length > 0 && (
                                    <Collapsible>
                                      <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:bg-purple-50 p-1 h-auto">
                                          <ChevronRight className="h-3 w-3 mr-1" />
                                          View Follow-up Prompts
                                        </Button>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent className="mt-2 space-y-1">
                                        {questionObj.follow_up_prompts.map((prompt, promptIndex) => (
                                          <div key={promptIndex} className="text-xs text-gray-600 bg-purple-50/50 p-2 rounded border-l-2 border-l-purple-300">
                                            • {prompt}
                                          </div>
                                        ))}
                                      </CollapsibleContent>
                                    </Collapsible>
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
                    Connections from documents in your library and relevant web resources
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

                      {/* External Links */}
                      {relatedConnections.external_links.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-green-200">
                            <Globe className="h-4 w-4 text-green-600" />
                            <h4 className="text-sm font-semibold text-gray-900">External Resources</h4>
                            <Badge variant="secondary" className="text-xs font-medium bg-green-100 text-green-800 border-green-200">
                              {relatedConnections.external_links.length} links
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {relatedConnections.external_links.map((link, index) => (
                              <Card key={index} className="p-4 bg-white/80 border border-green-200 rounded-lg">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-semibold text-gray-900">{link.title}</h5>
                                    <div className="flex items-center gap-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-600">
                                        {Math.round(link.relevance_score * 100)}% relevance
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 bg-green-50/50 p-2 rounded border-l-2 border-l-green-300">
                                    {link.description}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-green-600 hover:bg-green-50 p-1 h-auto"
                                    onClick={() => window.open(link.url, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Visit Link
                                  </Button>
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

            {/* Strategic Actions Tab */}
            <TabsContent value="actions" className="space-y-6 mt-6">
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-900">
                    <Target className="h-5 w-5" />
                    Strategic Actions
                  </CardTitle>
                  <p className="text-sm text-emerald-700">
                    Actionable recommendations based on your role and objectives
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateStrategicActions}
                    disabled={isGeneratingActions || !persona || !jobToBeDone}
                    className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3 font-semibold"
                  >
                    {isGeneratingActions ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating Actions...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4" />
                        Generate Strategic Actions
                      </>
                    )}
                  </Button>

                  {/* Generated Actions */}
                  {strategicActions.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between bg-white/60 p-3 rounded-lg border border-emerald-200">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Target className="h-3 w-3 text-emerald-600" />
                          Action Items
                        </h4>
                        <Badge variant="secondary" className="text-xs font-medium bg-emerald-100 text-emerald-800 border-emerald-200">
                          {strategicActions.length} actions
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {strategicActions.map((action, index) => (
                          <Card
                            key={index}
                            className="p-4 bg-white/80 border border-emerald-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                            onClick={() => {
                              if (action.page_reference) {
                                onPageNavigate?.(action.page_reference);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5 p-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg group-hover:from-emerald-200 group-hover:to-teal-200 transition-colors">
                                {getActionTypeIcon(action.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-1 font-medium ${getActionPriorityColor(action.priority)}`}
                                  >
                                    {action.priority.toUpperCase()} PRIORITY
                                  </Badge>
                                  
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs px-2 py-1 font-medium bg-emerald-50 border-emerald-200 text-emerald-800"
                                  >
                                    {action.type.toUpperCase()}
                                  </Badge>

                                  {action.page_reference && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-emerald-100 px-2 py-1 rounded">
                                      <ExternalLink className="h-3 w-3" />
                                      Page {action.page_reference}
                                    </div>
                                  )}
                                </div>
                                
                                <h5 className="text-sm font-semibold text-gray-900 mb-2">
                                  {action.title}
                                </h5>
                                
                                <p className="text-sm text-gray-700 leading-relaxed mb-3 bg-emerald-50/50 p-3 rounded border-l-2 border-l-emerald-300">
                                  {action.description}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {action.estimated_time}
                                  </div>
                                  {action.effort && (
                                    <div className="flex items-center gap-1">
                                      <Zap className="h-3 w-3" />
                                      {action.effort} effort
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
          </Tabs>

          {/* Placeholder when no content */}
          {!documentSnippet && keyInsights.length === 0 && thoughtfulQuestions.length === 0 && 
           !relatedConnections && strategicActions.length === 0 && 
           !isGeneratingSnippet && !isGeneratingInsights && !isGeneratingQuestions && 
           !isGeneratingRelated && !isGeneratingActions && (
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
                    Get summaries, insights, questions, connections, and strategic actions
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ArrowRight className="h-3 w-3" />
                  <span>Summary • Key Insights • Questions • Related • Actions</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}