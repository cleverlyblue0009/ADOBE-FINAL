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
  Lightbulb
} from 'lucide-react';
import { DidYouKnowPopup, useDidYouKnowPopup, AlternativeDidYouKnowPopup } from './DidYouKnowPopup';
import { EnhancedCustomTextSelectionMenu } from './EnhancedCustomTextSelectionMenu';

// Configure PDF.js worker - Use the worker file from public directory
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Import types
import { Highlight } from './PDFReader';

interface CustomPDFViewerProps {
  documentUrl: string;
  documentName: string;
  documentId?: string;
  onPageChange?: (page: number) => void;
  onTextSelection?: (text: string, page: number) => void;
  highlights?: Highlight[];
  currentHighlightPage?: number;
  goToSection?: { page: number; section?: string } | null;
  onHighlightsChange?: (highlights: any[]) => void;
  onOpenSimplifyPanel?: () => void;
  onOpenTranslatePanel?: () => void;
  onOpenAIInsights?: () => void;
}





export function CustomPDFViewer({ 
  documentUrl, 
  documentName, 
  documentId,
  onPageChange, 
  onTextSelection,
  highlights = [],
  currentHighlightPage = 1,
  goToSection,
  onHighlightsChange,
  onOpenSimplifyPanel,
  onOpenTranslatePanel,
  onOpenAIInsights
}: CustomPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Did You Know popup hook
  const { isOpen: isFactPopupOpen, currentPage: factCurrentPage, facts: didYouKnowFacts, showPopup: showFactPopup, hidePopup: hideFactPopup } = useDidYouKnowPopup();
  
  // State for tracking page text for insights
  const [pageTexts, setPageTexts] = useState<Map<number, string>>(new Map());
  
  // Text selection menu state
  const [textSelectionMenu, setTextSelectionMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number } | null;
    selectedText: string;
  }>({
    visible: false,
    position: null,
    selectedText: ''
  });



  const containerRef = useRef<HTMLDivElement>(null);

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  }, []);

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
      
      // Check for interesting facts on this page
      if (documentId) {
        checkForPageFacts(documentId, page);
      }
    }
  }, [numPages, onPageChange, documentId]);

  // Function to check for facts on the current page
  const checkForPageFacts = async (docId: string, pageNum: number) => {
    try {
      const response = await fetch(`/api/documents/${docId}/facts/page/${pageNum}`);
      if (response.ok) {
        const data = await response.json();
        if (data.has_facts) {
          // Get page text for fact generation
          const pageText = getPageText(pageNum);
          
          // Show popup after a short delay to let the page settle
          setTimeout(() => {
            showFactPopup(docId, pageNum, pageText);
          }, 2000); // 2 second delay to let user read the page first
        }
      }
    } catch (error) {
      console.error('Error checking for page facts:', error);
    }
  };

  // Function to extract text from current page
  const getPageText = (pageNum: number): string => {
    try {
      // First try to get from stored page texts
      const storedText = pageTexts.get(pageNum);
      if (storedText) {
        return storedText;
      }
      
      // Try to extract from DOM
      const pageElement = document.querySelector(`[data-page-number="${pageNum}"]`) as HTMLElement ||
                         document.querySelector('.react-pdf__Page') as HTMLElement;
      if (pageElement) {
        // Try text layer first, then fallback to general text content
        const textLayer = pageElement.querySelector('.react-pdf__Page__textContent');
        const textContent = textLayer?.textContent || pageElement.textContent || '';
        
        // Store for future use
        if (textContent.trim().length > 0) {
          pageTexts.set(pageNum, textContent);
          return textContent;
        }
      }
      return '';
    } catch (error) {
      console.error('Error extracting page text:', error);
      return '';
    }
  };

  // Handle text selection with custom menu
  const handleTextSelection = useCallback((event?: MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      console.log('Text selected:', selectedText);
      
      // Store page text for Did You Know functionality
      pageTexts.set(currentPage, selectedText);
      
      // Get selection position for menu
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setTextSelectionMenu({
          visible: true,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.top
          },
          selectedText
        });
      }
      
      // Call the parent's text selection handler
      if (onTextSelection) {
        onTextSelection(selectedText, currentPage);
      }
    } else {
      // Hide menu if no text selected
      setTextSelectionMenu({
        visible: false,
        position: null,
        selectedText: ''
      });
    }
  }, [onTextSelection, currentPage, pageTexts]);

  // Copy text functionality (simplified)
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
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

  // Download function
  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName;
    link.click();
    
    toast({
      title: "Download Started",
      description: "PDF download has started",
    });
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

    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleTextSelection]);



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
                onClick={downloadPDF}
                aria-label="Download document"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

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
                    // Store page text for Did You Know functionality
                    setTimeout(() => {
                      const pageElement = document.querySelector('.react-pdf__Page') as HTMLElement;
                      if (pageElement) {
                        pageElement.setAttribute('data-page-number', currentPage.toString());
                        
                        // Extract and store page text for facts generation
                        const textLayer = pageElement.querySelector('.react-pdf__Page__textContent');
                        const textContent = textLayer?.textContent || pageElement.textContent || '';
                        if (textContent.trim().length > 0) {
                          pageTexts.set(currentPage, textContent);
                          console.log(`Stored text for page ${currentPage}: ${textContent.length} characters`);
                        }
                      }
                    }, 500); // Increased delay to ensure text layer is ready
                  }}
                />
                              </Document>
              </div>
          </div>
        </div>
      </div>



      {/* Did You Know Popup */}
      {isFactPopupOpen && (
        <DidYouKnowPopup 
          facts={didYouKnowFacts} 
          isVisible={true}
          className="z-60"
        />
      )}
      
      {/* Enhanced Text Selection Menu */}
      {textSelectionMenu.visible && (
        <EnhancedCustomTextSelectionMenu
          selectedText={textSelectionMenu.selectedText}
          position={textSelectionMenu.position}
          documentId={documentId}
          onClose={() => setTextSelectionMenu({ visible: false, position: null, selectedText: '' })}
          onOpenSimplifyPanel={onOpenSimplifyPanel}
          onOpenTranslatePanel={onOpenTranslatePanel}
          onOpenAIInsights={onOpenAIInsights}
        />
      )}

      {/* Floating Did You Know Bulb */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 animate-pulse shadow-yellow-400/50"
          onClick={() => {
            const currentPageText = pageTexts.get(currentPage) || '';
            if (!currentPageText) {
              // Try to extract text from current page
              const pageElement = document.querySelector('.react-pdf__Page');
              if (pageElement) {
                const extractedText = pageElement.textContent || '';
                if (extractedText.trim().length > 0) {
                  pageTexts.set(currentPage, extractedText);
                  showFactPopup(documentId || documentName, currentPage, extractedText);
                  return;
                }
              }
              
              toast({
                title: "No content found",
                description: "Unable to find text content for this page. Try selecting some text first.",
                variant: "destructive"
              });
              return;
            }
            
            showFactPopup(documentId || documentName, currentPage, currentPageText);
          }}
          title="Did You Know? - Click for interesting facts about this page"
        >
          <Lightbulb className="h-6 w-6 text-white animate-bounce" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-ping" />
        </Button>
      </div>
    </>
  );
}