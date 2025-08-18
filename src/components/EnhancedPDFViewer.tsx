// Enhanced PDF Viewer - Integrates all new features
// Single page display with intelligent highlighting, hover tooltips, and download functionality

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
  Search,
  Loader2,
  Brain,
  Sparkles,
  HelpCircle
} from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Import our enhanced components
import { TextHighlighter } from './TextHighlighter';
import { HoverTooltip, useHoverTooltips } from './HoverTooltip';
import { DownloadManager } from './DownloadManager';
import { AIInsightsModal } from './AIInsightsModal';
import { EnhancedContextMenu } from './EnhancedContextMenu';
import { EnhancedTextSelectionMenu } from './EnhancedTextSelectionMenu';
import { TodoistStylePopup } from './TodoistStylePopup';
import { Highlight } from './PDFReader';
import { customPdfHighlighter } from '@/lib/customPdfHighlighter';

interface EnhancedPDFViewerProps {
  documentUrl: string;
  documentName: string;
  onPageChange?: (page: number) => void;
  onTextSelection?: (text: string, page: number) => void;
  highlights?: Highlight[];
  currentHighlightPage?: number;
  goToSection?: { page: number; section?: string } | null;
  persona?: string;
  jobToBeDone?: string;
  onOpenSidebar?: (panelType: 'insights' | 'simplifier' | 'highlights') => void;
}

