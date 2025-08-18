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
  Link,
  Copy,
  Loader2,
  X,
  Highlighter,
  Languages,
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const generateInsights = async () => {
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    try {
      const mockInsights: AIInsight[] = [
        {
          id: 'insight-1',
          type: 'summary',
          title: 'Summary',
          content: `This text discusses key concepts related to the selected passage, providing important context and analysis.`,
          relevanceScore: 0.95,
          tags: ['analysis', 'key-point']
        },
        {
          id: 'insight-2',
          type: 'key-takeaway',
          title: 'Key Insight',
          content: `The main takeaway emphasizes critical information that directly relates to your objectives and understanding.`,
          relevanceScore: 0.88,
          tags: ['important', 'takeaway']
        },
        {
          id: 'insight-3',
          type: 'question',
          title: 'Critical Question',
          content: `How does this information align with your current goals? Consider the broader implications for your work.`,
          relevanceScore: 0.82,
          tags: ['question', 'reflection']
        }
      ];
      
      setInsights(mockInsights);
      
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-300' },
    { name: 'Green', value: 'green', color: 'bg-green-300' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-300' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-300' }
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
      <Card className="shadow-2xl border border-gray-700 bg-gray-900/95 backdrop-blur-md text-white w-96 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-brand-primary" />
              </div>
              <h3 className="font-semibold text-sm">AI Insights</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 bg-gray-800/50 rounded p-2 max-h-16 overflow-y-auto">
            "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
          </div>
        </div>

        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={generateInsights}
              disabled={isLoading}
              className="flex-1 gap-2 h-8 text-xs hover:bg-indigo-600/20 text-indigo-300"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Generate Insights
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-2 h-8 text-xs hover:bg-green-600/20 text-green-300"
            >
              <Copy className="h-3 w-3" />
              Copy
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Highlighter className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400 mr-2">Highlight:</span>
            {highlightColors.map((color) => (
              <Button
                key={color.value}
                variant="ghost"
                size="sm"
                onClick={() => {
                  onHighlight?.(color.value as any);
                  onClose();
                }}
                className={`h-6 w-6 p-0 rounded-full ${color.color} hover:scale-110 transition-transform`}
                title={`Highlight in ${color.name}`}
              />
            ))}
          </div>
        </div>

        {insights.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-3 w-full mx-3 mt-3">
                <TabsTrigger value="summary" className="text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Summary ({getInsightsByType('summary').length})
                </TabsTrigger>
                <TabsTrigger value="key-takeaway" className="text-xs">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Key ({getInsightsByType('key-takeaway').length})
                </TabsTrigger>
                <TabsTrigger value="question" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Q&A ({getInsightsByType('question').length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden p-3">
                <ScrollArea className="h-full">
                  <TabsContent value="summary" className="mt-0">
                    <div className="space-y-3">
                      {getInsightsByType('summary').map((insight) => (
                        <div key={insight.id} className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              {Math.round(insight.relevanceScore * 100)}% relevant
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{insight.content}</p>
                          {insight.tags && (
                            <div className="flex gap-1 mt-2">
                              {insight.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
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
                        <div key={insight.id} className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              {Math.round(insight.relevanceScore * 100)}% relevant
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{insight.content}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="question" className="mt-0">
                    <div className="space-y-3">
                      {getInsightsByType('question').map((insight) => (
                        <div key={insight.id} className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              {Math.round(insight.relevanceScore * 100)}% relevant
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{insight.content}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
        )}

        {isLoading && (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-300">Generating insights...</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
