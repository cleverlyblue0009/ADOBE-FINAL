import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  highlightManager, 
  aiInsightService, 
  highlightUtils,
  type Highlight,
  type AIInsight 
} from '@/lib/pdfHighlightManager';
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  RotateCw,
  Download,
  Loader2,
  Brain,
  X
} from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Types

interface InteractivePDFViewerProps {
  documentId?: string;
  onHighlightCreated?: (highlight: Highlight) => void;
  onAIInsightRequested?: (text: string) => Promise<string>;
  className?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

interface SidePanelState {
  visible: boolean;
  insight: string;
  originalText: string;
  loading: boolean;
}

export const InteractivePDFViewer: React.FC<InteractivePDFViewerProps> = ({
  documentId,
  onHighlightCreated,
  onAIInsightRequested,
  className = ""
}) => {
  // PDF state
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string>(documentId || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interaction state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    text: ""
  });
  const [sidePanel, setSidePanel] = useState<SidePanelState>({
    visible: false,
    insight: "",
    originalText: "",
    loading: false
  });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  const { toast } = useToast();

  // Load PDF from file
  const loadPDF = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      }).promise;
      
      // Generate document ID based on file name and size
      const docId = documentId || `${file.name}-${file.size}-${Date.now()}`;
      setCurrentDocumentId(docId);
      
      // Load existing highlights for this document
      const existingHighlights = highlightManager.getHighlights(docId);
      setHighlights(existingHighlights);
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      toast({
        title: "PDF Loaded",
        description: `Successfully loaded ${file.name} with ${pdf.numPages} pages`,
      });
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load PDF file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [documentId, toast]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    const canvas = canvasRef.current;
    const textLayerDiv = textLayerRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    try {
      // Cancel previous render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      // Get the page
      const page = await pdfDoc.getPage(currentPage);
      
      // Calculate viewport
      const viewport = page.getViewport({ 
        scale: scale, 
        rotation: rotation 
      });

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Clear previous content
      context.clearRect(0, 0, canvas.width, canvas.height);
      textLayerDiv.innerHTML = '';
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;

      // Get text content and create text layer manually
      const textContent = await page.getTextContent();
      
      // Create text layer elements manually for better compatibility
      textContent.items.forEach((item: any, index: number) => {
        if (item.str) {
          const textDiv = document.createElement('span');
          textDiv.textContent = item.str;
          textDiv.style.position = 'absolute';
          textDiv.style.left = `${item.transform[4]}px`;
          textDiv.style.top = `${viewport.height - item.transform[5]}px`;
          textDiv.style.fontSize = `${item.transform[0]}px`;
          textDiv.style.fontFamily = item.fontName || 'sans-serif';
          textDiv.style.color = 'transparent';
          textDiv.style.userSelect = 'text';
          textDiv.style.pointerEvents = 'auto';
          textDiv.style.cursor = 'text';
          textDiv.setAttribute('data-text-index', index.toString());
          textLayerDiv.appendChild(textDiv);
        }
      });

      // Apply existing highlights to the text layer
      applyHighlights();

    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
        setError('Failed to render page');
      }
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  // Apply highlights to the text layer
  const applyHighlights = useCallback(() => {
    if (!textLayerRef.current) return;

    const pageHighlights = highlights.filter(h => h.page === currentPage);
    
    pageHighlights.forEach(highlight => {
      // Find text spans in the text layer
      const textSpans = textLayerRef.current!.querySelectorAll('span');
      
      textSpans.forEach(span => {
        highlightUtils.applyHighlightToElement(span as HTMLElement, highlight);
      });
    });
  }, [highlights, currentPage]);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    // Get selection position for tooltip
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      text: selectedText
    });
  }, []);

  // Create highlight from selection
  const createHighlight = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !currentDocumentId) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    const newHighlight: Highlight = {
      id: highlightUtils.generateHighlightId(),
      page: currentPage,
      text: selectedText,
      startOffset: 0, // In a full implementation, calculate actual offsets
      endOffset: selectedText.length,
      color: highlightUtils.getHighlightColors().yellow,
      timestamp: Date.now()
    };

    // Add to manager and local state
    highlightManager.addHighlight(currentDocumentId, newHighlight);
    setHighlights(prev => [...prev, newHighlight]);
    onHighlightCreated?.(newHighlight);
    
    // Hide tooltip
    setTooltip(prev => ({ ...prev, visible: false }));
    
    // Clear selection
    selection.removeAllRanges();
    
    toast({
      title: "Highlight Created",
      description: "Text has been highlighted successfully",
    });
  }, [currentPage, currentDocumentId, onHighlightCreated, toast]);

  // Request AI insights
  const requestAIInsights = useCallback(async () => {
    if (!tooltip.text || !currentDocumentId) return;

    setSidePanel({
      visible: true,
      insight: "",
      originalText: tooltip.text,
      loading: true
    });

    setTooltip(prev => ({ ...prev, visible: false }));

    try {
      // Check if we already have insights for this text
      const existingInsight = highlightManager.getInsights(currentDocumentId)
        .find(insight => insight.text === tooltip.text);

      let insightText: string;
      
      if (existingInsight) {
        insightText = existingInsight.insight;
      } else {
        // Use provided function or fallback to AI service
        if (onAIInsightRequested) {
          insightText = await onAIInsightRequested(tooltip.text);
        } else {
          insightText = await aiInsightService.getInsights(tooltip.text, 'analysis');
        }
        
        // Store the insight
        const newInsight: AIInsight = {
          text: tooltip.text,
          insight: insightText,
          timestamp: Date.now(),
          type: 'analysis'
        };
        highlightManager.addInsight(currentDocumentId, newInsight);
      }

      setSidePanel(prev => ({
        ...prev,
        insight: insightText,
        loading: false
      }));
    } catch (err) {
      console.error('Error getting AI insights:', err);
      setSidePanel(prev => ({
        ...prev,
        insight: "Failed to get AI insights. Please try again.",
        loading: false
      }));
      toast({
        title: "Error",
        description: "Failed to get AI insights",
        variant: "destructive",
      });
    }
  }, [tooltip.text, currentDocumentId, onAIInsightRequested, toast]);

  // Navigation functions
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const rotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // File upload handler
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      loadPDF(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid PDF file",
        variant: "destructive",
      });
    }
  }, [loadPDF, toast]);

  // Effect to render page when dependencies change
  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [renderPage]);

  // Effect to set up text selection listener
  useEffect(() => {
    const textLayer = textLayerRef.current;
    if (!textLayer) return;

    const handleSelectionChange = () => {
      // Small delay to ensure selection is stable
      setTimeout(handleTextSelection, 50);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleTextSelection]);

  // Effect to handle page changes from parent
  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [currentPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, []);

  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Main PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload PDF
            </Button>
            
            {pdfDoc && (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={goToPreviousPage}
                    disabled={currentPage <= 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {pdfDoc && (
            <div className="flex items-center gap-2">
              <Button onClick={zoomOut} variant="outline" size="sm">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button onClick={zoomIn} variant="outline" size="sm">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button onClick={rotate} variant="outline" size="sm">
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {error && (
            <Card className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Try Again
              </Button>
            </Card>
          )}

          {isLoading && (
            <Card className="p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading PDF...</p>
            </Card>
          )}

          {!pdfDoc && !isLoading && !error && (
            <Card className="p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Upload a PDF</h3>
              <p className="text-gray-600 mb-4">
                Select a PDF file to start viewing and highlighting
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose PDF File
              </Button>
            </Card>
          )}

          {pdfDoc && (
            <div className="flex justify-center">
              <div 
                ref={containerRef}
                className="relative bg-white shadow-lg"
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                {/* Canvas for PDF rendering */}
                <canvas
                  ref={canvasRef}
                  className="block"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
                
                {/* Text layer for selection and interaction */}
                <div
                  ref={textLayerRef}
                  className="textLayer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selection Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg shadow-lg px-3 py-2 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-300">
              "{tooltip.text.substring(0, 50)}{tooltip.text.length > 50 ? '...' : ''}"
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createHighlight}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded text-xs font-medium pointer-events-auto"
            >
              Highlight
            </button>
            {onAIInsightRequested && (
              <button
                onClick={requestAIInsights}
                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium pointer-events-auto flex items-center gap-1"
              >
                <Brain className="w-3 h-3" />
                AI Insights
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Insights Side Panel */}
      {sidePanel.visible && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              AI Insights
            </h3>
            <Button
              onClick={() => setSidePanel(prev => ({ ...prev, visible: false }))}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Original Text */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Text:</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800 border">
                {sidePanel.originalText}
              </div>
            </div>

            {/* AI Insight */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis:</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                {sidePanel.loading ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing text...</span>
                  </div>
                ) : (
                  <div className="text-sm text-blue-900 whitespace-pre-wrap">
                    {sidePanel.insight}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractivePDFViewer;