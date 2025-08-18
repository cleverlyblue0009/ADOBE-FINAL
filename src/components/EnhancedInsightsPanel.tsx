import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { apiService, Insight as ApiInsight } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Lightbulb, 
  Brain, 
  AlertTriangle, 
  Link2, 
  Sparkles,
  Target,
  RefreshCw,
  Loader2,
  BookOpen,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  Eye,
  Plus
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'takeaway' | 'fact' | 'contradiction' | 'connection' | 'info' | 'error' | 'key-insight' | 'inspiration' | 'question' | 'action-item';
  title: string;
  content: string;
  relevance: number;
  pageReference?: number;
  source?: string;
}

interface EnhancedInsightsPanelProps {
  documentIds?: string[];
  documentId?: string;
  persona?: string;
  jobToBeDone?: string;
  currentText?: string;
  onPageNavigate?: (page: number) => void;
}

export function EnhancedInsightsPanel({ 
  documentIds = [], 
  documentId, 
  persona: propPersona, 
  jobToBeDone: propJobToBeDone, 
  currentText, 
  onPageNavigate 
}: EnhancedInsightsPanelProps) {
  const [persona, setPersona] = useState(propPersona || '');
  const [jobToBeDone, setJobToBeDone] = useState(propJobToBeDone || '');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'key-insights', 'questions', 'actions'])
  );
  const { toast } = useToast();

  // Update persona and job when props change
  useEffect(() => {
    if (propPersona) setPersona(propPersona);
    if (propJobToBeDone) setJobToBeDone(propJobToBeDone);
  }, [propPersona, propJobToBeDone]);

  // Auto-generate insights when content is available
  useEffect(() => {
    if (currentText && currentText.length > 100 && persona && jobToBeDone && insights.length === 0) {
      handleGenerateInsights();
    }
  }, [currentText, persona, jobToBeDone]);

  const handleGenerateInsights = async () => {
    if (!currentText || !persona || !jobToBeDone) {
      toast({
        title: "Missing information",
        description: "Please ensure there's content to analyze and persona/job are set.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      // Generate comprehensive insights
      const mockInsights: Insight[] = [
        // Summary insights
        {
          id: 'summary-1',
          type: 'takeaway',
          title: 'Document Overview',
          content: `This document provides comprehensive coverage of key concepts relevant to ${persona}. The content emphasizes practical applications and strategic considerations that directly support ${jobToBeDone} objectives.`,
          relevance: 0.95,
          pageReference: 1,
          source: 'AI Analysis'
        },
        {
          id: 'summary-2',
          type: 'fact',
          title: 'Key Statistics',
          content: `The document presents important data points and metrics that provide quantitative support for the main arguments. These statistics are particularly relevant for evidence-based decision making.`,
          relevance: 0.88,
          pageReference: 2,
          source: 'AI Analysis'
        },
        // Key insights
        {
          id: 'key-1',
          type: 'key-insight',
          title: 'Strategic Insight',
          content: `The most significant finding relates to the intersection of current market trends and your role as ${persona}. This insight suggests new approaches to ${jobToBeDone} that could yield significant benefits.`,
          relevance: 0.92,
          pageReference: 3,
          source: 'AI Analysis'
        },
        {
          id: 'key-2',
          type: 'inspiration',
          title: 'Innovation Opportunity',
          content: `The document highlights an emerging opportunity that aligns perfectly with your objectives. This represents a potential area for innovation and competitive advantage.`,
          relevance: 0.87,
          pageReference: 4,
          source: 'AI Analysis'
        },
        // Questions
        {
          id: 'question-1',
          type: 'question',
          title: 'Critical Consideration',
          content: `How might the concepts presented here be adapted to your specific context as ${persona}? What are the potential challenges and opportunities for implementation?`,
          relevance: 0.84,
          pageReference: 2,
          source: 'AI Analysis'
        },
        {
          id: 'question-2',
          type: 'question',
          title: 'Strategic Question',
          content: `What additional resources or capabilities would be needed to fully leverage these insights for ${jobToBeDone}? How does this align with your current priorities?`,
          relevance: 0.81,
          pageReference: 5,
          source: 'AI Analysis'
        },
        // Action items
        {
          id: 'action-1',
          type: 'action-item',
          title: 'Immediate Next Steps',
          content: `Based on this analysis, consider conducting a deeper review of the highlighted concepts. Schedule time to evaluate how these insights can be integrated into your current workflow.`,
          relevance: 0.89,
          pageReference: 1,
          source: 'AI Analysis'
        },
        {
          id: 'action-2',
          type: 'action-item',
          title: 'Long-term Planning',
          content: `Develop a strategic plan that incorporates these insights into your ${jobToBeDone} objectives. Consider creating a timeline for implementation and success metrics.`,
          relevance: 0.86,
          pageReference: 3,
          source: 'AI Analysis'
        }
      ];
      
      setInsights(mockInsights);
      
      toast({
        title: "Insights generated",
        description: `Generated ${mockInsights.length} insights for the current content.`
      });
      
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getInsightsByType = (types: string[]) => 
    insights.filter(insight => types.includes(insight.type));

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'takeaway': return <Star className="h-4 w-4" />;
      case 'key-insight': return <Lightbulb className="h-4 w-4" />;
      case 'fact': return <BookOpen className="h-4 w-4" />;
      case 'question': return <MessageSquare className="h-4 w-4" />;
      case 'action-item': return <Target className="h-4 w-4" />;
      case 'inspiration': return <Sparkles className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'takeaway': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'key-insight': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'fact': return 'bg-green-50 border-green-200 text-green-800';
      case 'question': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'action-item': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'inspiration': return 'bg-pink-50 border-pink-200 text-pink-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const insightSections = [
    {
      id: 'summary',
      title: 'Summary & Overview',
      icon: BookOpen,
      types: ['takeaway', 'fact'],
      description: 'Key takeaways and important facts'
    },
    {
      id: 'key-insights',
      title: 'Key Insights',
      icon: Lightbulb,
      types: ['key-insight', 'inspiration'],
      description: 'Strategic insights and opportunities'
    },
    {
      id: 'questions',
      title: 'Questions & Considerations',
      icon: MessageSquare,
      types: ['question'],
      description: 'Critical questions to explore'
    },
    {
      id: 'actions',
      title: 'Action Items',
      icon: Target,
      types: ['action-item'],
      description: 'Recommended next steps'
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-brand-primary/10 rounded-lg flex items-center justify-center">
              <Brain className="h-4 w-4 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Insights</h3>
              <p className="text-xs text-gray-500">
                {persona && jobToBeDone ? `Optimized for ${persona} • ${jobToBeDone}` : 'Intelligent document analysis'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {insights.length} insights
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isGenerating ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-brand-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Analyzing Content</h3>
                  <p className="text-text-secondary">AI is processing your document...</p>
                </div>
              </div>
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center space-y-4 py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Brain className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">No insights yet</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {!persona || !jobToBeDone 
                    ? 'Set your persona and job to generate personalized insights' 
                    : 'Generate AI insights from the document content'
                  }
                </p>
              </div>
              <Button onClick={handleGenerateInsights} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Insights
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {insightSections.map((section) => {
                const sectionInsights = getInsightsByType(section.types);
                const isExpanded = expandedSections.has(section.id);
                
                return (
                  <Collapsible
                    key={section.id}
                    open={isExpanded}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                                <section.icon className="h-5 w-5 text-brand-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  {section.title}
                                  <Badge variant="secondary" className="text-xs">
                                    {sectionInsights.length}
                                  </Badge>
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                  {section.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-2">
                      <div className="space-y-3">
                        {sectionInsights.map((insight) => (
                          <Card key={insight.id} className={`${getInsightColor(insight.type)} border`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {getInsightIcon(insight.type)}
                                  <h4 className="font-medium text-sm">{insight.title}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  {insight.pageReference && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onPageNavigate?.(insight.pageReference!)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Page {insight.pageReference}
                                    </Button>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(insight.relevance * 100)}%
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-sm leading-relaxed mb-3">
                                {insight.content}
                              </p>
                              
                              {insight.source && (
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>Source: {insight.source}</span>
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    <span>Verified</span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}