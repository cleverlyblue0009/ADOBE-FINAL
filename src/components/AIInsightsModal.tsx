import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Brain, 
  Lightbulb, 
  FileText, 
  TrendingUp, 
  MessageSquare, 
  Download,
  Copy,
  RefreshCw,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIInsight {
  id: string;
  type: 'summary' | 'key_takeaway' | 'question' | 'topic' | 'recommendation';
  title: string;
  content: string;
  importance: number;
  relatedPages?: number[];
  confidence: number;
}

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentContent: string;
  currentPage: number;
  totalPages: number;
  onNavigateToPage?: (page: number) => void;
}

export function AIInsightsModal({
  isOpen,
  onClose,
  documentName,
  documentContent,
  currentPage,
  totalPages,
  onNavigateToPage
}: AIInsightsModalProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'takeaways' | 'questions' | 'topics'>('overview');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Generate AI insights when modal opens
  useEffect(() => {
    if (isOpen && documentContent) {
      generateAIInsights();
    }
  }, [isOpen, documentContent]);

  const generateAIInsights = async () => {
    setIsLoading(true);
    try {
      // Simulate AI insight generation
      // In a real implementation, this would call your AI service
      const generatedInsights = await simulateAIInsights(documentContent, documentName);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast({
        title: "Insights Generation Failed",
        description: "Unable to generate AI insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate AI insights generation
  const simulateAIInsights = async (content: string, docName: string): Promise<AIInsight[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return [
      {
        id: 'summary-1',
        type: 'summary',
        title: 'Document Summary',
        content: 'This document presents a comprehensive analysis of artificial intelligence applications in healthcare. It explores current implementations, challenges, and future opportunities for AI integration in medical systems.',
        importance: 0.95,
        confidence: 0.92,
        relatedPages: [1, 2, 3]
      },
      {
        id: 'takeaway-1',
        type: 'key_takeaway',
        title: 'AI Transforms Medical Imaging',
        content: 'Deep learning models have achieved accuracy matching or exceeding experienced radiologists in medical image analysis, representing a significant breakthrough in diagnostic capabilities.',
        importance: 0.9,
        confidence: 0.88,
        relatedPages: [2, 5, 8]
      },
      {
        id: 'takeaway-2',
        type: 'key_takeaway',
        title: 'Implementation Challenges',
        content: 'Key barriers to AI adoption include data privacy concerns, algorithmic bias, regulatory compliance, and the need for extensive validation in clinical settings.',
        importance: 0.85,
        confidence: 0.85,
        relatedPages: [4, 6, 9]
      },
      {
        id: 'question-1',
        type: 'question',
        title: 'How can healthcare organizations ensure AI system reliability?',
        content: 'Consider implementing robust validation frameworks, continuous monitoring systems, and human-AI collaboration protocols to maintain high standards of patient care.',
        importance: 0.8,
        confidence: 0.82,
        relatedPages: [7, 10]
      },
      {
        id: 'question-2',
        type: 'question',
        title: 'What are the ethical implications of AI in healthcare?',
        content: 'Explore topics such as patient consent, data ownership, algorithmic transparency, and the balance between automation and human oversight in medical decision-making.',
        importance: 0.75,
        confidence: 0.79,
        relatedPages: [11, 12]
      },
      {
        id: 'topic-1',
        type: 'topic',
        title: 'Natural Language Processing in Clinical Documentation',
        content: 'NLP technologies are revolutionizing how clinical notes are processed, analyzed, and utilized for patient care improvements and research insights.',
        importance: 0.82,
        confidence: 0.86,
        relatedPages: [3, 6]
      },
      {
        id: 'topic-2',
        type: 'topic',
        title: 'Predictive Analytics for Patient Outcomes',
        content: 'Machine learning models are increasingly used to predict patient risks, optimize treatment plans, and improve resource allocation in healthcare facilities.',
        importance: 0.87,
        confidence: 0.84,
        relatedPages: [4, 7, 9]
      },
      {
        id: 'recommendation-1',
        type: 'recommendation',
        title: 'Develop Comprehensive AI Governance Framework',
        content: 'Organizations should establish clear guidelines for AI deployment, including ethical standards, validation procedures, and ongoing monitoring protocols.',
        importance: 0.78,
        confidence: 0.81,
        relatedPages: [10, 11]
      }
    ];
  };

  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  const copyInsight = (insight: AIInsight) => {
    const text = `${insight.title}\n\n${insight.content}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Insight has been copied to your clipboard.",
    });
  };

  const downloadInsights = () => {
    const content = insights.map(insight => 
      `${insight.title}\n${'='.repeat(insight.title.length)}\n\n${insight.content}\n\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentName}-ai-insights.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "AI insights have been downloaded as a text file.",
    });
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'summary': return <FileText className="w-4 h-4" />;
      case 'key_takeaway': return <Star className="w-4 h-4" />;
      case 'question': return <MessageSquare className="w-4 h-4" />;
      case 'topic': return <Lightbulb className="w-4 h-4" />;
      case 'recommendation': return <TrendingUp className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'summary': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'key_takeaway': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'question': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'topic': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'recommendation': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const filteredInsights = insights.filter(insight => {
    switch (activeTab) {
      case 'overview': return insight.type === 'summary';
      case 'takeaways': return insight.type === 'key_takeaway';
      case 'questions': return insight.type === 'question';
      case 'topics': return insight.type === 'topic' || insight.type === 'recommendation';
      default: return true;
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Insights</h2>
              <p className="text-sm text-gray-400">{documentName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={generateAIInsights}
              disabled={isLoading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadInsights}
              className="text-gray-400 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-4 border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', count: insights.filter(i => i.type === 'summary').length },
            { id: 'takeaways', label: 'Key Takeaways', count: insights.filter(i => i.type === 'key_takeaway').length },
            { id: 'questions', label: 'Questions', count: insights.filter(i => i.type === 'question').length },
            { id: 'topics', label: 'Topics & Recommendations', count: insights.filter(i => i.type === 'topic' || i.type === 'recommendation').length }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="gap-2"
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                  {tab.count}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Analyzing Document</h3>
                  <p className="text-gray-400">AI is processing your document to generate insights...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 overflow-y-auto h-full">
              <div className="space-y-4">
                {filteredInsights.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">No insights available</h3>
                    <p className="text-gray-500">Try refreshing or check other tabs for more insights.</p>
                  </div>
                ) : (
                  filteredInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`border rounded-lg p-4 ${getInsightColor(insight.type)} transition-all duration-200 hover:shadow-lg`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-0.5">
                            {getInsightIcon(insight.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white text-lg">{insight.title}</h3>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <span className="text-xs text-gray-400">
                                  {Math.round(insight.confidence * 100)}% confidence
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-gray-300 leading-relaxed mb-3">
                              {expandedInsights.has(insight.id) 
                                ? insight.content 
                                : `${insight.content.substring(0, 200)}${insight.content.length > 200 ? '...' : ''}`
                              }
                            </p>
                            
                            {insight.relatedPages && insight.relatedPages.length > 0 && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs text-gray-400">Related pages:</span>
                                <div className="flex gap-1">
                                  {insight.relatedPages.slice(0, 5).map(page => (
                                    <button
                                      key={page}
                                      onClick={() => onNavigateToPage?.(page)}
                                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
                                    >
                                      {page}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {insight.content.length > 200 && (
                                  <button
                                    onClick={() => toggleInsightExpansion(insight.id)}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                  >
                                    {expandedInsights.has(insight.id) ? (
                                      <>Show Less <ChevronUp className="w-3 h-3" /></>
                                    ) : (
                                      <>Show More <ChevronDown className="w-3 h-3" /></>
                                    )}
                                  </button>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyInsight(insight)}
                                className="text-gray-400 hover:text-white h-6 px-2"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Generated {insights.length} insights • Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}