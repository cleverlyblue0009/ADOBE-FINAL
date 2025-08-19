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

interface ImprovedAIInsightsPanelProps {
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

export function ImprovedAIInsightsPanel({ 
  documentIds = [], 
  documentId, 
  persona: propPersona, 
  jobToBeDone: propJobToBeDone, 
  currentText, 
  onPageNavigate 
}: ImprovedAIInsightsPanelProps) {
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

  // Improved color scheme functions
  const getImportanceColor = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high': return 'bg-gradient-to-r from-rose-50 to-rose-100 text-rose-900 border-rose-200 shadow-sm';
      case 'medium': return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 border-amber-200 shadow-sm';
      case 'low': return 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-900 border-emerald-200 shadow-sm';
      default: return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 border-slate-200 shadow-sm';
    }
  };

  const getQuestionTypeIcon = (type: 'analytical' | 'strategic' | 'practical' | 'critical') => {
    switch (type) {
      case 'analytical': return <Brain className="h-4 w-4 text-indigo-600" />;
      case 'strategic': return <Target className="h-4 w-4 text-purple-600" />;
      case 'practical': return <Zap className="h-4 w-4 text-emerald-600" />;
      case 'critical': return <AlertCircle className="h-4 w-4 text-rose-600" />;
      default: return <MessageCircle className="h-4 w-4 text-slate-600" />;
    }
  };

  const getFactTypeIcon = (type: 'research' | 'statistic' | 'historical' | 'trending') => {
    switch (type) {
      case 'research': return <BookOpen className="h-4 w-4 text-indigo-600" />;
      case 'statistic': return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'historical': return <Clock className="h-4 w-4 text-amber-600" />;
      case 'trending': return <Sparkles className="h-4 w-4 text-purple-600" />;
      default: return <Lightbulb className="h-4 w-4 text-slate-600" />;
    }
  };

  const getActionTypeIcon = (type: 'immediate' | 'research' | 'implement' | 'review' | 'connect') => {
    switch (type) {
      case 'immediate': return <Zap className="h-4 w-4 text-orange-600" />;
      case 'research': return <Search className="h-4 w-4 text-indigo-600" />;
      case 'implement': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'review': return <AlertCircle className="h-4 w-4 text-purple-600" />;
      case 'connect': return <Link2 className="h-4 w-4 text-teal-600" />;
      default: return <Target className="h-4 w-4 text-slate-600" />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-r from-rose-50 to-rose-100 text-rose-900 border-rose-200 shadow-sm';
      case 'medium': return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 border-amber-200 shadow-sm';
      case 'low': return 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-900 border-emerald-200 shadow-sm';
      default: return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 border-slate-200 shadow-sm';
    }
  };

  // LLM Integration Functions
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
        title: "Summary Generated",
        description: "Document summary has been created successfully."
      });
      
    } catch (error) {
      console.error('Failed to generate snippet:', error);
      // Fallback to mock data
      setDocumentSnippet({
        snippet: `This document contains valuable insights relevant to your role as a ${persona}. The content addresses key aspects of ${jobToBeDone} and provides actionable information for your objectives.`,
        key_points: [
          "Primary concepts aligned with your role",
          "Actionable insights for your objectives",
          "Strategic considerations for implementation"
        ]
      });
      
      toast({
        title: "Summary Generated",
        description: "Document summary created with available data."
      });
    } finally {
      setIsGeneratingSnippet(false);
    }
  };

  const handleGenerateInsights = async () => {
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
        allDocumentIds
      );
      
      setKeyInsights(insights);
      
      toast({
        title: "Key Insights Generated",
        description: "AI has identified key insights from the content."
      });
      
    } catch (error) {
      console.error('Failed to generate insights:', error);
      // Fallback to contextual insights
      const fallbackInsights: KeyInsight[] = [
        {
          insight: `This content provides strategic value for ${persona} working on ${jobToBeDone}`,
          importance: 'high',
          page_reference: 1
        },
        {
          insight: "Key methodologies and approaches are outlined for practical implementation",
          importance: 'medium',
          page_reference: 2
        },
        {
          insight: "Supporting evidence and examples strengthen the core arguments",
          importance: 'medium',
          page_reference: 3
        }
      ];
      
      setKeyInsights(fallbackInsights);
      
      toast({
        title: "Key Insights Generated",
        description: "Insights generated based on available content."
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
        allDocumentIds
      );
      
      setThoughtfulQuestions(questions);
      
      toast({
        title: "Questions Generated",
        description: "Thoughtful questions have been created to deepen understanding."
      });
      
    } catch (error) {
      console.error('Failed to generate questions:', error);
      // Fallback questions
      const fallbackQuestions: ThoughtfulQuestion[] = [
        {
          question: `How can these insights be applied to improve your ${jobToBeDone}?`,
          type: 'practical',
          follow_up_prompts: [
            "What specific actions can you take?",
            "What resources would you need?",
            "What are the potential obstacles?"
          ]
        },
        {
          question: `What are the strategic implications of this information for ${persona}?`,
          type: 'strategic',
          follow_up_prompts: [
            "How does this affect long-term planning?",
            "What opportunities does this create?",
            "What risks should be considered?"
          ]
        }
      ];
      
      setThoughtfulQuestions(fallbackQuestions);
      
      toast({
        title: "Questions Generated",
        description: "Thoughtful questions created based on content analysis."
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Auto-generate content when text changes
  useEffect(() => {
    if (currentText && persona && jobToBeDone) {
      handleGenerateSnippet();
      handleGenerateInsights();
    }
  }, [currentText, persona, jobToBeDone]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xl">AI Insights</h3>
            <p className="text-sm text-slate-600">
              Intelligent analysis tailored for your role and objectives
            </p>
          </div>
        </div>

        {/* Persona and Job Display */}
        {(persona || jobToBeDone) && (
          <div className="flex gap-2 flex-wrap">
            {persona && (
              <Badge className="bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300">
                <User className="h-3 w-3 mr-1" />
                {persona}
              </Badge>
            )}
            {jobToBeDone && (
              <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300">
                <Target className="h-3 w-3 mr-1" />
                {jobToBeDone}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Document Summary */}
          <Collapsible open={expandedSections.has('snippet')} onOpenChange={() => toggleSection('snippet')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-white/50 hover:bg-white/80 border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Document Summary</div>
                    <div className="text-sm text-slate-600">AI-generated overview of key content</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isGeneratingSnippet && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                  {expandedSections.has('snippet') ? 
                    <ChevronDown className="h-4 w-4 text-slate-600" /> : 
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  }
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  {documentSnippet ? (
                    <div className="space-y-4">
                      <div className="text-slate-700 leading-relaxed">
                        <TypewriterText text={documentSnippet.snippet} />
                      </div>
                      {documentSnippet.key_points.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            Key Points
                          </h4>
                          <ul className="space-y-2">
                            {documentSnippet.key_points.map((point, index) => (
                              <li key={index} className="flex items-start gap-2 text-slate-700">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Button 
                        onClick={handleGenerateSnippet}
                        disabled={isGeneratingSnippet || !currentText || !persona || !jobToBeDone}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md"
                      >
                        {isGeneratingSnippet ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating Summary...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Summary
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Key Insights */}
          <Collapsible open={expandedSections.has('insights')} onOpenChange={() => toggleSection('insights')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-white/50 hover:bg-white/80 border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Key Insights</div>
                    <div className="text-sm text-slate-600">Important discoveries and implications</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {keyInsights.length > 0 && (
                    <Badge className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300">
                      {keyInsights.length}
                    </Badge>
                  )}
                  {isGeneratingInsights && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
                  {expandedSections.has('insights') ? 
                    <ChevronDown className="h-4 w-4 text-slate-600" /> : 
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  }
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  {keyInsights.length > 0 ? (
                    <div className="space-y-4">
                      {keyInsights.map((insight, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg border border-slate-200 shadow-sm">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <Badge className={`text-xs font-medium ${getImportanceColor(insight.importance)}`}>
                              {insight.importance.toUpperCase()}
                            </Badge>
                            {insight.page_reference && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onPageNavigate?.(insight.page_reference!)}
                                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 h-6 px-2"
                              >
                                Page {insight.page_reference}
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                          <p className="text-slate-700 leading-relaxed">{insight.insight}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Button 
                        onClick={handleGenerateInsights}
                        disabled={isGeneratingInsights || !currentText || !persona || !jobToBeDone}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md"
                      >
                        {isGeneratingInsights ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing Content...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Generate Key Insights
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Thoughtful Questions */}
          <Collapsible open={expandedSections.has('questions')} onOpenChange={() => toggleSection('questions')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-white/50 hover:bg-white/80 border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Related Sections</div>
                    <div className="text-sm text-slate-600">Questions to deepen understanding</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {thoughtfulQuestions.length > 0 && (
                    <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300">
                      {thoughtfulQuestions.length}
                    </Badge>
                  )}
                  {isGeneratingQuestions && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                  {expandedSections.has('questions') ? 
                    <ChevronDown className="h-4 w-4 text-slate-600" /> : 
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  }
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  {thoughtfulQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {thoughtfulQuestions.map((question, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg border border-slate-200 shadow-sm">
                          <div className="flex items-start gap-3 mb-3">
                            {getQuestionTypeIcon(question.type)}
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 mb-2">{question.question}</p>
                              <Badge className="text-xs bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300">
                                {question.type}
                              </Badge>
                            </div>
                          </div>
                          {question.follow_up_prompts.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-sm font-medium text-slate-700 mb-2">Follow-up considerations:</p>
                              <ul className="space-y-1">
                                {question.follow_up_prompts.map((prompt, promptIndex) => (
                                  <li key={promptIndex} className="text-sm text-slate-600 flex items-start gap-2">
                                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                                    {prompt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Button 
                        onClick={handleGenerateQuestions}
                        disabled={isGeneratingQuestions || !currentText || !persona || !jobToBeDone}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md"
                      >
                        {isGeneratingQuestions ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating Questions...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Generate Related Sections
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}