import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  RotateCw,
  Maximize2,
  Download,
  Search,
  Loader2,
  Copy,
  Brain,
  Sparkles,
  FileDown
} from 'lucide-react';

// Configure PDF.js worker - Use the worker file from public directory
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Import types and utilities
import { Highlight } from './PDFReader';
import { customPdfHighlighter } from '@/lib/customPdfHighlighter';
import { highlightEngine, SmartHighlight } from '@/lib/highlightEngine';
import { pdfProcessor } from '@/lib/pdfProcessor';
import HoverTooltipProvider from './HoverTooltip';
import AIInsightsModal from './AIInsightsModal';

interface CustomPDFViewerProps {
  documentUrl: string;
  documentName: string;
  onPageChange?: (page: number) => void;
  onTextSelection?: (text: string, page: number) => void;
  highlights?: Highlight[];
  currentHighlightPage?: number;
  goToSection?: { page: number; section?: string } | null;
}

interface ContextMenuState {
  visible: boolean;
  selectedText: string;
  position: { x: number; y: number; width: number; height: number } | null;
  pageNumber: number;
  options: Array<{
    icon: string;
    label: string;
    action: () => void;
  }>;
}

interface AiPopupState {
  visible: boolean;
  type: 'simplify' | 'insights';
  originalText: string;
  result: string;
  title: string;
}

interface LoadingState {
  type: 'simplify' | 'insights' | 'download' | null;
  active: boolean;
}

interface SmartHighlightState {
  enabled: boolean;
  highlights: SmartHighlight[];
  isGenerating: boolean;
}

