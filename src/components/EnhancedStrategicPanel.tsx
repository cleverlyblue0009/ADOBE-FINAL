import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { ExpandablePanelModal } from '@/components/ui/ExpandablePanelModal';
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
  Star,
  Maximize2,
  Users,
  BookOpen,
  FileText,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  Settings
} from 'lucide-react';

interface PersonaProfile {
  type: 'student' | 'researcher' | 'professional' | 'casual' | 'expert';
  description: string;
  primaryGoals: string[];
  readingStyle: string;
  timeConstraints: string;
  focusAreas: string[];
}

interface StrategicRecommendation {
  id: string;
  type: 'action' | 'focus' | 'skip' | 'deep_dive' | 'connect';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  estimatedTime: string;
  page?: number;
  section?: string;
  relatedConcepts?: string[];
}

interface DocumentAnalysis {
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedReadTime: string;
  keyTopics: string[];
  difficulty: number; // 1-10
  structure: {
    hasIntroduction: boolean;
    hasConclusion: boolean;
    hasSummary: boolean;
    sectionCount: number;
    figureCount: number;
  };
  contentTypes: string[];
}

interface EnhancedStrategicPanelProps {
  documentId?: string;
  persona?: string;
  jobToBeDone?: string;
  currentText?: string;
  currentPage?: number;
  onPageNavigate?: (page: number) => void;
  onSectionNavigate?: (page: number, section: string) => void;
}

