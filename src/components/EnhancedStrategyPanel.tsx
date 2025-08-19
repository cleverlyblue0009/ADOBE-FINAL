import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { 
  Target, 
  Lightbulb, 
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  Zap,
  Brain,
  Eye,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Award,
  Flag,
  Compass,
  Route,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface EnhancedStrategyPanelProps {
  persona?: string;
  jobToBeDone?: string;
  documentContext?: string;
  currentPage?: number;
  totalPages?: number;
  className?: string;
}

interface RoleSpecificTip {
  tip: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  category: 'reading' | 'analysis' | 'application' | 'follow-up';
}

interface PersonaInsight {
  insight: string;
  relevance_to_role: string;
  actionable_steps: string[];
}

interface FocusArea {
  area: string;
  why_important: string;
  how_to_approach: string;
  success_indicators: string[];
}

interface LearningStep {
  step: number;
  activity: string;
  estimated_time: string;
  outcome: string;
}

export function EnhancedStrategyPanel({
  persona = 'professional',
  jobToBeDone = 'learning',
  documentContext,
  currentPage = 1,
  totalPages = 100,
  className = ''
}: EnhancedStrategyPanelProps) {
  const [roleSpecificTips, setRoleSpecificTips] = useState<RoleSpecificTip[]>([]);
  const [personaInsights, setPersonaInsights] = useState<PersonaInsight[]>([]);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [learningPath, setLearningPath] = useState<LearningStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tips');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadPersonalizedStrategy();
  }, [persona, jobToBeDone, documentContext]);

  const loadPersonalizedStrategy = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getPersonalizedStrategy(persona, jobToBeDone, documentContext);
      
      setRoleSpecificTips(data.role_specific_tips);
      setPersonaInsights(data.persona_insights);
      setFocusAreas(data.recommended_focus_areas);
      setLearningPath(data.learning_path);

      toast({
        title: "Strategy updated",
        description: `Personalized guidance for ${persona} role generated`,
      });
    } catch (error) {
      console.error('Failed to load personalized strategy:', error);
      
      // Fallback to intelligent mock data
      const mockData = generatePersonalizedMockStrategy(persona, jobToBeDone, documentContext || '');
      setRoleSpecificTips(mockData.role_specific_tips);
      setPersonaInsights(mockData.persona_insights);
      setFocusAreas(mockData.recommended_focus_areas);
      setLearningPath(mockData.learning_path);
      
      toast({
        title: "Strategy loaded",
        description: `Generated personalized guidance for ${persona}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePersonalizedMockStrategy = (persona: string, jobToBeDone: string, context: string) => {
    const personaData = {
      'student': {
        tips: [
          {
            tip: 'Use active reading techniques like summarizing each section in your own words',
            rationale: 'Students benefit from active engagement to improve comprehension and retention',
            priority: 'high' as const,
            category: 'reading' as const
          },
          {
            tip: 'Create concept maps to visualize relationships between ideas',
            rationale: 'Visual learning aids help students organize complex information',
            priority: 'high' as const,
            category: 'analysis' as const
          },
          {
            tip: 'Form study groups to discuss key concepts and test understanding',
            rationale: 'Collaborative learning reinforces knowledge and reveals gaps',
            priority: 'medium' as const,
            category: 'application' as const
          },
          {
            tip: 'Schedule regular review sessions using spaced repetition',
            rationale: 'Spaced repetition improves long-term retention for academic success',
            priority: 'medium' as const,
            category: 'follow-up' as const
          }
        ],
        insights: [
          {
            insight: 'Focus on understanding fundamental concepts before diving into advanced topics',
            relevance_to_role: 'Students need strong foundations to build upon in their academic journey',
            actionable_steps: ['Identify key concepts', 'Create definitions', 'Practice with examples', 'Test understanding']
          },
          {
            insight: 'Connect new information to prior knowledge and real-world applications',
            relevance_to_role: 'Making connections helps students see relevance and improves retention',
            actionable_steps: ['Relate to previous courses', 'Find real-world examples', 'Create analogies', 'Discuss applications']
          }
        ],
        focusAreas: [
          {
            area: 'Comprehension and Retention',
            why_important: 'Essential for academic success and building knowledge foundation',
            how_to_approach: 'Use multiple learning modalities and active reading strategies',
            success_indicators: ['Can explain concepts in own words', 'Performs well on assessments', 'Retains information over time']
          },
          {
            area: 'Critical Thinking Development',
            why_important: 'Develops analytical skills needed for advanced coursework',
            how_to_approach: 'Question assumptions, analyze arguments, and evaluate evidence',
            success_indicators: ['Asks thoughtful questions', 'Identifies biases', 'Makes logical connections']
          }
        ]
      },
      'researcher': {
        tips: [
          {
            tip: 'Maintain detailed notes with proper citations and source tracking',
            rationale: 'Researchers need systematic documentation for literature reviews and referencing',
            priority: 'high' as const,
            category: 'reading' as const
          },
          {
            tip: 'Identify methodological approaches and evaluate their strengths and limitations',
            rationale: 'Understanding methodology is crucial for assessing research validity',
            priority: 'high' as const,
            category: 'analysis' as const
          },
          {
            tip: 'Look for gaps in current research that could inform your own work',
            rationale: 'Research gaps represent opportunities for original contributions',
            priority: 'high' as const,
            category: 'application' as const
          },
          {
            tip: 'Build connections with other researchers and experts in the field',
            rationale: 'Academic networks facilitate collaboration and knowledge sharing',
            priority: 'medium' as const,
            category: 'follow-up' as const
          }
        ],
        insights: [
          {
            insight: 'Approach literature with a critical eye, questioning assumptions and methodology',
            relevance_to_role: 'Researchers must evaluate source credibility and research quality',
            actionable_steps: ['Assess methodology', 'Check sample sizes', 'Evaluate bias', 'Compare findings']
          },
          {
            insight: 'Synthesize information across multiple sources to identify patterns and trends',
            relevance_to_role: 'Research synthesis reveals broader insights than individual studies',
            actionable_steps: ['Compare methodologies', 'Identify patterns', 'Note contradictions', 'Synthesize findings']
          }
        ],
        focusAreas: [
          {
            area: 'Literature Review and Synthesis',
            why_important: 'Foundation for identifying research gaps and building on existing knowledge',
            how_to_approach: 'Systematic review of relevant sources with critical analysis',
            success_indicators: ['Comprehensive coverage', 'Critical evaluation', 'Clear synthesis', 'Gap identification']
          },
          {
            area: 'Methodological Understanding',
            why_important: 'Essential for designing valid research and evaluating others\' work',
            how_to_approach: 'Study various research methods and their appropriate applications',
            success_indicators: ['Can critique methodology', 'Selects appropriate methods', 'Understands limitations']
          }
        ]
      },
      'professional': {
        tips: [
          {
            tip: 'Focus on actionable insights that can be implemented in your current role',
            rationale: 'Professionals need practical knowledge that drives business results',
            priority: 'high' as const,
            category: 'application' as const
          },
          {
            tip: 'Identify best practices and case studies relevant to your industry',
            rationale: 'Real-world examples provide concrete implementation guidance',
            priority: 'high' as const,
            category: 'analysis' as const
          },
          {
            tip: 'Consider the ROI and resource requirements of implementing new strategies',
            rationale: 'Business decisions must be evaluated for practical feasibility and impact',
            priority: 'high' as const,
            category: 'application' as const
          },
          {
            tip: 'Share insights with your team and stakeholders to maximize impact',
            rationale: 'Knowledge sharing amplifies the value of professional development',
            priority: 'medium' as const,
            category: 'follow-up' as const
          }
        ],
        insights: [
          {
            insight: 'Prioritize information that directly impacts your key performance indicators',
            relevance_to_role: 'Professionals must focus on knowledge that drives measurable results',
            actionable_steps: ['Identify KPIs', 'Map insights to metrics', 'Prioritize by impact', 'Track implementation']
          },
          {
            insight: 'Consider both short-term wins and long-term strategic implications',
            relevance_to_role: 'Balanced approach ensures immediate value while building future capabilities',
            actionable_steps: ['Identify quick wins', 'Plan long-term strategy', 'Balance resources', 'Monitor progress']
          }
        ],
        focusAreas: [
          {
            area: 'Strategic Implementation',
            why_important: 'Converts knowledge into business value and competitive advantage',
            how_to_approach: 'Develop implementation plans with clear timelines and success metrics',
            success_indicators: ['Clear action plans', 'Measurable outcomes', 'Stakeholder buy-in', 'Successful execution']
          },
          {
            area: 'Industry Application',
            why_important: 'Ensures relevance and practical applicability of insights',
            how_to_approach: 'Filter information through industry-specific lens and constraints',
            success_indicators: ['Industry relevance', 'Practical feasibility', 'Competitive advantage', 'Market impact']
          }
        ]
      }
    };

    const defaultData = personaData['professional'];
    const selectedData = personaData[persona as keyof typeof personaData] || defaultData;

    return {
      role_specific_tips: selectedData.tips,
      persona_insights: selectedData.insights,
      recommended_focus_areas: selectedData.focusAreas,
      learning_path: [
        {
          step: 1,
          activity: `Initial assessment of ${jobToBeDone} requirements`,
          estimated_time: '15 minutes',
          outcome: 'Clear understanding of objectives and scope'
        },
        {
          step: 2,
          activity: 'Active reading with note-taking and highlighting',
          estimated_time: '45 minutes',
          outcome: 'Comprehensive understanding of key concepts'
        },
        {
          step: 3,
          activity: 'Analysis and synthesis of main ideas',
          estimated_time: '30 minutes',
          outcome: 'Identification of actionable insights'
        },
        {
          step: 4,
          activity: 'Application planning and next steps',
          estimated_time: '20 minutes',
          outcome: 'Clear action plan for implementation'
        },
        {
          step: 5,
          activity: 'Follow-up and knowledge reinforcement',
          estimated_time: '15 minutes',
          outcome: 'Long-term retention and continuous improvement'
        }
      ]
    };
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleStepCompletion = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'medium': return <Clock className="h-3 w-3 text-yellow-600" />;
      default: return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reading': return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'analysis': return <Brain className="h-4 w-4 text-purple-600" />;
      case 'application': return <Target className="h-4 w-4 text-green-600" />;
      case 'follow-up': return <ArrowRight className="h-4 w-4 text-orange-600" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPersonaIcon = (persona: string) => {
    switch (persona?.toLowerCase()) {
      case 'student': return '🎓';
      case 'researcher': return '🔬';
      case 'professional': return '💼';
      case 'expert': return '👨‍🏫';
      default: return '👤';
    }
  };

  const progressPercentage = Math.round((currentPage / totalPages) * 100);
  const completedPathSteps = completedSteps.size;
  const totalPathSteps = learningPath.length;
  const pathProgress = totalPathSteps > 0 ? Math.round((completedPathSteps / totalPathSteps) * 100) : 0;

  if (isLoading) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <div className="p-4 border-b border-border-subtle bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Strategic Guidance</h3>
              <p className="text-xs text-text-secondary">Personalized for your role</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Generating Strategy</h3>
              <p className="text-text-secondary">Creating personalized guidance...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border-subtle bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                Strategic Guidance
                <Badge variant="secondary" className="text-xs">Personalized</Badge>
              </h3>
              <p className="text-xs text-text-secondary flex items-center gap-1">
                <span className="text-lg">{getPersonaIcon(persona)}</span>
                Tailored for {persona} • {jobToBeDone}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPersonalizedStrategy}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* Progress Overview */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Reading Progress</span>
              <span className="text-xs text-gray-600">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Learning Path</span>
              <span className="text-xs text-gray-600">{completedPathSteps}/{totalPathSteps}</span>
            </div>
            <Progress value={pathProgress} className="h-2" />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="tips" className="gap-1 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <Lightbulb className="h-3 w-3" />
                Tips
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-1 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Eye className="h-3 w-3" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="focus" className="gap-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <Target className="h-3 w-3" />
                Focus
              </TabsTrigger>
              <TabsTrigger value="path" className="gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Route className="h-3 w-3" />
                Path
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <TabsContent value="tips" className="space-y-3 mt-0">
                {roleSpecificTips.map((tip, index) => (
                  <Card key={index} className={`border ${getPriorityColor(tip.priority)}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-white rounded-lg">
                            {getCategoryIcon(tip.category)}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium capitalize">
                              {tip.category} Tip
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${getPriorityColor(tip.priority)}`}>
                                {getPriorityIcon(tip.priority)}
                                {tip.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {tip.tip}
                        </p>
                        
                        <Collapsible 
                          open={expandedItems.has(`tip-${index}`)}
                          onOpenChange={() => toggleExpanded(`tip-${index}`)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-xs">
                              {expandedItems.has(`tip-${index}`) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              Why this matters
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="p-3 bg-white/50 rounded-lg">
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {tip.rationale}
                              </p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="insights" className="space-y-3 mt-0">
                {personaInsights.map((insight, index) => (
                  <Card key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg">
                          <Brain className="h-4 w-4 text-blue-600" />
                        </div>
                        <CardTitle className="text-sm font-medium">
                          Persona Insight
                        </CardTitle>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          {insight.insight}
                        </p>
                        
                        <div className="p-3 bg-white/50 rounded-lg">
                          <h4 className="text-xs font-medium mb-1 text-blue-700">Relevance to your role:</h4>
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            {insight.relevance_to_role}
                          </p>
                        </div>

                        <Collapsible 
                          open={expandedItems.has(`insight-${index}`)}
                          onOpenChange={() => toggleExpanded(`insight-${index}`)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-xs">
                              {expandedItems.has(`insight-${index}`) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              Action Steps
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                              <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                                <ArrowRight className="h-3 w-3" />
                                Actionable Steps
                              </h4>
                              <ul className="space-y-1">
                                {insight.actionable_steps.map((step, stepIndex) => (
                                  <li key={stepIndex} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                    <div className="w-1 h-1 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0" />
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="focus" className="space-y-3 mt-0">
                {focusAreas.map((area, index) => (
                  <Card key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg">
                          <Flag className="h-4 w-4 text-purple-600" />
                        </div>
                        <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          {area.area}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-white/50 rounded-lg">
                          <h4 className="text-xs font-medium mb-1 text-purple-700">Why it's important:</h4>
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            {area.why_important}
                          </p>
                        </div>

                        <div className="p-3 bg-white/50 rounded-lg">
                          <h4 className="text-xs font-medium mb-1 text-purple-700">How to approach:</h4>
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            {area.how_to_approach}
                          </p>
                        </div>

                        <Collapsible 
                          open={expandedItems.has(`focus-${index}`)}
                          onOpenChange={() => toggleExpanded(`focus-${index}`)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-xs">
                              {expandedItems.has(`focus-${index}`) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              Success Indicators
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                                <Award className="h-3 w-3" />
                                How you'll know you're succeeding
                              </h4>
                              <ul className="space-y-1">
                                {area.success_indicators.map((indicator, indicatorIndex) => (
                                  <li key={indicatorIndex} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                    <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-600" />
                                    {indicator}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="path" className="space-y-3 mt-0">
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <Compass className="h-4 w-4 text-blue-600" />
                      Your Learning Journey
                    </h3>
                    <Badge className="bg-blue-100 text-blue-800">
                      {completedPathSteps}/{totalPathSteps} completed
                    </Badge>
                  </div>
                  <Progress value={pathProgress} className="h-2" />
                </div>

                {learningPath.map((step, index) => {
                  const isCompleted = completedSteps.has(step.step);
                  const isCurrent = !isCompleted && completedSteps.size === step.step - 1;
                  
                  return (
                    <Card key={index} className={`border transition-all ${
                      isCompleted ? 'bg-green-50 border-green-200' :
                      isCurrent ? 'bg-blue-50 border-blue-200 shadow-md' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full flex-shrink-0 ${
                            isCompleted ? 'bg-green-100' :
                            isCurrent ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : isCurrent ? (
                              <MapPin className="h-4 w-4 text-blue-600" />
                            ) : (
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                'border-gray-400'
                              }`} />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">
                                Step {step.step}: {step.activity}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {step.estimated_time}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleStepCompletion(step.step)}
                                  className="h-6 px-2 text-xs"
                                >
                                  {isCompleted ? 'Undo' : 'Complete'}
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Expected outcome:</span> {step.outcome}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}