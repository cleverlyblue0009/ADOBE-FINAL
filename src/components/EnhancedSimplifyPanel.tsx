import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Zap, 
  BookOpen, 
  GraduationCap, 
  Loader2,
  Copy,
  RotateCcw,
  Volume2,
  Target,
  Lightbulb,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';

interface EnhancedSimplifyPanelProps {
  originalText?: string;
  onSimplifiedText?: (text: string, level: string) => void;
  className?: string;
}

export function EnhancedSimplifyPanel({ originalText, onSimplifiedText, className = '' }: EnhancedSimplifyPanelProps) {
  const [difficultyLevel, setDifficultyLevel] = useState<string>('simple');
  const [customComplexity, setCustomComplexity] = useState<number>(3);
  const [simplifiedText, setSimplifiedText] = useState<string>('');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('simplify');
  const [simplificationHistory, setSimplificationHistory] = useState<Array<{
    original: string;
    simplified: string;
    level: string;
    timestamp: number;
    complexity: number;
  }>>([]);
  const { toast } = useToast();

  const difficultyLevels = [
    { 
      value: 'simple', 
      label: 'Simple', 
      icon: Zap,
      description: 'Very simple words and short sentences',
      color: 'bg-green-100 text-green-800 border-green-200',
      complexity: 1,
      audience: 'General public, beginners'
    },
    { 
      value: 'moderate', 
      label: 'Moderate', 
      icon: BookOpen,
      description: 'Clear language with some technical terms',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      complexity: 2,
      audience: 'Students, intermediate learners'
    },
    { 
      value: 'advanced', 
      label: 'Advanced', 
      icon: GraduationCap,
      description: 'Technical terms with clearer structure',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      complexity: 3,
      audience: 'Professionals, subject experts'
    },
    {
      value: 'custom',
      label: 'Custom',
      icon: Target,
      description: 'Personalized complexity level',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      complexity: customComplexity,
      audience: 'Tailored to your needs'
    }
  ];

  // Auto-simplify when originalText changes
  useEffect(() => {
    if (originalText && originalText.trim()) {
      handleSimplify();
    }
  }, [originalText, difficultyLevel, customComplexity]);

  const handleSimplify = async () => {
    if (!originalText?.trim()) {
      toast({
        title: "No text to simplify",
        description: "Please select text to simplify.",
        variant: "destructive"
      });
      return;
    }

    setIsSimplifying(true);
    try {
      const levelToUse = difficultyLevel === 'custom' ? `custom-${customComplexity}` : difficultyLevel;
      const simplified = await apiService.simplifyText(originalText, levelToUse);
      setSimplifiedText(simplified);
      
      // Add to history
      const newHistoryItem = {
        original: originalText,
        simplified,
        level: difficultyLevel,
        timestamp: Date.now(),
        complexity: difficultyLevel === 'custom' ? customComplexity : difficultyLevels.find(l => l.value === difficultyLevel)?.complexity || 1
      };
      setSimplificationHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]); // Keep last 5
      
      if (onSimplifiedText) {
        onSimplifiedText(simplified, difficultyLevel);
      }
      
      const selectedLevel = difficultyLevels.find(l => l.value === difficultyLevel);
      toast({
        title: "Simplification Complete",
        description: `Text simplified to ${selectedLevel?.label.toLowerCase()} level`,
      });
      
    } catch (error) {
      console.error('Failed to simplify text:', error);
      toast({
        title: "Simplification failed",
        description: "Unable to simplify text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleCopySimplified = async () => {
    if (!simplifiedText) return;
    
    try {
      await navigator.clipboard.writeText(simplifiedText);
      toast({
        title: "Copied to clipboard",
        description: "Simplified text has been copied.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setSimplifiedText('');
    setSimplificationHistory([]);
  };

  const speakSimplified = () => {
    if (simplifiedText && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(simplifiedText);
      utterance.rate = 0.8; // Slower for better comprehension
      speechSynthesis.speak(utterance);
      
      toast({
        title: "Speaking simplified text",
        description: "Playing audio at optimal speed for comprehension",
      });
    }
  };

  const getComplexityLabel = (complexity: number) => {
    if (complexity <= 1) return 'Very Simple';
    if (complexity <= 2) return 'Simple';
    if (complexity <= 3) return 'Moderate';
    if (complexity <= 4) return 'Advanced';
    return 'Complex';
  };

  const currentLevel = difficultyLevels.find(level => level.value === difficultyLevel);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border-subtle bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              Smart Simplify
              <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
            </h3>
            <p className="text-xs text-text-secondary">
              Intelligent text simplification with context preservation
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="simplify" className="gap-2">
                <Brain className="h-4 w-4" />
                Simplify
              </TabsTrigger>
              <TabsTrigger value="analyze" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Analysis
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              <TabsContent value="simplify" className="space-y-4 mt-0">
                {/* Difficulty Level Selection */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-3 block">
                    Simplification Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {difficultyLevels.map((level) => {
                      const Icon = level.icon;
                      const isSelected = difficultyLevel === level.value;
                      return (
                        <Button
                          key={level.value}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDifficultyLevel(level.value)}
                          className={`h-auto p-3 flex flex-col gap-2 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                              : 'hover:bg-indigo-50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <div className="text-center">
                            <div className="text-xs font-medium">{level.label}</div>
                            <div className="text-xs opacity-70">{level.audience}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                  
                  {currentLevel && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Badge className={currentLevel.color} variant="outline">
                        {currentLevel.description}
                      </Badge>
                    </div>
                  )}

                  {/* Custom Complexity Slider */}
                  {difficultyLevel === 'custom' && (
                    <div className="mt-4 p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <label className="text-sm font-medium text-text-primary mb-2 block">
                        Custom Complexity Level: {getComplexityLabel(customComplexity)}
                      </label>
                      <Slider
                        value={[customComplexity]}
                        onValueChange={(value) => setCustomComplexity(value[0])}
                        max={5}
                        min={1}
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Very Simple</span>
                        <span>Complex</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simplify Button */}
                <Button 
                  onClick={handleSimplify}
                  disabled={!originalText || isSimplifying}
                  className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {isSimplifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Simplifying...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Simplify Text
                    </>
                  )}
                </Button>

                {/* Simplified Text */}
                {simplifiedText && (
                  <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm text-text-primary flex items-center gap-2">
                          <Star className="h-4 w-4 text-indigo-600" />
                          Simplified Text
                          {currentLevel && (
                            <Badge className={currentLevel.color} variant="outline">
                              {currentLevel.label}
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={speakSimplified}
                            className="p-1.5"
                            title="Listen to simplified text"
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopySimplified}
                            className="p-1.5"
                            title="Copy simplified text"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="p-1.5"
                            title="Clear simplification"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-48">
                        <div className="text-sm text-text-primary leading-relaxed font-medium">
                          {simplifiedText}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="analyze" className="space-y-4 mt-0">
                {/* Text Analysis */}
                {originalText && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-text-primary flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Text Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-text-secondary">Words:</span>
                            <div className="font-medium">{originalText.split(/\s+/).length}</div>
                          </div>
                          <div>
                            <span className="text-text-secondary">Characters:</span>
                            <div className="font-medium">{originalText.length}</div>
                          </div>
                          <div>
                            <span className="text-text-secondary">Sentences:</span>
                            <div className="font-medium">{originalText.split(/[.!?]+/).filter(s => s.trim()).length}</div>
                          </div>
                          <div>
                            <span className="text-text-secondary">Reading Level:</span>
                            <div className="font-medium">
                              {originalText.split(/\s+/).length < 50 ? 'Easy' : 
                               originalText.split(/\s+/).length < 150 ? 'Moderate' : 'Advanced'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Simplification History */}
                    {simplificationHistory.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-text-primary flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Recent Simplifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="max-h-32">
                            <div className="space-y-2">
                              {simplificationHistory.map((item, index) => {
                                const level = difficultyLevels.find(l => l.value === item.level);
                                return (
                                  <div key={index} className="text-xs border rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                       onClick={() => {
                                         setSimplifiedText(item.simplified);
                                         setDifficultyLevel(item.level);
                                         if (item.level === 'custom') {
                                           setCustomComplexity(item.complexity);
                                         }
                                       }}>
                                    <div className="flex items-center gap-2 mb-1">
                                      {level && <level.icon className="h-3 w-3" />}
                                      <span className="font-medium">{level?.label || 'Custom'}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                      </Badge>
                                    </div>
                                    <div className="text-text-secondary line-clamp-2">
                                      {item.simplified.substring(0, 80)}...
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Original Text Preview */}
              {originalText && (
                <Card className="bg-gray-50 dark:bg-gray-900/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-text-secondary flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Original Text
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-text-secondary max-h-20 overflow-y-auto leading-relaxed">
                      {originalText.substring(0, 200)}
                      {originalText.length > 200 && '...'}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Usage Tips */}
              <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200">
                <CardContent className="pt-4">
                  <h4 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Simplification Tips
                  </h4>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li>• Choose "Simple" for general audiences or complex topics</li>
                    <li>• Use "Moderate" for educational or professional content</li>
                    <li>• "Advanced" maintains technical accuracy with clarity</li>
                    <li>• Custom levels let you fine-tune complexity</li>
                    <li>• Listen to simplified text for better comprehension</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}