export function EnhancedStrategicPanel({ 
  documentId, 
  persona, 
  jobToBeDone, 
  currentText, 
  currentPage,
  onPageNavigate,
  onSectionNavigate
}: EnhancedStrategicPanelProps) {
  const [personaProfile, setPersonaProfile] = useState<PersonaProfile | null>(null);
  const [recommendations, setRecommendations] = useState<StrategicRecommendation[]>([]);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['recommendations', 'analysis']));
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const { toast } = useToast();

  // Persona profiles mapping
  const personaProfiles: Record<string, PersonaProfile> = {
    student: {
      type: 'student',
      description: 'Learning-focused individual seeking comprehensive understanding',
      primaryGoals: ['Understand core concepts', 'Pass exams', 'Complete assignments', 'Build knowledge base'],
      readingStyle: 'Sequential with note-taking',
      timeConstraints: 'Moderate - has dedicated study time',
      focusAreas: ['Key definitions', 'Examples', 'Practice problems', 'Summaries']
    },
    researcher: {
      type: 'researcher',
      description: 'Academic or industry researcher seeking specific insights',
      primaryGoals: ['Find novel insights', 'Validate hypotheses', 'Identify gaps', 'Build on existing work'],
      readingStyle: 'Strategic scanning with deep dives',
      timeConstraints: 'High - needs efficiency',
      focusAreas: ['Methodology', 'Results', 'Related work', 'Future directions']
    },
    professional: {
      type: 'professional',
      description: 'Working professional seeking actionable insights',
      primaryGoals: ['Apply knowledge', 'Make decisions', 'Solve problems', 'Stay updated'],
      readingStyle: 'Goal-oriented and practical',
      timeConstraints: 'Very high - limited time',
      focusAreas: ['Executive summary', 'Recommendations', 'Case studies', 'Best practices']
    },
    casual: {
      type: 'casual',
      description: 'General interest reader seeking understanding',
      primaryGoals: ['General understanding', 'Personal interest', 'Stay informed'],
      readingStyle: 'Flexible and exploratory',
      timeConstraints: 'Low - reading for enjoyment',
      focusAreas: ['Overview', 'Interesting facts', 'Visual content', 'Stories']
    },
    expert: {
      type: 'expert',
      description: 'Domain expert seeking advanced insights',
      primaryGoals: ['Critical analysis', 'Find limitations', 'Compare approaches', 'Peer review'],
      readingStyle: 'Critical and analytical',
      timeConstraints: 'Moderate - thorough analysis needed',
      focusAreas: ['Technical details', 'Assumptions', 'Limitations', 'Comparisons']
    }
  };

  useEffect(() => {
    if (persona && personaProfiles[persona.toLowerCase()]) {
      setPersonaProfile(personaProfiles[persona.toLowerCase()]);
    }
  }, [persona]);

  useEffect(() => {
    if (currentText && persona && jobToBeDone) {
      analyzeDocumentAndGenerateRecommendations();
    }
  }, [currentText, persona, jobToBeDone, documentId]);

  const analyzeDocumentAndGenerateRecommendations = async () => {
    if (!currentText || !persona || !jobToBeDone) return;
    
    setIsAnalyzing(true);
    try {
      // Simulate document analysis
      const analysis: DocumentAnalysis = {
        complexity: 'intermediate',
        estimatedReadTime: '15-20 minutes',
        keyTopics: ['Data Analysis', 'Machine Learning', 'Statistics', 'Visualization'],
        difficulty: 6,
        structure: {
          hasIntroduction: true,
          hasConclusion: true,
          hasSummary: false,
          sectionCount: 8,
          figureCount: 12
        },
        contentTypes: ['Text', 'Figures', 'Tables', 'Code Examples']
      };
      
      setDocumentAnalysis(analysis);

      // Generate persona-specific recommendations
      const recs = generatePersonaRecommendations(persona, jobToBeDone, analysis);
      setRecommendations(recs);

      toast({
        title: "Analysis Complete",
        description: `Generated ${recs.length} personalized recommendations`
      });
    } catch (error) {
      console.error('Failed to analyze document:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePersonaRecommendations = (
    persona: string, 
    jobToBeDone: string, 
    analysis: DocumentAnalysis
  ): StrategicRecommendation[] => {
    const baseRecs: StrategicRecommendation[] = [];
    const personaType = persona.toLowerCase();

    // Common recommendations based on document structure
    if (analysis.structure.hasIntroduction) {
      baseRecs.push({
        id: 'intro-first',
        type: 'action',
        priority: 'high',
        title: 'Start with Introduction',
        description: 'Read the introduction to understand the document\'s scope and objectives',
        reasoning: 'Sets context for the entire document',
        estimatedTime: '3-5 minutes',
        page: 1,
        section: 'Introduction'
      });
    }

    // Persona-specific recommendations
    switch (personaType) {
      case 'student':
        baseRecs.push(
          {
            id: 'key-concepts',
            type: 'focus',
            priority: 'high',
            title: 'Identify Key Concepts',
            description: 'Focus on definitions, formulas, and core principles',
            reasoning: 'Essential for building foundational understanding',
            estimatedTime: '10-15 minutes',
            relatedConcepts: analysis.keyTopics
          },
          {
            id: 'take-notes',
            type: 'action',
            priority: 'medium',
            title: 'Active Note-Taking',
            description: 'Create structured notes with examples and your own explanations',
            reasoning: 'Improves retention and comprehension',
            estimatedTime: 'Throughout reading'
          }
        );
        break;

      case 'researcher':
        baseRecs.push(
          {
            id: 'methodology-focus',
            type: 'deep_dive',
            priority: 'high',
            title: 'Deep Dive: Methodology',
            description: 'Critically analyze the research methods and experimental design',
            reasoning: 'Essential for evaluating research validity',
            estimatedTime: '8-12 minutes',
            page: 3
          },
          {
            id: 'related-work',
            type: 'connect',
            priority: 'medium',
            title: 'Connect to Related Work',
            description: 'Identify how this work relates to your research area',
            reasoning: 'Builds comprehensive understanding of the field',
            estimatedTime: '5-8 minutes'
          }
        );
        break;

      case 'professional':
        baseRecs.push(
          {
            id: 'executive-summary',
            type: 'focus',
            priority: 'high',
            title: 'Focus on Executive Summary',
            description: 'Extract key findings and actionable insights quickly',
            reasoning: 'Maximizes value given time constraints',
            estimatedTime: '2-3 minutes',
            page: 2
          },
          {
            id: 'skip-theory',
            type: 'skip',
            priority: 'low',
            title: 'Skip Theoretical Background',
            description: 'Unless directly relevant to your goals, focus on practical sections',
            reasoning: 'Time optimization for practical application',
            estimatedTime: 'Saves 5-10 minutes'
          }
        );
        break;

      case 'expert':
        baseRecs.push(
          {
            id: 'critical-analysis',
            type: 'deep_dive',
            priority: 'high',
            title: 'Critical Analysis Mode',
            description: 'Evaluate assumptions, limitations, and potential improvements',
            reasoning: 'Leverages your expertise for deeper insights',
            estimatedTime: '15-20 minutes'
          },
          {
            id: 'compare-methods',
            type: 'connect',
            priority: 'medium',
            title: 'Compare with Alternative Approaches',
            description: 'Consider how different methods might yield different results',
            reasoning: 'Provides comprehensive evaluation',
            estimatedTime: '8-12 minutes'
          }
        );
        break;
    }

    // Job-specific recommendations
    if (jobToBeDone?.toLowerCase().includes('exam') || jobToBeDone?.toLowerCase().includes('test')) {
      baseRecs.push({
        id: 'exam-prep',
        type: 'action',
        priority: 'high',
        title: 'Exam Preparation Focus',
        description: 'Create flashcards and practice questions from key concepts',
        reasoning: 'Optimizes retention for exam performance',
        estimatedTime: '20-30 minutes'
      });
    }

    return baseRecs;
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

  const handleRecommendationClick = (rec: StrategicRecommendation) => {
    if (rec.page && onPageNavigate) {
      onPageNavigate(rec.page);
    }
    if (rec.page && rec.section && onSectionNavigate) {
      onSectionNavigate(rec.page, rec.section);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return CheckSquare;
      case 'focus': return Target;
      case 'skip': return ArrowRight;
      case 'deep_dive': return Search;
      case 'connect': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const filteredRecommendations = recommendations.filter(rec => 
    activeFilter === 'all' || rec.priority === activeFilter
  );

  const PersonaCard = () => personaProfile && (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Your Profile: {personaProfile.type.charAt(0).toUpperCase() + personaProfile.type.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {personaProfile.description}
        </p>
        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium">Primary Goals:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {personaProfile.primaryGoals.slice(0, 2).map((goal, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium">Focus Areas:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {personaProfile.focusAreas.slice(0, 3).map((area, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AnalysisCard = () => documentAnalysis && (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Document Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-medium">Complexity:</span>
            <Badge variant="outline" className="ml-1 text-xs">
              {documentAnalysis.complexity}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Est. Time:</span>
            <span className="ml-1 text-gray-600">{documentAnalysis.estimatedReadTime}</span>
          </div>
          <div>
            <span className="font-medium">Difficulty:</span>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < documentAnalysis.difficulty ? 'bg-orange-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div>
            <span className="font-medium">Sections:</span>
            <span className="ml-1 text-gray-600">{documentAnalysis.structure.sectionCount}</span>
          </div>
        </div>
        
        <div>
          <span className="text-xs font-medium">Key Topics:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {documentAnalysis.keyTopics.map((topic, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-shrink-0 p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-text-primary">Strategic Guide</h3>
            {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          
          <ExpandablePanelModal
            title="Strategic Reading Guide"
            icon={<Brain className="h-5 w-5" />}
          >
            <div className="space-y-6">
              {PersonaCard()}
              {AnalysisCard()}
              <div className="space-y-4">
                <h4 className="font-medium">All Recommendations</h4>
                {filteredRecommendations.map((rec) => {
                  const Icon = getTypeIcon(rec.type);
                  return (
                    <Card key={rec.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-1 text-purple-600" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium">{rec.title}</h5>
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                            <p className="text-xs text-gray-500 mb-2">{rec.reasoning}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>⏱️ {rec.estimatedTime}</span>
                              {rec.page && <span>📄 Page {rec.page}</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </ExpandablePanelModal>
        </div>

        {/* Persona Profile */}
        {PersonaCard()}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Document Analysis */}
          <Collapsible 
            open={expandedSections.has('analysis')}
            onOpenChange={() => toggleSection('analysis')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-sm">Document Analysis</span>
                </div>
                {expandedSections.has('analysis') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {AnalysisCard()}
            </CollapsibleContent>
          </Collapsible>

          {/* Recommendations */}
          <Collapsible 
            open={expandedSections.has('recommendations')}
            onOpenChange={() => toggleSection('recommendations')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    Recommendations ({filteredRecommendations.length})
                  </span>
                </div>
                {expandedSections.has('recommendations') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {/* Filter buttons */}
              <div className="flex gap-2">
                {['all', 'high', 'medium', 'low'].map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter as any)}
                    className="text-xs"
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Recommendations list */}
              {filteredRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {filteredRecommendations.map((rec) => {
                    const Icon = getTypeIcon(rec.type);
                    return (
                      <Card 
                        key={rec.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleRecommendationClick(rec)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <Icon className="h-4 w-4 mt-1 text-purple-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-sm truncate">{rec.title}</h5>
                                <Badge className={`${getPriorityColor(rec.priority)} text-xs`}>
                                  {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{rec.description}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>⏱️ {rec.estimatedTime}</span>
                                {rec.page && <span>📄 Page {rec.page}</span>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {isAnalyzing ? 'Analyzing document...' : 'No recommendations available'}
                  </p>
                  {!isAnalyzing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={analyzeDocumentAndGenerateRecommendations}
                      className="mt-2"
                    >
                      Generate Recommendations
                    </Button>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}