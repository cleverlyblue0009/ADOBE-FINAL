import React, { useState, useCallback } from 'react';
import { EnhancedCustomTextSelectionMenu } from './EnhancedCustomTextSelectionMenu';
import { EnhancedTranslatePanel } from './EnhancedTranslatePanel';
import { EnhancedSimplifyPanel } from './EnhancedSimplifyPanel';
import { ImprovedAIInsightsPanel } from './ImprovedAIInsightsPanel';
import { EnhancedCrossConnectionsPanel } from './EnhancedCrossConnectionsPanel';
import { EnhancedStrategyPanel } from './EnhancedStrategyPanel';
import { useToast } from '@/hooks/use-toast';

interface EnhancedPDFReaderIntegrationProps {
  // Text selection props
  selectedText?: string;
  selectionPosition?: { x: number; y: number } | null;
  pageContext?: string;
  documentId?: string;
  
  // Document props
  currentPage?: number;
  totalPages?: number;
  persona?: string;
  jobToBeDone?: string;
  
  // Panel states
  activeRightPanel?: string | null;
  activeLeftPanel?: string | null;
  
  // Callbacks
  onHighlight?: (color: 'yellow' | 'green' | 'blue' | 'pink') => void;
  onCloseTextMenu?: () => void;
  onPageNavigate?: (page: number) => void;
  onNavigateToDocument?: (documentId: string) => void;
  onPanelChange?: (panel: string, side: 'left' | 'right') => void;
}

export function EnhancedPDFReaderIntegration({
  selectedText = '',
  selectionPosition,
  pageContext,
  documentId = 'default-doc',
  currentPage = 1,
  totalPages = 100,
  persona = 'professional',
  jobToBeDone = 'learning',
  activeRightPanel,
  activeLeftPanel,
  onHighlight,
  onCloseTextMenu,
  onPageNavigate,
  onNavigateToDocument,
  onPanelChange
}: EnhancedPDFReaderIntegrationProps) {
  const [selectedTextForSimplify, setSelectedTextForSimplify] = useState<string>('');
  const [selectedTextForTranslate, setSelectedTextForTranslate] = useState<string>('');
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsText, setInsightsText] = useState<string>('');
  const { toast } = useToast();

  const handleOpenSimplify = useCallback((text: string) => {
    setSelectedTextForSimplify(text);
    onPanelChange?.('simplify', 'right');
    
    toast({
      title: "Simplify Panel Opened",
      description: "Text will be simplified in the right sidebar",
    });
  }, [onPanelChange, toast]);

  const handleOpenTranslate = useCallback((text: string) => {
    setSelectedTextForTranslate(text);
    onPanelChange?.('translate', 'left');
    
    toast({
      title: "Translate Panel Opened",
      description: "Text will be translated in the left sidebar",
    });
  }, [onPanelChange, toast]);

  const handleOpenInsights = useCallback((text: string) => {
    setInsightsText(text);
    setShowInsightsModal(true);
    
    toast({
      title: "AI Insights Generated",
      description: "Comprehensive analysis is being generated",
    });
  }, [toast]);

  return (
    <>
      {/* Enhanced Text Selection Menu */}
      {selectedText && selectionPosition && (
        <EnhancedCustomTextSelectionMenu
          selectedText={selectedText}
          position={selectionPosition}
          pageContext={pageContext}
          documentId={documentId}
          onHighlight={onHighlight}
          onClose={onCloseTextMenu || (() => {})}
          onOpenSimplify={handleOpenSimplify}
          onOpenTranslate={handleOpenTranslate}
          onOpenInsights={handleOpenInsights}
        />
      )}

      {/* Right Panel Components */}
      {activeRightPanel === 'simplify' && (
        <EnhancedSimplifyPanel
          originalText={selectedTextForSimplify}
          onSimplifiedText={(text, level) => {
            console.log('Text simplified:', { text, level });
            toast({
              title: "Text Simplified",
              description: `Simplified to ${level} level`,
            });
          }}
          className="h-full"
        />
      )}

      {activeRightPanel === 'insights' && (
        <ImprovedAIInsightsPanel
          documentId={documentId}
          currentText={insightsText || selectedText}
          persona={persona}
          jobToBeDone={jobToBeDone}
          onPageNavigate={onPageNavigate}
          className="h-full"
        />
      )}

      {/* Left Panel Components */}
      {activeLeftPanel === 'translate' && (
        <EnhancedTranslatePanel
          originalText={selectedTextForTranslate}
          onTranslatedText={(text, language) => {
            console.log('Text translated:', { text, language });
            toast({
              title: "Translation Complete",
              description: `Translated to ${language}`,
            });
          }}
          className="h-full"
        />
      )}

      {activeLeftPanel === 'connections' && (
        <EnhancedCrossConnectionsPanel
          documentId={documentId}
          persona={persona}
          jobToBeDone={jobToBeDone}
          onNavigateToDocument={onNavigateToDocument}
          className="h-full"
        />
      )}

      {activeLeftPanel === 'strategic' && (
        <EnhancedStrategyPanel
          persona={persona}
          jobToBeDone={jobToBeDone}
          documentContext={pageContext}
          currentPage={currentPage}
          totalPages={totalPages}
          className="h-full"
        />
      )}

      {/* AI Insights Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
            <ImprovedAIInsightsPanel
              documentId={documentId}
              currentText={insightsText}
              persona={persona}
              jobToBeDone={jobToBeDone}
              onPageNavigate={(page) => {
                onPageNavigate?.(page);
                setShowInsightsModal(false);
              }}
              className="h-[80vh]"
            />
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowInsightsModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Integration hooks for existing components
export const useEnhancedPDFReader = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeRightPanel, setActiveRightPanel] = useState<string | null>('highlights');
  const [activeLeftPanel, setActiveLeftPanel] = useState<string | null>(null);

  const handleTextSelection = useCallback((text: string, position: { x: number; y: number }) => {
    setSelectedText(text);
    setSelectionPosition(position);
  }, []);

  const handleCloseTextMenu = useCallback(() => {
    setSelectionPosition(null);
  }, []);

  const handlePanelChange = useCallback((panel: string, side: 'left' | 'right') => {
    if (side === 'right') {
      setActiveRightPanel(activeRightPanel === panel ? null : panel);
    } else {
      setActiveLeftPanel(activeLeftPanel === panel ? null : panel);
    }
  }, [activeRightPanel, activeLeftPanel]);

  return {
    selectedText,
    selectionPosition,
    activeRightPanel,
    activeLeftPanel,
    handleTextSelection,
    handleCloseTextMenu,
    handlePanelChange,
    setActiveRightPanel,
    setActiveLeftPanel
  };
};

// Enhanced LLM Integration utilities
export const enhancedLLMUtils = {
  // Ensure all API calls use real LLM endpoints
  validateLLMConnection: async () => {
    try {
      const response = await fetch('/api/health');
      return response.ok;
    } catch (error) {
      console.warn('LLM connection not available, using fallback');
      return false;
    }
  },

  // Enhanced error handling for LLM failures
  handleLLMError: (error: Error, fallbackData: any) => {
    console.error('LLM Error:', error);
    return {
      success: false,
      data: fallbackData,
      error: error.message,
      usingFallback: true
    };
  },

  // Retry logic for LLM calls
  retryLLMCall: async (apiCall: () => Promise<any>, maxRetries: number = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
};