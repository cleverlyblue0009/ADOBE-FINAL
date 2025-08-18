import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Brain, 
  Lightbulb, 
  BookOpen, 
  Target, 
  MessageSquare, 
  Loader2,
  Download,
  Copy,
  Share2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface AIInsight {
  id: string;
  type: 'summary' | 'key_takeaway' | 'question' | 'topic' | 'recommendation';
  title: string;
  content: string;
  confidence: number;
  relevance: number;
}

export interface AIInsightsData {
  documentSummary: string;
  keyTakeaways: string[];
  suggestedQuestions: string[];
  relatedTopics: string[];
  insights: AIInsight[];
  processingTime: number;
  confidence: number;
}

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentContent?: string;
  currentPage?: number;
  selectedText?: string;
}

interface LoadingState {
  isLoading: boolean;
  stage: 'analyzing' | 'generating' | 'finalizing' | 'complete';
  progress: number;
}

export function AIInsightsModal({
  isOpen,
  onClose,
  documentName,
  documentContent,
  currentPage = 1,
  selectedText
}: AIInsightsModalProps) {
  const [insightsData, setInsightsData] = useState<AIInsightsData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    stage: 'analyzing',
    progress: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'takeaways' | 'questions' | 'topics'>('summary');

  const modalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate insights when modal opens
  useEffect(() => {
    if (isOpen && !insightsData && !loadingState.isLoading) {
      generateInsights();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const generateInsights = async () => {
    setLoadingState({ isLoading: true, stage: 'analyzing', progress: 10 });
    setError(null);

    try {
      // Stage 1: Analyzing
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoadingState({ isLoading: true, stage: 'analyzing', progress: 30 });

      // Stage 2: Generating
      setLoadingState({ isLoading: true, stage: 'generating', progress: 50 });
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Stage 3: Finalizing
      setLoadingState({ isLoading: true, stage: 'finalizing', progress: 80 });
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock API call - in real implementation, this would call your AI service
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentName,
          documentContent: documentContent || 'Sample document content for analysis',
          currentPage,
          selectedText,
          analysisType: 'comprehensive'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      
      // If API doesn't exist, use mock data
      const mockData: AIInsightsData = {
        documentSummary: "This document presents a comprehensive analysis of artificial intelligence applications in healthcare. It covers current implementations, challenges, and future prospects for AI-driven medical technologies. The research synthesizes findings from 412 peer-reviewed studies and provides evidence-based recommendations for healthcare organizations.",
        keyTakeaways: [
          "AI systems in medical imaging achieve 94% accuracy in diagnostic tasks, matching or exceeding human radiologists",
          "Natural language processing models can extract meaningful insights from 89% of unstructured clinical notes",
          "Predictive analytics reduces hospital readmissions by 23% when properly implemented",
          "Data privacy and algorithmic bias remain the primary barriers to widespread AI adoption",
          "Integration costs average $2.3M per hospital system but show 18-month ROI"
        ],
        suggestedQuestions: [
          "What are the main ethical considerations when implementing AI in healthcare?",
          "How can healthcare organizations address algorithmic bias in AI systems?",
          "What regulatory frameworks exist for AI in medical devices?",
          "How does AI performance compare across different medical specialties?",
          "What are the key success factors for AI implementation in hospitals?"
        ],
        relatedTopics: [
          "Medical Device Regulation",
          "Healthcare Data Privacy",
          "Clinical Decision Support Systems",
          "Telemedicine and Remote Monitoring",
          "Electronic Health Records Integration",
          "AI Ethics in Medicine"
        ],
        insights: [
          {
            id: '1',
            type: 'summary',
            title: 'Document Overview',
            content: 'Comprehensive review of AI applications in healthcare with focus on practical implementation',
            confidence: 0.92,
            relevance: 0.95
          },
          {
            id: '2',
            type: 'key_takeaway',
            title: 'Performance Metrics',
            content: 'AI diagnostic accuracy reaches 94% with significant improvements in efficiency',
            confidence: 0.88,
            relevance: 0.91
          },
          {
            id: '3',
            type: 'recommendation',
            title: 'Implementation Strategy',
            content: 'Phased rollout with pilot programs recommended to address integration challenges',
            confidence: 0.85,
            relevance: 0.89
          }
        ],
        processingTime: 2.3,
        confidence: 0.89
      };

      setInsightsData(data.insights ? data : mockData);
      setLoadingState({ isLoading: false, stage: 'complete', progress: 100 });

    } catch (error) {
      console.error('Error generating insights:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate insights');
      setLoadingState({ isLoading: false, stage: 'complete', progress: 0 });
    }
  };

  const handleCopyInsights = async () => {
    if (!insightsData) return;

    const insightsText = `
AI Insights for: ${documentName}

SUMMARY:
${insightsData.documentSummary}

KEY TAKEAWAYS:
${insightsData.keyTakeaways.map((takeaway, index) => `${index + 1}. ${takeaway}`).join('\n')}

SUGGESTED QUESTIONS:
${insightsData.suggestedQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}

RELATED TOPICS:
${insightsData.relatedTopics.join(', ')}
    `.trim();

    try {
      await navigator.clipboard.writeText(insightsText);
      toast({
        title: "Copied to Clipboard",
        description: "AI insights have been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleDownloadInsights = () => {
    if (!insightsData) return;

    const insightsText = `
AI Insights Report
Document: ${documentName}
Generated: ${new Date().toLocaleString()}
Processing Time: ${insightsData.processingTime}s
Confidence: ${Math.round(insightsData.confidence * 100)}%

EXECUTIVE SUMMARY
${insightsData.documentSummary}

KEY TAKEAWAYS
${insightsData.keyTakeaways.map((takeaway, index) => `${index + 1}. ${takeaway}`).join('\n')}

SUGGESTED QUESTIONS FOR FURTHER EXPLORATION
${insightsData.suggestedQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}

RELATED TOPICS
${insightsData.relatedTopics.join('\n• ')}
    `.trim();

    const blob = new Blob([insightsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI_Insights_${documentName.replace(/[^a-z0-9]/gi, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "AI insights report has been downloaded",
    });
  };

  const handleRefreshInsights = () => {
    setInsightsData(null);
    setError(null);
    generateInsights();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
        tabIndex={-1}
        role="dialog"
        aria-labelledby="ai-insights-title"
        aria-describedby="ai-insights-description"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="ai-insights-title" className="text-xl font-semibold text-white">
                AI Insights
              </h2>
              <p id="ai-insights-description" className="text-sm text-gray-400">
                {documentName} • Page {currentPage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {insightsData && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshInsights}
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyInsights}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadInsights}
                  className="text-gray-400 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loadingState.isLoading ? (
            <LoadingView loadingState={loadingState} />
          ) : error ? (
            <ErrorView error={error} onRetry={generateInsights} />
          ) : insightsData ? (
            <InsightsView
              data={insightsData}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LoadingView({ loadingState }: { loadingState: LoadingState }) {
  const stageMessages = {
    analyzing: 'Analyzing document content...',
    generating: 'Generating insights with AI...',
    finalizing: 'Finalizing recommendations...',
    complete: 'Complete!'
  };

  return (
    <div className="flex flex-col items-center justify-center h-96 p-8">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">
        {stageMessages[loadingState.stage]}
      </h3>
      <div className="w-64 bg-gray-700 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${loadingState.progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-400 text-center">
        This may take a few moments while we analyze your document and generate personalized insights.
      </p>
    </div>
  );
}

function ErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 p-8">
      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-6">
        <X className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">Failed to Generate Insights</h3>
      <p className="text-sm text-gray-400 text-center mb-6 max-w-md">
        {error}
      </p>
      <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}

function InsightsView({
  data,
  activeTab,
  onTabChange
}: {
  data: AIInsightsData;
  activeTab: string;
  onTabChange: (tab: 'summary' | 'takeaways' | 'questions' | 'topics') => void;
}) {
  const tabs = [
    { id: 'summary', label: 'Summary', icon: BookOpen },
    { id: 'takeaways', label: 'Key Takeaways', icon: Lightbulb },
    { id: 'questions', label: 'Questions', icon: MessageSquare },
    { id: 'topics', label: 'Related Topics', icon: Target },
  ] as const;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700 bg-gray-800/50">
        <div className="p-4">
          <div className="text-xs text-gray-400 mb-3">
            Confidence: {Math.round(data.confidence * 100)}% • {data.processingTime}s
          </div>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {activeTab === 'summary' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Document Summary</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300 leading-relaxed">{data.documentSummary}</p>
              </div>
            </div>
          )}

          {activeTab === 'takeaways' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Key Takeaways</h3>
              <div className="space-y-3">
                {data.keyTakeaways.map((takeaway, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-300 leading-relaxed">{takeaway}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Suggested Questions</h3>
              <div className="space-y-3">
                {data.suggestedQuestions.map((question, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300 leading-relaxed">{question}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Related Topics</h3>
              <div className="grid grid-cols-2 gap-3">
                {data.relatedTopics.map((topic, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300 text-sm">{topic}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIInsightsModal;