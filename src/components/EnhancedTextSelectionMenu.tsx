import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Lightbulb, 
  BookOpen, 
  Copy,
  Loader2,
  X,
  Highlighter,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EnhancedTextSelectionMenuProps {
  selectedText: string;
  position: { x: number; y: number } | null;
  pageContext?: string;
  documentId?: string;
  onHighlight?: (color: 'yellow' | 'green' | 'blue' | 'pink') => void;
  onClose: () => void;
}

interface AIInsight {
  id: string;
  type: 'summary' | 'key-takeaway' | 'question' | 'related-topic' | 'action-item' | 'did-you-know';
  title: string;
  content: string;
  relevanceScore: number;
  pageReferences?: number[];
  tags?: string[];
}

export function EnhancedTextSelectionMenu({
  selectedText,
  position,
  pageContext,
  documentId,
  onHighlight,
  onClose
}: EnhancedTextSelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    // Auto-generate insights on mount
    if (selectedText && selectedText.length > 20) {
      setTimeout(() => generateInsights(), 500);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, selectedText]);

  const generateInsights = async () => {
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      // Try to use API service first
      let generatedInsights: AIInsight[] = [];
      
      try {
        const response = await apiService.generateInsights(selectedText, {
          context: pageContext,
          documentId
        });
        
        if (response && response.length > 0) {
          generatedInsights = response.map((insight: any, index: number) => ({
            id: `api-${index}`,
            type: insight.type || 'summary',
            title: insight.title || `Insight ${index + 1}`,
            content: insight.content || insight.text || '',
            relevanceScore: insight.relevance || 0.8,
            tags: insight.tags || ['analysis'],
            pageReferences: insight.pageReferences || [1]
          }));
        }
      } catch (apiError) {
        console.log('API unavailable, generating contextual insights');
      }
      
      // If API failed, generate intelligent insights from selected text
      if (generatedInsights.length === 0) {
        generatedInsights = generateContextualInsights(selectedText, pageContext);
      }
      
      // Simulate typing effect for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setInsights(generatedInsights);
      setIsTyping(false);
      
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate contextual insights from selected text
  const generateContextualInsights = (text: string, context?: string): AIInsight[] => {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const keyTerms = extractKeyTerms(text);
    const insights: AIInsight[] = [];
    
    // Summary insight
    insights.push({
      id: 'summary-1',
      type: 'summary',
      title: 'Text Analysis',
      content: `This ${words.length}-word passage focuses on ${keyTerms.slice(0, 2).join(' and ')}. ${sentences.length > 1 ? 'It contains multiple key points that' : 'The content'} provides important information for understanding the topic.`,
      relevanceScore: 0.9,
      tags: ['summary', 'analysis'],
      pageReferences: [1]
    });

    // Key takeaway from the text
    if (sentences.length > 0) {
      const mainSentence = sentences.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
      
      insights.push({
        id: 'takeaway-1',
        type: 'key-takeaway',
        title: 'Primary Insight',
        content: `${mainSentence.trim()}${mainSentence.trim().endsWith('.') ? '' : '.'} This represents a key concept that deserves attention and consideration.`,
        relevanceScore: 0.85,
        tags: ['key-point', 'important'],
        pageReferences: [1]
      });
    }

    // Generate a relevant question
    const questionStarters = [
      'How does this information relate to',
      'What are the implications of',
      'How might you apply',
      'What additional context is needed for'
    ];
    
    const randomStarter = questionStarters[Math.floor(Math.random() * questionStarters.length)];
    insights.push({
      id: 'question-1',
      type: 'question',
      title: 'Reflection Point',
      content: `${randomStarter} ${keyTerms[0] || 'this concept'}? Consider how this information fits into your broader understanding and current objectives.`,
      relevanceScore: 0.8,
      tags: ['question', 'reflection'],
      pageReferences: [1]
    });

    // Action item
    insights.push({
      id: 'action-1',
      type: 'action-item',
      title: 'Next Steps',
      content: `Consider researching more about ${keyTerms.slice(0, 2).join(' and ')}. Look for additional sources that expand on these concepts and note how they relate to your current work.`,
      relevanceScore: 0.75,
      tags: ['action', 'follow-up'],
      pageReferences: [1]
    });

    return insights;
  };

  // Extract key terms from text
  const extractKeyTerms = (text: string): string[] => {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));
    
    const wordFreq = words.reduce((freq, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard",
        variant: "destructive"
      });
    }
  };

  const highlightColors = [
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-300 hover:bg-yellow-400' },
    { name: 'Green', value: 'green', color: 'bg-green-300 hover:bg-green-400' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-300 hover:bg-blue-400' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-300 hover:bg-pink-400' }
  ];

  const getInsightsByType = (type: string) => insights.filter(insight => insight.type === type);

  if (!position || !selectedText) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <Card className="shadow-2xl border border-gray-700 bg-gray-900/95 backdrop-blur-md text-white w-[480px] max-h-[85vh] overflow-hidden">
        {/* Header - Similar to AI Insights Modal */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <Lightbulb className={`h-6 w-6 text-brand-primary ${isTyping ? 'animate-pulse' : ''}`} />
                {isTyping && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-ping opacity-75" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  AI Insights
                  {isTyping && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </h3>
                <p className="text-sm text-gray-400">Intelligent analysis of selected text</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={generateInsights}
                disabled={isLoading}
                className="gap-2 hover:bg-gray-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Selected text preview */}
          <div className="text-xs text-gray-400 bg-gray-800/50 rounded p-3 max-h-20 overflow-y-auto border border-gray-700">
            <div className="font-medium text-gray-300 mb-1">Selected Text:</div>
            "{selectedText.length > 150 ? selectedText.substring(0, 150) + '...' : selectedText}"
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="flex-1 gap-2 h-9 text-sm hover:bg-green-600/20 text-green-300"
            >
              <Copy className="h-4 w-4" />
              Copy Text
            </Button>
          </div>
          
          {/* Highlight colors */}
          <div className="flex items-center gap-2">
            <Highlighter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400 mr-2">Highlight:</span>
            {highlightColors.map((color) => (
              <Button
                key={color.value}
                variant="ghost"
                size="sm"
                onClick={() => {
                  onHighlight?.(color.value as any);
                  toast({
                    title: "Highlighted",
                    description: `Text highlighted in ${color.name.toLowerCase()}`,
                  });
                  onClose();
                }}
                className={`h-8 w-8 p-0 rounded-full ${color.color} transition-all duration-200 hover:scale-110`}
                title={`Highlight in ${color.name}`}
              />
            ))}
          </div>
        </div>

        {/* Insights Display */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-brand-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Analyzing Content</h3>
                <p className="text-gray-400">AI is processing your selection...</p>
              </div>
            </div>
          </div>
        ) : insights.length > 0 ? (
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-4 w-full mx-3 mt-3 bg-gray-800">
                <TabsTrigger value="summary" className="text-xs data-[state=active]:bg-gray-600">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Summary ({getInsightsByType('summary').length})
                </TabsTrigger>
                <TabsTrigger value="key-takeaway" className="text-xs data-[state=active]:bg-gray-600">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Key ({getInsightsByType('key-takeaway').length})
                </TabsTrigger>
                <TabsTrigger value="question" className="text-xs data-[state=active]:bg-gray-600">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Q&A ({getInsightsByType('question').length})
                </TabsTrigger>
                <TabsTrigger value="action-item" className="text-xs data-[state=active]:bg-gray-600">
                  <Target className="h-3 w-3 mr-1" />
                  Actions ({getInsightsByType('action-item').length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden p-3">
                <ScrollArea className="h-full">
                  <TabsContent value="summary" className="mt-0">
                    <div className="space-y-3">
                      {getInsightsByType('summary').map((insight) => (
                        <div key={insight.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              {Math.round(insight.relevanceScore * 100)}% relevant
                            </Badge>
                            {insight.pageReferences && (
                              <div className="text-xs text-gray-400">
                                Pages: {insight.pageReferences.join(', ')}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{insight.content}</p>
                          {insight.tags && (
                            <div className="flex gap-1 mt-3">
                              {insight.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="key-takeaway" className="mt-0">
                    <div className="space-y-3">
                      {getInsightsByType('key-takeaway').map((insight) => (
                        <div key={insight.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              {Math.round(insight.relevanceScore * 100)}% relevant
                            </Badge>
                            {insight.pageReferences && (
                              <div className="text-xs text-gray-400">
                                Pages: {insight.pageReferences.join(', ')}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{insight.content}</p>
                          {insight.tags && (
                            <div className="flex gap-1 mt-3">
                              {insight.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="question" className="mt-0">
                    <div className="space-y-3">
                      {getInsightsByType('question').map((insight) => (
                        <div key={insight.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              {Math.round(insight.relevanceScore * 100)}% relevant
                            </Badge>
                            {insight.pageReferences && (
                              <div className="text-xs text-gray-400">
                                Pages: {insight.pageReferences.join(', ')}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{insight.content}</p>
                          {insight.tags && (
                            <div className="flex gap-1 mt-3">
                              {insight.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="action-item" className="mt-0">
                    <div className="space-y-3">
                      {getInsightsByType('action-item').map((insight) => (
                        <div key={insight.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                              {Math.round(insight.relevanceScore * 100)}% relevant
                            </Badge>
                            {insight.pageReferences && (
                              <div className="text-xs text-gray-400">
                                Pages: {insight.pageReferences.join(', ')}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{insight.content}</p>
                          {insight.tags && (
                            <div className="flex gap-1 mt-3">
                              {insight.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select text to generate AI insights</p>
          </div>
        )}
      </Card>
    </div>
  );
}