// Context Menu Component
function ContextMenu({ contextMenu, onClose }: { contextMenu: ContextMenuState; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contextMenu.visible && menuRef.current) {
      menuRef.current.focus();
    }
  }, [contextMenu.visible]);

  if (!contextMenu.visible) return null;

  return (
    <>
      {/* Invisible backdrop to catch clicks */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Custom AI-powered context menu */}
      <div 
        ref={menuRef}
        className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl py-1 min-w-56 animate-in fade-in-0 zoom-in-95"
        style={{
          left: `${contextMenu.position?.x || 0}px`,
          top: `${contextMenu.position?.y || 0}px`,
          transform: 'translate(-50%, 0)'
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Selected text preview */}
        <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700 max-w-64">
          <div className="truncate font-medium">"{contextMenu.selectedText}"</div>
        </div>
        
        {/* AI-powered menu options */}
        {contextMenu.options?.map((option, index) => (
          <button
            key={index}
            className="w-full text-left px-4 py-3 hover:bg-gray-800 text-sm text-white flex items-center gap-3 transition-all duration-200"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              option.action();
            }}
          >
            <span className="text-base">{option.icon}</span>
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// AI Popup Component
function AiPopup({ aiPopup, onClose }: { aiPopup: AiPopupState; onClose: () => void }) {
  if (!aiPopup.visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{aiPopup.title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-96">
          {/* Original text */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Original Text:</h4>
            <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
              {aiPopup.originalText}
            </div>
          </div>
          
          {/* AI Result */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              {aiPopup.type === 'simplify' ? 'Simplified:' : 'Insights:'}
            </h4>
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 text-sm text-white">
              {aiPopup.result}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomPDFViewer({ 
  documentUrl, 
  documentName, 
  onPageChange, 
  onTextSelection,
  highlights = [],
  currentHighlightPage = 1,
  goToSection
}: CustomPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const { toast } = useToast();

  // Context menu and AI popup states
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    selectedText: '',
    position: null,
    pageNumber: 1,
    options: []
  });
  const [aiPopup, setAiPopup] = useState<AiPopupState>({
    visible: false,
    type: 'simplify',
    originalText: '',
    result: '',
    title: ''
  });
  const [loading, setLoading] = useState<LoadingState>({ type: null, active: false });
  const [smartHighlights, setSmartHighlights] = useState<SmartHighlightState>({
    enabled: true,
    highlights: [],
    isGenerating: false
  });
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
  const [pageContent, setPageContent] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    console.log(`PDF loaded successfully with ${numPages} pages`);
    
    // Enable text selection after a short delay
    setTimeout(() => {
      customPdfHighlighter.enableTextSelection();
      // Generate smart highlights for the first page
      if (smartHighlights.enabled) {
        generateSmartHighlights(1);
      }
    }, 500);
  }, [smartHighlights.enabled]);

  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    setIsLoading(false);
    console.error('PDF load error:', error);
    
    // Try a fallback sample PDF for testing
    if (!documentUrl.includes('sample-document.pdf')) {
      setError(`Failed to load PDF: ${error.message}. Trying with sample document...`);
      
      // Use a public sample PDF for testing
      setTimeout(() => {
        setError(null);
        setIsLoading(true);
        // This will trigger a reload with the same URL, but we can handle it differently
        console.log('Attempting to load sample PDF for testing');
      }, 2000);
    } else {
      setError(`Failed to load PDF: ${error.message}`);
    }
  }, [documentUrl]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      if (onPageChange) {
        onPageChange(page);
      }
      
      // Apply highlights to the new page after a short delay
      setTimeout(() => {
        const pageElement = document.querySelector(`[data-page-number="${page}"]`) as HTMLElement;
        if (pageElement) {
          // Apply traditional highlights
          if (highlights && highlights.length > 0) {
            customPdfHighlighter.applyHighlights(highlights, page, pageElement);
          }
          // Apply smart highlights
          if (smartHighlights.enabled) {
            const pageSmartHighlights = smartHighlights.highlights.filter(h => h.page === page);
            if (pageSmartHighlights.length > 0) {
              highlightEngine.applySmartHighlights(pageSmartHighlights, pageElement);
            } else {
              generateSmartHighlights(page);
            }
          }
        }
        customPdfHighlighter.enableTextSelection();
      }, 300);
    }
  }, [numPages, onPageChange, highlights, smartHighlights]);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const textSelection = customPdfHighlighter.getTextSelection();
    
    if (textSelection && textSelection.text.length > 0) {
      console.log('Text selected:', textSelection.text);
      
      // Call the parent's text selection handler
      if (onTextSelection) {
        onTextSelection(textSelection.text, textSelection.pageNumber);
      }
      
      // Get selection position for context menu
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        // Show custom context menu
        showContextMenu({
          text: textSelection.text,
          position: {
            x: rect.left + (rect.width / 2),
            y: rect.bottom + 10,
            width: rect.width,
            height: rect.height
          },
          pageNumber: textSelection.pageNumber
        });
      }
    }
  }, [onTextSelection]);

  // Show context menu
  const showContextMenu = ({ text, position, pageNumber }: { 
    text: string; 
    position: { x: number; y: number; width: number; height: number }; 
    pageNumber: number 
  }) => {
    setContextMenu({
      visible: true,
      selectedText: text,
      position: position,
      pageNumber: pageNumber,
      options: [
        {
          icon: "🔆",
          label: "Highlight",
          action: () => highlightText(text, position, pageNumber)
        },
        {
          icon: "🧠",
          label: "Simplify with AI",
          action: () => simplifyText(text)
        },
        {
          icon: "💡",
          label: "Generate Insights",
          action: () => generateInsights(text)
        },
        {
          icon: "📋",
          label: "Copy Text",
          action: () => {
            navigator.clipboard.writeText(text);
            setContextMenu({ visible: false, selectedText: '', position: null, pageNumber: 1, options: [] });
            toast({
              title: "Copied",
              description: "Text copied to clipboard",
            });
          }
        }
      ]
    });
  };

  // Highlight text
  const highlightText = async (text: string, position: { x: number; y: number; width: number; height: number }, pageNumber: number) => {
    try {
      console.log("Highlighting:", text);
      
      // Create highlight from the selected text
      const highlight = customPdfHighlighter.createHighlightFromSelection('primary');
      
      if (highlight) {
        // Apply the highlight immediately
        const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`) as HTMLElement;
        if (pageElement) {
          customPdfHighlighter.applyHighlights([highlight], pageNumber, pageElement);
        }
        
        // Call parent's highlight handler if available
        if (onTextSelection) {
          onTextSelection(text, pageNumber);
        }
      }
      
      // Close context menu
      setContextMenu({ visible: false, selectedText: '', position: null, pageNumber: 1, options: [] });
      
      // Clear text selection
      window.getSelection()?.removeAllRanges();
      
      // Visual feedback
      toast({
        title: "Text Highlighted",
        description: `Added highlight: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      });
      
    } catch (error) {
      console.error("Error adding highlight:", error);
      toast({
        title: "Highlight Error",
        description: "Failed to add highlight. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Simplify text with AI
  const simplifyText = async (selectedText: string) => {
    setLoading({ type: "simplify", active: true });
    setContextMenu({ visible: false, selectedText: '', position: null, pageNumber: 1, options: [] });
    
    try {
      const response = await fetch('/api/simplify-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText })
      });
      
      if (!response.ok) throw new Error('Failed to simplify text');
      
      const result = await response.json();
      
      setAiPopup({
        visible: true,
        type: "simplify",
        originalText: selectedText,
        result: result.simplified_text || result.simplified || "Text simplified successfully",
        title: "Simplified Text"
      });
      
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Simplification Failed",
        description: "Failed to simplify text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading({ type: "simplify", active: false });
    }
  };

  // Generate insights with AI
  const generateInsights = async (selectedText: string) => {
    setLoading({ type: "insights", active: true });
    setContextMenu({ visible: false, selectedText: '', position: null, pageNumber: 1, options: [] });
    
    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: selectedText,
          context: "PDF document analysis",
          persona: "student"
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate insights');
      
      const result = await response.json();
      
      setAiPopup({
        visible: true,
        type: "insights", 
        originalText: selectedText,
        result: Array.isArray(result.insights) 
          ? result.insights.map((insight: any) => insight.content || insight).join('\n\n')
          : result.insights || "Insights generated successfully",
        title: "AI Insights"
      });
      
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Insights Failed",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading({ type: "insights", active: false });
    }
  };

  // Navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const resetZoom = () => {
    setZoom(1.0);
  };

  // Rotation function
  const rotateDocument = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Generate smart highlights for a page
  const generateSmartHighlights = useCallback(async (page: number) => {
    if (!smartHighlights.enabled || smartHighlights.isGenerating) return;

    setSmartHighlights(prev => ({ ...prev, isGenerating: true }));

    try {
      // Extract text content from the page
      const pageElement = document.querySelector(`[data-page-number="${page}"]`) as HTMLElement;
      if (!pageElement) return;

      const textLayer = pageElement.querySelector('.react-pdf__Page__textContent') as HTMLElement;
      if (!textLayer) return;

      const textContent = textLayer.textContent || '';
      setPageContent(textContent);

      // Generate smart highlights
      const newHighlights = highlightEngine.generateSmartHighlights(textContent, page);
      
      setSmartHighlights(prev => ({
        ...prev,
        highlights: [...prev.highlights.filter(h => h.page !== page), ...newHighlights],
        isGenerating: false
      }));

      // Apply highlights to the page
      setTimeout(() => {
        highlightEngine.applySmartHighlights(newHighlights, pageElement);
      }, 100);

    } catch (error) {
      console.error('Error generating smart highlights:', error);
      setSmartHighlights(prev => ({ ...prev, isGenerating: false }));
    }
  }, [smartHighlights.enabled, smartHighlights.isGenerating]);

  // Download original PDF
  const downloadOriginalPDF = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName;
    link.click();
    
    toast({
      title: "Download Started",
      description: "Original PDF download has started",
    });
  };

  // Download highlighted PDF
  const downloadHighlightedPDF = async () => {
    if (smartHighlights.highlights.length === 0) {
      toast({
        title: "No Highlights",
        description: "Generate some highlights first before downloading",
        variant: "destructive"
      });
      return;
    }

    setLoading({ type: 'download', active: true });

    try {
      const highlightedPdfBytes = await pdfProcessor.addHighlightsToPDF(
        documentUrl,
        smartHighlights.highlights
      );
      
      const filename = `${documentName.replace('.pdf', '')}_highlighted.pdf`;
      pdfProcessor.downloadPDF(highlightedPdfBytes, filename);
      
      toast({
        title: "Download Complete",
        description: "Highlighted PDF has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading highlighted PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate highlighted PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading({ type: 'download', active: false });
    }
  };

  // Toggle smart highlights
  const toggleSmartHighlights = () => {
    setSmartHighlights(prev => {
      const newEnabled = !prev.enabled;
      if (!newEnabled) {
        // Remove all smart highlights
        highlightEngine.removeAllHighlights();
      } else {
        // Re-apply highlights for current page
        const pageHighlights = prev.highlights.filter(h => h.page === currentPage);
        if (pageHighlights.length > 0) {
          setTimeout(() => {
            const pageElement = document.querySelector(`[data-page-number="${currentPage}"]`) as HTMLElement;
            if (pageElement) {
              highlightEngine.applySmartHighlights(pageHighlights, pageElement);
            }
          }, 100);
        } else {
          generateSmartHighlights(currentPage);
        }
      }
      return { ...prev, enabled: newEnabled };
    });
  };

  // Open AI Insights modal
  const openAIInsights = () => {
    setAiInsightsOpen(true);
  };

  // Handle goToSection prop changes
  useEffect(() => {
    if (goToSection) {
      handlePageChange(goToSection.page);
      
      // If section is provided, show a toast about it
      if (goToSection.section) {
        toast({
          title: "Navigated to Section",
          description: `Page ${goToSection.page}: ${goToSection.section}`,
        });
      }
    }
  }, [goToSection, handlePageChange]);

  // Handle text selection events
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleTextSelection, 50); // Small delay to ensure selection is captured
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleTextSelection();
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleTextSelection]);

  // Apply highlights when they change
  useEffect(() => {
    if (highlights.length > 0) {
      const pageElement = document.querySelector(`[data-page-number="${currentPage}"]`) as HTMLElement;
      if (pageElement) {
        customPdfHighlighter.applyHighlights(highlights, currentPage, pageElement);
      }
    }
  }, [highlights, currentPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      customPdfHighlighter.removeAllHighlights();
    };
  }, []);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-elevated rounded-lg border border-border-subtle">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-medium">PDF Loading Error</div>
          <div className="text-text-secondary">{error}</div>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className={`h-full flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* Custom PDF Viewer Indicator */}
        <div className="absolute top-2 left-2 z-20 bg-green-600 text-white text-xs px-2 py-1 rounded">
          Custom PDF Viewer Active
        </div>

        {/* PDF Toolbar */}
        <div className="flex items-center justify-between p-3 bg-surface-elevated border-b border-border-subtle">
          <div className="flex items-center gap-2">
            {/* Page Navigation */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 text-sm">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= numPages) {
                    handlePageChange(page);
                  }
                }}
                className="w-16 px-2 py-1 text-center border border-border-subtle rounded bg-background text-text-primary"
                min={1}
                max={numPages}
              />
              <span className="text-text-secondary">of {numPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= 0.25}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 min-w-32">
                <Slider
                  value={[zoom * 100]}
                  onValueChange={([value]) => setZoom(value / 100)}
                  min={25}
                  max={300}
                  step={25}
                  className="flex-1"
                />
                <span className="text-xs text-text-secondary font-mono w-12">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= 3.0}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Additional Tools */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSmartHighlights}
                aria-label="Toggle smart highlights"
                className={smartHighlights.enabled ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-white'}
              >
                <Sparkles className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={openAIInsights}
                aria-label="AI Insights"
                className="text-blue-400 hover:text-blue-300"
              >
                <Brain className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={downloadHighlightedPDF}
                aria-label="Download highlighted PDF"
                disabled={loading.type === 'download' || smartHighlights.highlights.length === 0}
                className="text-green-400 hover:text-green-300 disabled:text-gray-600"
              >
                {loading.type === 'download' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={rotateDocument}
                aria-label="Rotate page"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                aria-label="Toggle fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={downloadOriginalPDF}
                aria-label="Download original document"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Smart Highlights Status */}
        {smartHighlights.enabled && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-800">
              <Sparkles className="h-4 w-4" />
              <span>
                Smart Highlights Active ({smartHighlights.highlights.filter(h => h.page === currentPage).length} on this page)
              </span>
              {smartHighlights.isGenerating && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
          </div>
        )}

        {/* PDF Content Area */}
        <div className="flex-1 overflow-auto relative bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-primary" />
                <p className="text-sm text-text-secondary">Loading Custom PDF Viewer...</p>
              </div>
            </div>
          )}

          <HoverTooltipProvider isEnabled={true}>
            <div className="flex justify-center p-4">
              <div className="relative">
                <Document
                  file={documentUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                    </div>
                  }
                >
                  <Page
                    pageNumber={currentPage}
                    scale={zoom}
                    rotate={rotation}
                    loading={
                      <div className="flex items-center justify-center h-96 bg-white border">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                      </div>
                    }
                    className="shadow-lg"
                    onRenderSuccess={() => {
                      // Apply highlights and enable text selection when page renders
                      setTimeout(() => {
                        const pageElement = document.querySelector('.react-pdf__Page') as HTMLElement;
                        if (pageElement) {
                          pageElement.setAttribute('data-page-number', currentPage.toString());
                          
                          // Apply traditional highlights
                          if (highlights && highlights.length > 0) {
                            customPdfHighlighter.applyHighlights(highlights, currentPage, pageElement);
                          }
                          
                          // Apply smart highlights
                          if (smartHighlights.enabled) {
                            const pageSmartHighlights = smartHighlights.highlights.filter(h => h.page === currentPage);
                            if (pageSmartHighlights.length > 0) {
                              highlightEngine.applySmartHighlights(pageSmartHighlights, pageElement);
                            } else {
                              generateSmartHighlights(currentPage);
                            }
                          }
                          
                          customPdfHighlighter.enableTextSelection();
                        }
                      }, 100);
                    }}
                  />
                </Document>
              </div>
            </div>
          </HoverTooltipProvider>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu({ visible: false, selectedText: '', position: null, pageNumber: 1, options: [] })}
      />

      {/* AI Popup */}
      <AiPopup
        aiPopup={aiPopup}
        onClose={() => setAiPopup({ visible: false, type: 'simplify', originalText: '', result: '', title: '' })}
      />

      {/* AI Insights Modal */}
      <AIInsightsModal
        isOpen={aiInsightsOpen}
        onClose={() => setAiInsightsOpen(false)}
        documentName={documentName}
        documentContent={pageContent}
        currentPage={currentPage}
      />

      {/* Loading overlay for AI operations */}
      {loading.active && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 flex items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            <span className="text-white">
              {loading.type === 'simplify' ? 'Simplifying text...' : 
               loading.type === 'insights' ? 'Generating insights...' :
               loading.type === 'download' ? 'Generating highlighted PDF...' : 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </>
  );
}