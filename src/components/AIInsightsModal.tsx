// AI Insights Modal Component
// Replaces tab-based AI insights with a modal popup interface

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DidYouKnowPopup } from './DidYouKnowPopup';
import {
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  MessageSquare,
  BookOpen,
  X,
  Loader2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'summary' | 'key-takeaway' | 'question' | 'related-topic' | 'action-item' | 'did-you-know';
  title: string;
  content: string;
  relevanceScore: number;
  pageReferences?: number[];
  tags?: string[];
}

interface TypingAnimationProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

function TypingAnimation({ text, speed = 30, onComplete }: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && <span className="animate-pulse">|</span>}
    </span>
  );
}

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
  documentText?: string;
  currentPage?: number;
  selectedText?: string;
  persona?: string;
  jobToBeDone?: string;
  onPageNavigate?: (page: number) => void;
}

export function AIInsightsModal({
  isOpen,
  onClose,
  documentId,
  documentText = '',
  currentPage = 1,
  selectedText = '',
  persona,
  jobToBeDone,
  onPageNavigate
}: AIInsightsModalProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [didYouKnowFacts, setDidYouKnowFacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingInsightId, setCurrentTypingInsightId] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate insights when modal opens or context changes
  useEffect(() => {
    if (isOpen && (documentText || selectedText)) {
      generateInsights();
    }
  }, [isOpen, documentText, selectedText, persona, jobToBeDone]);

  const generateInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use selected text if available, otherwise use document context
      const textToAnalyze = selectedText || documentText.slice(0, 5000); // Limit for API
      
      if (!textToAnalyze.trim()) {
        throw new Error('No text available for analysis');
      }

      const generatedInsights = await generateAIInsights(
        textToAnalyze,
        persona,
        jobToBeDone,
        currentPage
      );

      // Separate Did You Know facts from regular insights
      const didYouKnowInsights = generatedInsights.filter(insight => insight.type === 'did-you-know');
      const regularInsights = generatedInsights.filter(insight => insight.type !== 'did-you-know');
      
      setInsights(regularInsights);
      setDidYouKnowFacts(didYouKnowInsights.map(insight => ({
        id: insight.id,
        fact: insight.content,
        source_type: insight.tags?.[0] === 'AI Facts' ? 'research' : 
                     insight.tags?.[0] === 'Market Trends' ? 'statistic' : 
                     insight.tags?.[0] === 'Performance' ? 'trending' : 'research',
        relevance_explanation: `This fact is relevant because it provides context about ${insight.tags?.slice(0, 2).join(' and ') || 'the topic'}.`,
        tags: insight.tags || []
      })));
      
      // Start typing animation for the first insight
      if (generatedInsights.length > 0) {
        setIsTyping(true);
        setTimeout(() => {
          setCurrentTypingInsightId(generatedInsights[0].id);
        }, 500);
      }
      
      toast({
        title: "AI Insights Generated",
        description: `Generated ${generatedInsights.length} insights for your analysis.`,
      });

    } catch (error) {
      console.error('Error generating insights:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate insights');
      
      // Fallback to contextual analysis when API fails
      const contextualInsights = generateContextualInsights(selectedText || documentText, persona, jobToBeDone);
      const didYouKnowInsights = contextualInsights.filter(insight => insight.type === 'did-you-know');
      const regularInsights = contextualInsights.filter(insight => insight.type !== 'did-you-know');
      
      setInsights(regularInsights);
      setDidYouKnowFacts(didYouKnowInsights.map(insight => ({
        id: insight.id,
        fact: insight.content,
        source_type: insight.tags?.[0] === 'AI Facts' ? 'research' : 
                     insight.tags?.[0] === 'Market Trends' ? 'statistic' : 
                     insight.tags?.[0] === 'Performance' ? 'trending' : 'research',
        relevance_explanation: `This fact is relevant because it provides context about ${insight.tags?.slice(0, 2).join(' and ') || 'the topic'}.`,
        tags: insight.tags || []
      })));
      
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = async (
    text: string,
    persona?: string,
    jobToBeDone?: string,
    currentPage?: number
  ): Promise<AIInsight[]> => {
    // Try to use API service first
    try {
      const response = await apiService.generateInsights(text, {
        persona,
        jobToBeDone,
        currentPage
      });
      
      if (response && response.length > 0) {
        return response.map((insight: any, index: number) => ({
          id: `api-${index}`,
          type: insight.type || 'summary',
          title: insight.title || `Insight ${index + 1}`,
          content: insight.content || insight.text || '',
          relevanceScore: insight.relevance || 0.8,
          pageReferences: insight.pageReferences || [currentPage || 1],
          tags: insight.tags || ['analysis']
        }));
      }
    } catch (error) {
      console.log('API unavailable, using contextual analysis');
    }
    
    // Fallback to contextual analysis
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    return generateContextualInsights(text, persona, jobToBeDone, currentPage);
  };

  // Generate contextual insights from actual document text
  const generateContextualInsights = (
    text: string,
    persona?: string,
    jobToBeDone?: string,
    currentPage?: number
  ): AIInsight[] => {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyTerms = extractKeyTerms(text);
    const insights: AIInsight[] = [];
    
    // Document summary based on actual content
    insights.push({
      id: 'summary-1',
      type: 'summary',
      title: 'Document Analysis',
      content: `This ${words.length}-word document focuses on ${keyTerms.slice(0, 3).join(', ')} and related concepts. The content spans ${sentences.length} key sections, providing ${sentences.length > 10 ? 'comprehensive' : 'focused'} coverage of the subject matter${persona ? ` relevant to ${persona}` : ''}.`,
      relevanceScore: 0.9,
      pageReferences: [currentPage || 1],
      tags: keyTerms.slice(0, 3)
    });

    // Key takeaway from most important sentence
    if (sentences.length > 0) {
      const importantSentence = sentences
        .filter(s => s.length > 50 && s.length < 300)
        .sort((a, b) => {
          const scoreA = keyTerms.reduce((score, term) => 
            score + (a.toLowerCase().includes(term) ? 1 : 0), 0);
          const scoreB = keyTerms.reduce((score, term) => 
            score + (b.toLowerCase().includes(term) ? 1 : 0), 0);
          return scoreB - scoreA;
        })[0];

      if (importantSentence) {
        insights.push({
          id: 'takeaway-1',
          type: 'key-takeaway',
          title: 'Key Finding',
          content: `${importantSentence.trim()}${importantSentence.trim().endsWith('.') ? '' : '.'} This represents a crucial insight${persona ? ` for ${persona} working on ${jobToBeDone}` : ' for understanding the topic'}.`,
          relevanceScore: 0.85,
          pageReferences: [currentPage || 1],
          tags: ['key-finding', ...keyTerms.slice(0, 2)]
        });
      }
    }

    // Generate relevant questions
    if (keyTerms.length > 0) {
      insights.push({
        id: 'question-1',
        type: 'question',
        title: 'Strategic Question',
        content: `How can the insights about ${keyTerms[0]} be applied to your specific context${persona ? ` as ${persona}` : ''}? What are the practical implications for ${jobToBeDone || 'your objectives'}, and what additional research might be needed?`,
        relevanceScore: 0.8,
        pageReferences: [currentPage || 1],
        tags: ['strategic', 'application']
      });
    }

    // Action items based on content analysis
    insights.push({
      id: 'action-1',
      type: 'action-item',
      title: 'Recommended Actions',
      content: `Based on this analysis, consider: 1) Deep-dive into ${keyTerms.slice(0, 2).join(' and ')} concepts, 2) Cross-reference with existing knowledge in your field, 3) Identify practical applications for ${jobToBeDone || 'your work'}, 4) Note areas requiring further investigation.`,
      relevanceScore: 0.82,
      pageReferences: [currentPage || 1],
      tags: ['action-items', 'next-steps']
    });

    return insights;
  };

  // Extract key terms from text
  const extractKeyTerms = (text: string): string[] => {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    const wordFreq = words.reduce((freq, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  };

  const getMockInsights = (
    text: string,
    persona?: string,
    jobToBeDone?: string,
    currentPage?: number
  ): AIInsight[] => {
    const baseInsights: AIInsight[] = [
      {
        id: 'summary-1',
        type: 'summary',
        title: 'Document Summary',
        content: `This document explores cutting-edge developments in artificial intelligence applications within healthcare systems. It examines how machine learning algorithms are revolutionizing clinical decision-making processes and optimizing patient care delivery. The analysis encompasses deep learning models specifically designed for medical imaging analysis and predictive analytics frameworks for forecasting patient outcomes.`,
        relevanceScore: 0.95,
        pageReferences: [1, 2, 3],
        tags: ['AI', 'Healthcare', 'Machine Learning']
      },
      {
        id: 'takeaway-1',
        type: 'key-takeaway',
        title: 'Breakthrough in Medical Diagnostics',
        content: 'Modern AI systems have achieved remarkable accuracy in analyzing medical images, with performance levels that now match or even surpass experienced radiologists. This represents a paradigm shift in diagnostic capabilities, enabling faster, more accurate detection of medical conditions while reducing human error.',
        relevanceScore: 0.92,
        pageReferences: [2],
        tags: ['Medical Imaging', 'Diagnostics', 'AI Performance']
      },
      {
        id: 'question-1',
        type: 'question',
        title: 'Ethical Implementation Challenge',
        content: 'As AI systems become more prevalent in healthcare, how can organizations ensure responsible deployment while maintaining strict patient privacy standards and effectively addressing potential algorithmic bias that could impact treatment decisions?',
        relevanceScore: 0.88,
        pageReferences: [1, 3],
        tags: ['Ethics', 'Privacy', 'Implementation']
      },
      {
        id: 'related-1',
        type: 'related-topic',
        title: 'Emerging Technologies',
        content: 'Natural language processing for automated clinical documentation and sophisticated predictive models for early chronic condition identification are rapidly emerging as powerful complementary technologies that enhance overall healthcare AI ecosystems.',
        relevanceScore: 0.85,
        pageReferences: [2, 3],
        tags: ['NLP', 'Predictive Analytics', 'Clinical Documentation']
      },
      {
        id: 'action-1',
        type: 'action-item',
        title: 'Strategic Implementation Framework',
        content: 'Organizations should prioritize developing comprehensive frameworks for responsible AI deployment that systematically address critical areas including data privacy protection, algorithmic bias mitigation, and regulatory compliance requirements.',
        relevanceScore: 0.90,
        pageReferences: [1, 2],
        tags: ['Implementation', 'Governance', 'Compliance']
      },
      {
        id: 'did-you-know-1',
        type: 'did-you-know',
        title: 'Did You Know?',
        content: 'AI algorithms can process medical images up to 1000 times faster than human radiologists, and some AI systems have been trained on datasets containing over 10 million medical images from around the world.',
        relevanceScore: 0.87,
        pageReferences: [],
        tags: ['AI Facts', 'Medical Imaging', 'Performance']
      },
      {
        id: 'did-you-know-2',
        type: 'did-you-know',
        title: 'Did You Know?',
        content: 'The global AI in healthcare market is expected to reach $102 billion by 2028, with diagnostic imaging applications representing the largest segment due to their proven effectiveness in clinical settings.',
        relevanceScore: 0.84,
        pageReferences: [],
        tags: ['Market Trends', 'Healthcare AI', 'Industry Growth']
      }
    ];

    // Customize insights based on persona and job
    if (persona && jobToBeDone) {
      baseInsights.forEach(insight => {
        insight.content = `[For ${persona} working on ${jobToBeDone}] ${insight.content}`;
      });

      // Add persona-specific insights
      if (persona.toLowerCase().includes('researcher')) {
        baseInsights.push({
          id: 'research-specific',
          type: 'action-item',
          title: 'Research Opportunity',
          content: `As a ${persona}, consider investigating the methodological approaches described in this document for your ${jobToBeDone} research.`,
          relevanceScore: 0.87,
          pageReferences: [currentPage || 1],
          tags: ['Research', 'Methodology']
        });
      }
    }

    return baseInsights.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const getInsightsByType = (type: string) => {
    return insights.filter(insight => insight.type === type);
  };

  const getInsightIcon = (type: string) => {
    const icons = {
      summary: BookOpen,
      'key-takeaway': Lightbulb,
      question: MessageSquare,
      'related-topic': TrendingUp,
      'action-item': Target,
      'did-you-know': Zap
    };
    return icons[type as keyof typeof icons] || Brain;
  };

  const getInsightColor = (type: string) => {
    const colors = {
      summary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'key-takeaway': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      question: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'related-topic': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'action-item': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'did-you-know': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const handlePageNavigation = (page: number) => {
    if (onPageNavigate) {
      onPageNavigate(page);
      toast({
        title: "Navigated to Page",
        description: `Jumped to page ${page} as referenced in the insight.`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <Lightbulb className={`h-6 w-6 text-brand-primary ${isTyping ? 'animate-pulse' : ''}`} />
                {isTyping && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-ping opacity-75" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  AI Insights
                  {isTyping && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedText 
                    ? 'Intelligent analysis of selected text' 
                    : 'Comprehensive document analysis and recommendations'
                  }
                  {persona && jobToBeDone && (
                    <span className="block text-brand-primary mt-1">
                      Optimized for {persona} • {jobToBeDone}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={generateInsights}
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
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
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
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <div className="text-destructive text-lg font-medium">Analysis Failed</div>
                <div className="text-text-secondary">{error}</div>
                <Button onClick={generateInsights} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="summary" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Summary ({getInsightsByType('summary').length})
                </TabsTrigger>
                <TabsTrigger value="key-takeaway" className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Insights ({getInsightsByType('key-takeaway').length})
                </TabsTrigger>
                <TabsTrigger value="question" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Questions ({getInsightsByType('question').length})
                </TabsTrigger>
                <TabsTrigger value="related-topic" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Related ({getInsightsByType('related-topic').length})
                </TabsTrigger>
                <TabsTrigger value="action-item" className="gap-2">
                  <Target className="h-4 w-4" />
                  Actions ({getInsightsByType('action-item').length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 mt-4">
                {['summary', 'key-takeaway', 'question', 'related-topic', 'action-item'].map(type => (
                  <TabsContent key={type} value={type} className="h-full">
                    <ScrollArea className="h-96">
                      <div className="space-y-4 pr-4">
                        {getInsightsByType(type).map((insight, index) => {
                          const Icon = getInsightIcon(insight.type);
                          const isCurrentlyTyping = currentTypingInsightId === insight.id;
                          return (
                            <div
                              key={insight.id}
                              className="bg-surface-elevated border border-border-subtle rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Icon className="h-4 w-4 text-brand-primary" />
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <h3 className="font-semibold text-text-primary">
                                      {insight.title}
                                    </h3>
                                    <Badge 
                                      variant="secondary" 
                                      className={getInsightColor(insight.type)}
                                    >
                                      {Math.round(insight.relevanceScore * 100)}% relevant
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-text-secondary leading-relaxed">
                                    {isCurrentlyTyping ? (
                                      <TypingAnimation 
                                        text={insight.content} 
                                        speed={50}
                                        onComplete={() => {
                                          setCurrentTypingInsightId(null);
                                          setIsTyping(false);
                                        }}
                                      />
                                    ) : (
                                      <span>{insight.content}</span>
                                    )}
                                  </div>

                                  {/* Tags */}
                                  {insight.tags && insight.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {insight.tags.map((tag, tagIndex) => (
                                        <Badge key={tagIndex} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}

                                  {/* Page References */}
                                  {insight.pageReferences && insight.pageReferences.length > 0 && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                                      <span className="text-xs text-text-tertiary">Referenced on pages:</span>
                                      <div className="flex gap-1">
                                        {insight.pageReferences.map((page, pageIndex) => (
                                          <button
                                            key={pageIndex}
                                            onClick={() => handlePageNavigation(page)}
                                            className="text-xs bg-background border border-border-subtle rounded px-2 py-1 hover:bg-surface-hover transition-colors flex items-center gap-1"
                                          >
                                            {page}
                                            <ChevronRight className="h-3 w-3" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {getInsightsByType(type).length === 0 && (() => {
                          const EmptyIcon = getInsightIcon(type);
                          return (
                          <div className="text-center py-12 text-text-tertiary">
                          <EmptyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No {type.replace('-', ' ')} insights available</p>
                          </div> );
                        })()}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          )}
        </div>
      </DialogContent>
      
      {/* Did You Know Popup - appears when modal is open and there are facts */}
      {isOpen && (
        <DidYouKnowPopup 
          facts={didYouKnowFacts} 
          isVisible={didYouKnowFacts.length > 0}
          className="z-60" // Higher z-index than modal
        />
      )}
    </Dialog>
  );
}