export function EnhancedPDFViewer({
  documentUrl,
  documentName,
  onPageChange,
  onTextSelection,
  highlights = [],
  currentHighlightPage = 1,
  goToSection,
  persona,
  jobToBeDone,
  onOpenSidebar
}: EnhancedPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [documentText, setDocumentText] = useState<string>('');
  const [pageTexts, setPageTexts] = useState<Map<number, string>>(new Map());
  const [selectedText, setSelectedText] = useState<string>('');
  const [currentHighlights, setCurrentHighlights] = useState<Highlight[]>(highlights);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);
  
  // Enhanced context menu and popup states
  const [contextMenuState, setContextMenuState] = useState<{
    visible: boolean;
    selectedText: string;
    position: { x: number; y: number } | null;
    pageNumber: number;
  }>({
    visible: false,
    selectedText: '',
    position: null,
    pageNumber: 1
  });
  
  const [popupState, setPopupState] = useState<{
    type: 'simplify' | 'insights' | 'translate' | null;
    isOpen: boolean;
    selectedText: string;
    pageNumber: number;
  }>({
    type: null,
    isOpen: false,
    selectedText: '',
    pageNumber: 1
  });

  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  // Hover tooltips hook
  const {
    isTooltipEnabled,
    lookupHistory,
    handleTermLookup,
    toggleTooltips
  } = useHoverTooltips(true);

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    console.log(`Enhanced PDF loaded successfully with ${numPages} pages`);
    
    // Enable text selection after a short delay
    setTimeout(() => {
      customPdfHighlighter.enableTextSelection();
    }, 500);
  }, []);

  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    setIsLoading(false);
    setError(`Failed to load PDF: ${error.message}`);
    console.error('PDF load error:', error);
  }, []);

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
        if (pageElement && currentHighlights.length > 0) {
          customPdfHighlighter.applyHighlights(currentHighlights, page, pageElement);
        }
        customPdfHighlighter.enableTextSelection();
      }, 300);
    }
  }, [numPages, onPageChange, currentHighlights]);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const textSelection = customPdfHighlighter.getTextSelection();
    
    if (textSelection && textSelection.text.length > 0) {
      console.log('Text selected:', textSelection.text);
      setSelectedText(textSelection.text);
      
      // Get selection position for context menu
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setContextMenuState({
          visible: true,
          selectedText: textSelection.text,
          position: {
            x: rect.left + (rect.width / 2),
            y: rect.bottom + 10
          },
          pageNumber: textSelection.pageNumber
        });
      }
      
      // Call the parent's text selection handler
      if (onTextSelection) {
        onTextSelection(textSelection.text, textSelection.pageNumber);
      }
    }
  }, [onTextSelection]);

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

  // Handle highlights generated by TextHighlighter
  const handleHighlightsGenerated = useCallback((newHighlights: Highlight[]) => {
    setCurrentHighlights(newHighlights);
    
    // Apply highlights to current page
    setTimeout(() => {
      const pageElement = document.querySelector(`[data-page-number="${currentPage}"]`) as HTMLElement;
      if (pageElement) {
        customPdfHighlighter.applyHighlights(newHighlights, currentPage, pageElement);
      }
    }, 100);
  }, [currentPage]);

  // Handle goToSection prop changes
  useEffect(() => {
    if (goToSection) {
      handlePageChange(goToSection.page);
      
      if (goToSection.section) {
        toast({
          title: "Navigated to Section",
          description: `Page ${goToSection.page}: ${goToSection.section}`,
        });
      }
    }
  }, [goToSection, handlePageChange, toast]);

  // Handle text selection events
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleTextSelection, 50);
    };

    const handleContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        e.preventDefault();
        handleTextSelection();
      }
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
    if (currentHighlights.length > 0) {
      const pageElement = document.querySelector(`[data-page-number="${currentPage}"]`) as HTMLElement;
      if (pageElement) {
        customPdfHighlighter.applyHighlights(currentHighlights, currentPage, pageElement);
      }
    }
  }, [currentHighlights, currentPage]);

  // Handle popup opening
  const handleOpenPopup = useCallback((type: 'simplify' | 'insights' | 'translate', text: string) => {
    setPopupState({
      type,
      isOpen: true,
      selectedText: text,
      pageNumber: currentPage
    });
    
    // Auto-open corresponding sidebar tab
    if (onOpenSidebar) {
      switch (type) {
        case 'insights':
          onOpenSidebar('insights');
          break;
        case 'simplify':
          onOpenSidebar('simplifier');
          break;
        // For translate, we could add a new panel or use insights
        case 'translate':
          onOpenSidebar('insights');
          break;
      }
    }
  }, [currentPage, onOpenSidebar]);

  // Handle highlighting with fluorescent colors
  const handleHighlight = useCallback((color: 'yellow' | 'green' | 'blue' | 'pink') => {
    const highlight = customPdfHighlighter.createHighlightFromSelection(color);
    
    if (highlight) {
      const newHighlights = [...currentHighlights, highlight];
      setCurrentHighlights(newHighlights);
      
      // Apply the highlight immediately
      setTimeout(() => {
        const pageElement = document.querySelector(`[data-page-number="${currentPage}"]`) as HTMLElement;
        if (pageElement) {
          customPdfHighlighter.applyHighlights([highlight], currentPage, pageElement);
        }
      }, 100);
      
      // Clear text selection
      window.getSelection()?.removeAllRanges();
      
      // Auto-open highlights sidebar
      if (onOpenSidebar) {
        onOpenSidebar('highlights');
      }
      
      toast({
        title: "Text Highlighted",
        description: `Added ${color} highlight: "${highlight.text.substring(0, 30)}${highlight.text.length > 30 ? '...' : ''}"`,
      });
    }
  }, [currentHighlights, currentPage, toast, onOpenSidebar]);

  // Handle context menu close
  const handleContextMenuClose = useCallback(() => {
    setContextMenuState({
      visible: false,
      selectedText: '',
      position: null,
      pageNumber: 1
    });
  }, []);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setPopupState({
      type: null,
      isOpen: false,
      selectedText: '',
      pageNumber: 1
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      customPdfHighlighter.removeAllHighlights();
    };
  }, []);

  // Extract text content for analysis (simplified implementation)
  useEffect(() => {
    if (numPages > 0) {
      // In a real implementation, you would extract actual text from the PDF
      // For now, we'll use mock text based on the document content
      const mockText = `
        Artificial Intelligence in Healthcare: A Comprehensive Review
        
        This document presents a comprehensive review of artificial intelligence applications 
        in modern healthcare systems. We examine the transformative potential of machine 
        learning algorithms in clinical decision-making, patient care optimization, and 
        medical research advancement.
        
        The integration of AI technologies has shown remarkable success in early disease 
        detection, treatment personalization, and healthcare resource allocation. However, 
        challenges remain in data privacy, algorithmic bias, and regulatory compliance.
        
        Recent advances in deep learning have enabled AI systems to analyze medical images 
        with accuracy matching or exceeding that of experienced radiologists. Natural 
        language processing models can now extract meaningful insights from unstructured 
        clinical notes, while predictive models help identify patients at risk.
      `;
      
      setDocumentText(mockText);
      
      // Set page texts (in a real implementation, this would be per-page)
      const pageTextMap = new Map<number, string>();
      for (let i = 1; i <= numPages; i++) {
        pageTextMap.set(i, `Page ${i} content: ${mockText.slice((i-1) * 500, i * 500)}`);
      }
      setPageTexts(pageTextMap);
    }
  }, [numPages]);

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
        {/* Enhanced PDF Viewer Header */}
        <div className="bg-surface-elevated/95 border-b border-border-subtle p-3">
          <div className="flex items-center justify-between">
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

            {/* Enhanced Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
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

              {/* Feature Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTooltips}
                className={`gap-2 ${isTooltipEnabled ? 'text-brand-primary' : ''}`}
                aria-label="Toggle hover tooltips"
              >
                <HelpCircle className="h-4 w-4" />
                Tooltips
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAIInsightsOpen(true)}
                className="gap-2"
                aria-label="Open AI insights"
              >
                <Brain className="h-4 w-4" />
                AI Insights
              </Button>

              <DownloadManager
                documentUrl={documentUrl}
                documentName={documentName}
                highlights={currentHighlights}
                disabled={isLoading}
              />

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
            </div>
          </div>
        </div>

        {/* Main Content Area - Full Width PDF Display */}
        <div className="flex-1 overflow-auto relative bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-primary" />
                <p className="text-sm text-text-secondary">Loading Enhanced PDF Viewer...</p>
              </div>
            </div>
          )}

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
                {/* Single Page Display - No Duplicates */}
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
                        
                        if (currentHighlights.length > 0) {
                          customPdfHighlighter.applyHighlights(currentHighlights, currentPage, pageElement);
                        }
                        customPdfHighlighter.enableTextSelection();
                      }
                    }, 100);
                  }}
                />
              </Document>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Tooltips */}
      <HoverTooltip
        isEnabled={isTooltipEnabled}
        documentContext={documentText}
        onTermLookup={handleTermLookup}
      />

      {/* Enhanced Text Selection Menu */}
      <EnhancedTextSelectionMenu
        selectedText={contextMenuState.selectedText}
        position={contextMenuState.position}
        pageContext={pageTexts.get(contextMenuState.pageNumber) || ''}
        documentId={documentUrl}
        onHighlight={handleHighlight}
        onClose={handleContextMenuClose}
      />

      {/* Todoist Style Popups */}
      {popupState.type && (
        <TodoistStylePopup
          isOpen={popupState.isOpen}
          onClose={handlePopupClose}
          type={popupState.type}
          selectedText={popupState.selectedText}
          pageNumber={popupState.pageNumber}
          onOpenSidebar={onOpenSidebar}
        />
      )}

      {/* AI Insights Modal */}
      <AIInsightsModal
        isOpen={isAIInsightsOpen}
        onClose={() => setIsAIInsightsOpen(false)}
        documentText={documentText}
        selectedText={selectedText}
        currentPage={currentPage}
        persona={persona}
        jobToBeDone={jobToBeDone}
        onPageNavigate={handlePageChange}
      />
    </>
  );
}