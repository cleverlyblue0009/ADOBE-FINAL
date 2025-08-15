import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Clock, 
  Brain, 
  CheckCircle2,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Calendar,
  Trophy,
  ChevronRight,
  Zap,
  Star
} from 'lucide-react';

interface StrategyPanelProps {
  documentId?: string;
  currentPage?: number;
  totalPages?: number;
  persona?: string;
  jobToBeDone?: string;
  currentText?: string;
}

interface StudyStrategy {
  id: string;
  title: string;
  description: string;
  type: 'focus' | 'review' | 'practice' | 'memorize';
  priority: 'high' | 'medium' | 'low';
  timeEstimate: string;
  tips: string[];
  relatedPages: number[];
}

interface ExamPrep {
  topic: string;
  importance: number;
  mastery: number;
  suggestedActions: string[];
}

export function StrategyPanel({
  documentId,
  currentPage = 1,
  totalPages = 100,
  persona,
  jobToBeDone,
  currentText
}: StrategyPanelProps) {
  const [strategies, setStrategies] = useState<StudyStrategy[]>([]);
  const [examPrep, setExamPrep] = useState<ExamPrep[]>([]);
  const [studyProgress, setStudyProgress] = useState(0);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  useEffect(() => {
    // Generate strategies based on context
    generateStrategies();
    generateExamPrep();
    
    // Calculate study progress
    const progress = (currentPage / totalPages) * 100;
    setStudyProgress(progress);
  }, [currentPage, totalPages, persona, jobToBeDone]);

  const generateStrategies = () => {
    // Mock strategies - in production, these would be AI-generated based on content
    const mockStrategies: StudyStrategy[] = [
      {
        id: '1',
        title: 'Active Recall Practice',
        description: 'Test yourself on key concepts without looking at notes. This strengthens memory formation and identifies knowledge gaps.',
        type: 'practice',
        priority: 'high',
        timeEstimate: '20-30 min',
        tips: [
          'Create flashcards for important terms and concepts',
          'Explain concepts aloud as if teaching someone else',
          'Write summaries from memory, then check accuracy',
          'Use the Feynman Technique: explain in simple terms'
        ],
        relatedPages: [15, 28, 45, 62]
      },
      {
        id: '2',
        title: 'Spaced Repetition Schedule',
        description: 'Review material at increasing intervals to maximize long-term retention.',
        type: 'review',
        priority: 'high',
        timeEstimate: '15 min/session',
        tips: [
          'Review new material within 24 hours',
          'Second review after 3 days',
          'Third review after 1 week',
          'Final review before exam'
        ],
        relatedPages: [1, 20, 40, 60, 80]
      },
      {
        id: '3',
        title: 'Concept Mapping',
        description: 'Create visual connections between related ideas to understand the big picture.',
        type: 'focus',
        priority: 'medium',
        timeEstimate: '30-45 min',
        tips: [
          'Start with main concepts in the center',
          'Draw connections between related ideas',
          'Use colors to group similar topics',
          'Add examples and case studies to each concept'
        ],
        relatedPages: [10, 25, 35, 50, 70]
      },
      {
        id: '4',
        title: 'Practice Problems',
        description: 'Work through example problems and case studies to apply theoretical knowledge.',
        type: 'practice',
        priority: 'high',
        timeEstimate: '45-60 min',
        tips: [
          'Start with easier problems to build confidence',
          'Time yourself to simulate exam conditions',
          'Review mistakes immediately',
          'Create your own practice questions'
        ],
        relatedPages: [30, 45, 60, 75, 90]
      },
      {
        id: '5',
        title: 'Memory Palace Technique',
        description: 'Use spatial memory to remember complex information by associating it with familiar locations.',
        type: 'memorize',
        priority: 'medium',
        timeEstimate: '20-30 min',
        tips: [
          'Choose a familiar location (home, campus)',
          'Assign concepts to specific locations',
          'Create vivid, unusual mental images',
          'Practice walking through your palace'
        ],
        relatedPages: [5, 15, 25, 35, 45]
      }
    ];
    
    setStrategies(mockStrategies);
  };

  const generateExamPrep = () => {
    // Mock exam preparation data
    const mockExamPrep: ExamPrep[] = [
      {
        topic: 'Core Concepts & Definitions',
        importance: 95,
        mastery: 75,
        suggestedActions: [
          'Review key terminology flashcards',
          'Complete definition matching exercises',
          'Write out definitions in your own words'
        ]
      },
      {
        topic: 'Practical Applications',
        importance: 85,
        mastery: 60,
        suggestedActions: [
          'Work through more practice problems',
          'Review case study examples',
          'Create your own application scenarios'
        ]
      },
      {
        topic: 'Critical Analysis',
        importance: 80,
        mastery: 70,
        suggestedActions: [
          'Practice comparing and contrasting concepts',
          'Write analytical essays on key topics',
          'Discuss implications with study group'
        ]
      },
      {
        topic: 'Historical Context',
        importance: 60,
        mastery: 85,
        suggestedActions: [
          'Create timeline of important events',
          'Review cause-and-effect relationships',
          'Quick review before exam is sufficient'
        ]
      },
      {
        topic: 'Mathematical Formulas',
        importance: 90,
        mastery: 55,
        suggestedActions: [
          'Practice formula application daily',
          'Create formula cheat sheet',
          'Work through calculation problems'
        ]
      }
    ];
    
    setExamPrep(mockExamPrep);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'focus': return <Target className="h-4 w-4" />;
      case 'review': return <BookOpen className="h-4 w-4" />;
      case 'practice': return <Brain className="h-4 w-4" />;
      case 'memorize': return <Lightbulb className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'bg-green-500';
    if (mastery >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50/30 to-purple-50/30">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-text-primary">Exam Strategy Center</h3>
        </div>
        <p className="text-xs text-text-secondary">
          Personalized study strategies and exam preparation guidance
        </p>
      </div>

      {/* Study Progress */}
      <div className="p-4 bg-white/80 border-b border-border-subtle">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">Overall Progress</span>
            <span className="text-text-secondary">{Math.round(studyProgress)}%</span>
          </div>
          <Progress value={studyProgress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>Page {currentPage} of {totalPages}</span>
            <span>{Math.round((totalPages - currentPage) * 2)} min remaining</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-900">5-7 days</div>
                <div className="text-xs text-blue-700">Until exam</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-900">68%</div>
                <div className="text-xs text-green-700">Readiness</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-3 text-center">
                <Star className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-900">12</div>
                <div className="text-xs text-purple-700">Key topics</div>
              </CardContent>
            </Card>
          </div>

          {/* Exam Preparation Topics */}
          <Card className="bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                Topic Mastery & Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {examPrep.map((prep, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{prep.topic}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {prep.importance}% important
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          prep.mastery >= 80 ? 'bg-green-50 text-green-700' :
                          prep.mastery >= 60 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}
                      >
                        {prep.mastery}% mastery
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getMasteryColor(prep.mastery)}`}
                      style={{ width: `${prep.mastery}%` }}
                    />
                  </div>
                  {prep.mastery < 70 && (
                    <div className="pl-4 space-y-1">
                      {prep.suggestedActions.slice(0, 2).map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Study Strategies */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              Recommended Study Strategies
            </h4>
            
            {strategies.map((strategy) => (
              <Card 
                key={strategy.id} 
                className={`transition-all cursor-pointer hover:shadow-md ${
                  expandedStrategy === strategy.id ? 'ring-2 ring-brand-primary' : ''
                }`}
                onClick={() => setExpandedStrategy(
                  expandedStrategy === strategy.id ? null : strategy.id
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        strategy.type === 'focus' ? 'bg-blue-100' :
                        strategy.type === 'review' ? 'bg-green-100' :
                        strategy.type === 'practice' ? 'bg-purple-100' :
                        'bg-yellow-100'
                      }`}>
                        {getTypeIcon(strategy.type)}
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-sm font-semibold text-text-primary">
                          {strategy.title}
                        </h5>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {strategy.description}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(strategy.priority)}`}
                    >
                      {strategy.priority}
                    </Badge>
                  </div>
                </CardHeader>
                
                {expandedStrategy === strategy.id && (
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {strategy.timeEstimate}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        Pages: {strategy.relatedPages.join(', ')}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h6 className="text-xs font-semibold text-text-primary">Tips:</h6>
                      <ul className="space-y-1">
                        {strategy.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-xs text-text-secondary">
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Button size="sm" className="w-full gap-2">
                      <Calendar className="h-3 w-3" />
                      Schedule Study Session
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Study Tips Alert */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-sm font-semibold text-yellow-900">Pro Study Tip</h5>
                  <p className="text-xs text-yellow-800">
                    Based on your reading pattern, try the Pomodoro Technique: Study for 25 minutes, 
                    then take a 5-minute break. This maintains focus and prevents burnout.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}