import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Copy,
  Lightbulb,
  Highlighter,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { apiService } from '@/lib/api';

// Import existing interfaces
export interface Highlight {
  id: string;
  text: string;
  page: number;
  color: 'primary' | 'secondary' | 'tertiary';
  relevanceScore: number;
  explanation: string;
  position?: { x: number; y: number; width: number; height: number };
  timestamp?: string;
}

interface FallbackPDFViewerProps {
  documentUrl: string;
  documentName: string;
  onPageChange?: (page: number) => void;
  onTextSelection?: (text: string, page: number) => void;
  highlights?: Highlight[];
  currentHighlightPage?: number;
  goToSection?: { page: number; section?: string } | null;
  onHighlight?: (highlight: Highlight) => void;
}

interface ContextMenuState {
  visible: boolean;
  selectedText: string;
  position: { x: number; y: number; width: number; height: number } | null;
  pageNumber: number;
}

interface AiPopupState {
  visible: boolean;
  type: 'simplify' | 'insights';
  originalText: string;
  result: string;
  title: string;
  loading: boolean;
}

// Context Menu Component
function ContextMenu({ 
  contextMenu, 
  onClose, 
  onSimplify, 
  onInsights, 
  onHighlight, 
  onCopy,
  loading 
}: { 
  contextMenu: ContextMenuState; 
  onClose: () => void;
  onSimplify: () => void;
  onInsights: () => void;
  onHighlight: (color: 'primary' | 'secondary' | 'tertiary') => void;
  onCopy: () => void;
  loading: boolean;
}) {
  if (!contextMenu.visible) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      <div 
        className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl py-1 min-w-56"
        style={{
          left: `${contextMenu.position?.x || 0}px`,
          top: `${contextMenu.position?.y || 0}px`,
          transform: 'translate(-50%, 0)'
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700 max-w-64">
          <div className="truncate font-medium">"{contextMenu.selectedText}"</div>
        </div>

        <button
          className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3 text-sm"
          onClick={() => { onHighlight('primary'); onClose(); }}
        >
          <Highlighter className="w-4 h-4" />
          <span>Highlight</span>
        </button>
        
        <button
          className={`w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3 text-sm ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={() => { if (!loading) onSimplify(); }}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-lg">🧠</span>}
          <span>Simplify with AI</span>
        </button>
        
        <button
          className={`w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3 text-sm ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={() => { if (!loading) onInsights(); }}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
          <span>Generate Insights</span>
        </button>
        
        <button
          className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3 text-sm"
          onClick={() => { onCopy(); onClose(); }}
        >
          <Copy className="w-4 h-4" />
          <span>Copy Text</span>
        </button>
      </div>
    </>
  );
}

// AI Result Popup Component
function AiPopup({ aiPopup, onClose }: { aiPopup: AiPopupState; onClose: () => void }) {
  if (!aiPopup.visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">{aiPopup.title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-96">
          {aiPopup.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-300">Processing with AI...</span>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Original Text:</h4>
                <p className="text-gray-300 text-sm bg-gray-800 p-3 rounded border-l-4 border-gray-600">
                  {aiPopup.originalText}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">AI Result:</h4>
                <div className="text-white bg-gray-800 p-3 rounded border-l-4 border-blue-500">
                  {aiPopup.result.split('\n').map((line, index) => (
                    <p key={index} className="mb-2 last:mb-0">{line}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!aiPopup.loading && (
            <Button onClick={() => {
              navigator.clipboard.writeText(aiPopup.result);
              onClose();
            }}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Result
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FallbackPDFViewer({
  documentUrl,
  documentName,
  onPageChange,
  onTextSelection,
  highlights = [],
  currentHighlightPage,
  goToSection,
  onHighlight
}: FallbackPDFViewerProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Context menu and AI states
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    selectedText: '',
    position: null,
    pageNumber: 1
  });
  const [aiPopup, setAiPopup] = useState<AiPopupState>({
    visible: false,
    type: 'simplify',
    originalText: '',
    result: '',
    title: '',
    loading: false
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Handle text selection (limited in iframe)
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 3) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setContextMenu({
      visible: true,
      selectedText,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        width: rect.width,
        height: rect.height
      },
      pageNumber: currentPage
    });

    onTextSelection?.(selectedText, currentPage);
  }, [currentPage, onTextSelection]);

  // Handle context menu close
  const handleContextMenuClose = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle AI simplify
  const handleSimplify = useCallback(async () => {
    if (!contextMenu.selectedText) return;

    setLoading(true);
    setAiPopup({
      visible: true,
      type: 'simplify',
      originalText: contextMenu.selectedText,
      result: '',
      title: '🧠 AI Simplification',
      loading: true
    });

    try {
      const result = await apiService.simplifyText(contextMenu.selectedText);
      setAiPopup(prev => ({
        ...prev,
        result: result.text || 'AI simplification completed.',
        loading: false
      }));
    } catch (error) {
      console.error('Simplify error:', error);
      setAiPopup(prev => ({
        ...prev,
        result: 'Sorry, AI simplification is temporarily unavailable. Please try again later.',
        loading: false
      }));
    } finally {
      setLoading(false);
    }
  }, [contextMenu.selectedText]);

  // Handle AI insights
  const handleInsights = useCallback(async () => {
    if (!contextMenu.selectedText) return;

    setLoading(true);
    setAiPopup({
      visible: true,
      type: 'insights',
      originalText: contextMenu.selectedText,
      result: '',
      title: '💡 AI Insights',
      loading: true
    });

    try {
      const insights = await apiService.generateInsights(
        contextMenu.selectedText,
        'Professional',
        'Understanding key concepts'
      );
      
      const formattedResult = insights.map((insight, index) => 
        `${index + 1}. ${insight.content}`
      ).join('\n\n');
      
      setAiPopup(prev => ({
        ...prev,
        result: formattedResult || 'AI insights generated successfully.',
        loading: false
      }));
    } catch (error) {
      console.error('Insights error:', error);
      setAiPopup(prev => ({
        ...prev,
        result: 'Sorry, AI insights are temporarily unavailable. Please try again later.',
        loading: false
      }));
    } finally {
      setLoading(false);
    }
  }, [contextMenu.selectedText]);

  // Handle highlight creation
  const handleHighlight = useCallback((color: 'primary' | 'secondary' | 'tertiary') => {
    if (!contextMenu.selectedText || !contextMenu.position) return;

    const highlight: Highlight = {
      id: `highlight-${Date.now()}`,
      text: contextMenu.selectedText,
      page: contextMenu.pageNumber,
      color,
      relevanceScore: 0.85,
      explanation: 'User highlighted text',
      position: contextMenu.position,
      timestamp: new Date().toISOString()
    };

    onHighlight?.(highlight);
    
    toast({
      title: "Text Highlighted",
      description: `Added ${color} highlight on page ${contextMenu.pageNumber}`,
    });
  }, [contextMenu, onHighlight, toast]);

  // Handle copy text
  const handleCopy = useCallback(() => {
    if (contextMenu.selectedText) {
      navigator.clipboard.writeText(contextMenu.selectedText);
      toast({
        title: "Text Copied",
        description: "Selected text copied to clipboard",
      });
    }
  }, [contextMenu.selectedText, toast]);

  // Handle text selection events
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => handleTextSelection(), 10);
    };

    const handleContextMenuEvent = (event: MouseEvent) => {
      if (iframeRef.current?.contains(event.target as Node)) {
        event.preventDefault();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', handleContextMenuEvent);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('contextmenu', handleContextMenuEvent);
    };
  }, [handleTextSelection]);

  // Handle go to section
  useEffect(() => {
    if (goToSection) {
      setCurrentPage(goToSection.page);
      onPageChange?.(goToSection.page);
    }
  }, [goToSection, onPageChange]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-yellow-300">Fallback PDF Viewer</span>
          <h3 className="font-medium truncate max-w-64">{documentName}</h3>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(documentUrl, '_blank')}>
            <Download className="w-4 h-4" />
            Open in Browser
          </Button>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="flex-1 overflow-hidden bg-gray-800">
        <iframe
          ref={iframeRef}
          src={`${documentUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${currentPage}&view=FitH`}
          className="w-full h-full border-0"
          title={documentName}
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={handleContextMenuClose}
        onSimplify={handleSimplify}
        onInsights={handleInsights}
        onHighlight={handleHighlight}
        onCopy={handleCopy}
        loading={loading}
      />

      {/* AI Popup */}
      <AiPopup
        aiPopup={aiPopup}
        onClose={() => setAiPopup(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
}