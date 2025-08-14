import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { apiService, StrategicInsights, ContextualAnalysis } from '@/lib/api';
import { 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  CheckSquare, 
  HelpCircle, 
  Brain,
  ChevronDown,
  ChevronRight,
  Loader2,
  Lightbulb,
  Clock,
  Zap,
  Shield,
  Search,
  ArrowRight,
  Star
} from 'lucide-react';

interface StrategicInsightsPanelProps {
  documentId?: string;
  persona?: string;
  jobToBeDone?: string;
  currentText?: string;
  currentPage?: number;
  onPageNavigate?: (page: number) => void;
}

export function StrategicInsightsPanel({ 
  documentId, 
  persona, 
  jobToBeDone, 
  currentText, 
  currentPage,
  onPageNavigate 
}: StrategicInsightsPanelProps) {
  const [strategicInsights, setStrategicInsights] = useState<StrategicInsights | null>(null);
  const [contextualAnalysis, setContextualAnalysis] = useState<ContextualAnalysis | null>(null);
  const [isLoadingStrategic, setIsLoadingStrategic] = useState(false);
  const [isLoadingContextual, setIsLoadingContextual] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['opportunities', 'actions']));
  const { toast } = useToast();

  useEffect(() => {
    if (currentText && persona && jobToBeDone) {
      generateStrategicInsights();
    }
  }, [currentText, persona, jobToBeDone]);

  useEffect(() => {
    if (documentId && currentPage && currentText) {
      analyzeContext();
    }
  }, [documentId, currentPage, currentText]);

  const generateStrategicInsights = async () => {
    if (!currentText || !persona || !jobToBeDone) return;
    
    setIsLoadingStrategic(true);
    try {
      const insights = await apiService.generateStrategicInsights(
        currentText,
        persona,
        jobToBeDone,
        documentId
      );
      setStrategicInsights(insights);
    } catch (error) {
      console.error('Failed to generate strategic insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate strategic insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingStrategic(false);
    }
  };

  const analyzeContext = async () => {
    if (!documentId || !currentPage || !currentText) return;
    
    setIsLoadingContextual(true);
    try {
      const analysis = await apiService.analyzeDocumentContext(
        documentId,
        currentPage,
        currentText
      );
      setContextualAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze context:', error);
      toast({
        title: "Error",
        description: "Failed to analyze document context. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingContextual(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'short-term': return 'bg-orange-100 text-orange-800';
      case 'long-term': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentText) {
    return (
      <div className="p-4 text-center">
        <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Select text to generate strategic insights</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Strategic Analysis
          </h3>
          <p className="text-sm text-gray-600">AI-powered insights for your role</p>
        </div>
        <Button
          size="sm"
          onClick={generateStrategicInsights}
          disabled={isLoadingStrategic}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoadingStrategic ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Analyze
        </Button>
      </div>

      {/* Contextual Analysis */}
      {contextualAnalysis && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              Context Analysis
              <Badge variant="secondary" className="ml-auto text-xs">
                {Math.round(contextualAnalysis.confidence_score * 100)}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium text-xs text-blue-900 mb-1">Summary</h4>
              <p className="text-sm text-blue-800">{contextualAnalysis.section_summary}</p>
            </div>
            <div>
              <h4 className="font-medium text-xs text-blue-900 mb-1">Personal Relevance</h4>
              <p className="text-sm text-blue-800">{contextualAnalysis.personal_relevance}</p>
            </div>
            <div>
              <h4 className="font-medium text-xs text-blue-900 mb-1">Expert Perspective</h4>
              <p className="text-sm text-blue-800">{contextualAnalysis.expert_perspective}</p>
            </div>
            {contextualAnalysis.questions_to_consider.length > 0 && (
              <div>
                <h4 className="font-medium text-xs text-blue-900 mb-1">Questions to Consider</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {contextualAnalysis.questions_to_consider.map((question, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <HelpCircle className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Strategic Insights */}
      {isLoadingStrategic ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-gray-600">Generating strategic insights...</p>
          </div>
        </div>
      ) : strategicInsights ? (
        <div className="space-y-4">
          {/* Opportunities */}
          {strategicInsights.opportunities.length > 0 && (
            <Collapsible 
              open={expandedSections.has('opportunities')} 
              onOpenChange={() => toggleSection('opportunities')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Key Opportunities ({strategicInsights.opportunities.length})</span>
                  </div>
                  {expandedSections.has('opportunities') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                {strategicInsights.opportunities.map((opp, index) => (
                  <Card key={index} className="p-3 border-green-200 bg-green-50/50">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-green-900 flex-1">{opp.insight}</p>
                        <div className="flex gap-1 ml-2">
                          <Badge variant="secondary" className={`text-xs ${getPriorityColor(opp.priority)}`}>
                            {opp.priority}
                          </Badge>
                          <Badge variant="secondary" className={`text-xs ${getTimeframeColor(opp.timeframe)}`}>
                            {opp.timeframe}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Action Items */}
          {strategicInsights.action_items.length > 0 && (
            <Collapsible 
              open={expandedSections.has('actions')} 
              onOpenChange={() => toggleSection('actions')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Action Items ({strategicInsights.action_items.length})</span>
                  </div>
                  {expandedSections.has('actions') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                {strategicInsights.action_items.map((action, index) => (
                  <Card key={index} className="p-3 border-blue-200 bg-blue-50/50">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-blue-900 flex-1">{action.action}</p>
                        <div className="flex gap-1 ml-2">
                          <Badge variant="secondary" className={`text-xs ${getPriorityColor(action.priority)}`}>
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {action.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {action.effort} effort
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Risks */}
          {strategicInsights.risks.length > 0 && (
            <Collapsible 
              open={expandedSections.has('risks')} 
              onOpenChange={() => toggleSection('risks')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Risk Assessment ({strategicInsights.risks.length})</span>
                  </div>
                  {expandedSections.has('risks') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                {strategicInsights.risks.map((risk, index) => (
                  <Card key={index} className="p-3 border-red-200 bg-red-50/50">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-red-900 flex-1">{risk.risk}</p>
                        <Badge variant="secondary" className={`text-xs ${getPriorityColor(risk.impact)} ml-2`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {risk.impact} impact
                        </Badge>
                      </div>
                      <div className="bg-red-100 rounded p-2">
                        <p className="text-xs text-red-800">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Critical Decisions */}
          {strategicInsights.critical_decisions.length > 0 && (
            <Collapsible 
              open={expandedSections.has('decisions')} 
              onOpenChange={() => toggleSection('decisions')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Critical Decisions ({strategicInsights.critical_decisions.length})</span>
                  </div>
                  {expandedSections.has('decisions') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                {strategicInsights.critical_decisions.map((decision, index) => (
                  <Card key={index} className="p-3 border-purple-200 bg-purple-50/50">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-purple-900 flex-1">{decision.decision}</p>
                        <Badge variant="secondary" className={`text-xs ${getPriorityColor(decision.urgency)} ml-2`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {decision.urgency}
                        </Badge>
                      </div>
                      {decision.factors.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-purple-800 mb-1">Key Factors:</p>
                          <div className="flex flex-wrap gap-1">
                            {decision.factors.map((factor, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Knowledge Gaps */}
          {strategicInsights.knowledge_gaps.length > 0 && (
            <Collapsible 
              open={expandedSections.has('gaps')} 
              onOpenChange={() => toggleSection('gaps')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Knowledge Gaps ({strategicInsights.knowledge_gaps.length})</span>
                  </div>
                  {expandedSections.has('gaps') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                {strategicInsights.knowledge_gaps.map((gap, index) => (
                  <Card key={index} className="p-3 border-orange-200 bg-orange-50/50">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-orange-900 flex-1">{gap.gap}</p>
                        <Badge variant="secondary" className={`text-xs ${getPriorityColor(gap.importance)} ml-2`}>
                          <Star className="h-3 w-3 mr-1" />
                          {gap.importance}
                        </Badge>
                      </div>
                      {gap.source_suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-orange-800 mb-1">Suggested Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {gap.source_suggestions.map((source, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Strategic Context */}
          <Card className="border-gray-200 bg-gray-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-gray-600" />
                Strategic Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-xs text-gray-700 mb-1">Role Relevance</h4>
                <p className="text-sm text-gray-600">{strategicInsights.strategic_context.relevance_to_role}</p>
              </div>
              <div>
                <h4 className="font-medium text-xs text-gray-700 mb-1">Business Impact</h4>
                <p className="text-sm text-gray-600">{strategicInsights.strategic_context.business_impact}</p>
              </div>
              <div>
                <h4 className="font-medium text-xs text-gray-700 mb-1">Competitive Advantage</h4>
                <p className="text-sm text-gray-600">{strategicInsights.strategic_context.competitive_advantage}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Click "Analyze" to generate strategic insights</p>
        </div>
      )}
    </div>
  );
}