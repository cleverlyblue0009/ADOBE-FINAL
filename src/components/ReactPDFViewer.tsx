import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
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
  Copy,
  Lightbulb,
  Highlighter,
  Loader2
} from 'lucide-react';
import { apiService } from '@/lib/api';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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

interface ReactPDFViewerProps {
  documentUrl: string;
  documentName: string;
  onPageChange?: (page: number) => void;
  onTextSelection?: (text: string, page: number) => void;
  highlights?: Highlight[];
  currentHighlightPage?: number;
  goToSection?: { page: number; section?: string } | null;
  onHighlight?: (highlight: Highlight) => void;
  onError?: (error: Error) => void;
}

interface ContextMenuState {
  visible: boolean;
  selectedText: string;
  position: { x: number; y: number; width: number; height: number } | null;
  pageNumber: number;
  selection?: Selection;
  range?: Range;
}

interface AiPopupState {
  visible: boolean;
  type: 'simplify' | 'insights';
  originalText: string;
  result: string;
  title: string;
  loading: boolean;
}

interface LoadingState {
  type: 'simplify' | 'insights' | null;
  active: boolean;
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
  loading: LoadingState;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contextMenu.visible && menuRef.current) {
      menuRef.current.focus();
    }
  }, [contextMenu.visible]);

  if (!contextMenu.visible) return null;

  const menuOptions = [
    {
      icon: <Highlighter className="w-4 h-4" />,
      label: 'Highlight',
      action: () => onHighlight('primary'),
      submenu: [
        { label: 'Yellow', color: 'primary' as const, action: () => onHighlight('primary') },
        { label: 'Blue', color: 'secondary' as const, action: () => onHighlight('secondary') },
        { label: 'Green', color: 'tertiary' as const, action: () => onHighlight('tertiary') }
      ]
    },
    {
      icon: loading.type === 'simplify' && loading.active ? 
        <Loader2 className="w-4 h-4 animate-spin" /> : 
        <span className="text-lg">🧠</span>,
      label: 'Simplify with AI',
      action: onSimplify,
      disabled: loading.active
    },
    {
      icon: loading.type === 'insights' && loading.active ? 
        <Loader2 className="w-4 h-4 animate-spin" /> : 
        <Lightbulb className="w-4 h-4" />,
      label: 'Generate Insights',
      action: onInsights,
      disabled: loading.active
    },
    {
      icon: <Copy className="w-4 h-4" />,
      label: 'Copy Text',
      action: onCopy
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Context Menu */}
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

        {/* Menu options */}
        {menuOptions.map((option, index) => (
          <div key={index} className="relative group">
            <button
              className={`w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3 text-sm transition-colors ${
                option.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => {
                if (!option.disabled) {
                  option.action();
                  if (!option.submenu) onClose();
                }
              }}
              disabled={option.disabled}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
            
            {/* Submenu for highlight colors */}
            {option.submenu && (
              <div className="absolute left-full top-0 ml-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {option.submenu.map((subOption, subIndex) => (
                  <button
                    key={subIndex}
                    className="w-full px-3 py-2 text-left text-white hover:bg-gray-800 flex items-center gap-2 text-sm"
                    onClick={() => {
                      subOption.action();
                      onClose();
                    }}
                  >
                    <div className={`w-3 h-3 rounded ${
                      subOption.color === 'primary' ? 'bg-yellow-400' :
                      subOption.color === 'secondary' ? 'bg-blue-400' : 'bg-green-400'
                    }`} />
                    {subOption.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
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

// Main ReactPDFViewer Component
export function ReactPDFViewer({
  documentUrl,
  documentName,
  onPageChange,
  onTextSelection,
  highlights = [],
  currentHighlightPage,
  goToSection,
  onHighlight,
  onError
}: ReactPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
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
  const [loadingState, setLoadingState] = useState<LoadingState>({
    type: null,
    active: false
  });

  const documentRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { toast } = useToast();

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  }, []);

  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    setError(`Failed to load PDF: ${error.message}`);
    setLoading(false);
    console.error('PDF load error:', error);
    onError?.(error);
  }, [onError]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      onPageChange?.(page);
    }
  }, [numPages, onPageChange]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1.0);
  }, []);

  // Handle rotation
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Handle text selection
  const handleTextSelection = useCallback((event: MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 3) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Find which page the selection is on
    let pageNumber = currentPage;
    const pageElements = document.querySelectorAll('[data-page-number]');
    pageElements.forEach((pageEl) => {
      const pageRect = pageEl.getBoundingClientRect();
      if (rect.top >= pageRect.top && rect.top <= pageRect.bottom) {
        pageNumber = parseInt(pageEl.getAttribute('data-page-number') || '1');
      }
    });

    setContextMenu({
      visible: true,
      selectedText,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        width: rect.width,
        height: rect.height
      },
      pageNumber,
      selection,
      range
    });

    onTextSelection?.(selectedText, pageNumber);
  }, [currentPage, onTextSelection]);

  // Handle context menu close
  const handleContextMenuClose = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle AI simplify
  const handleSimplify = useCallback(async () => {
    if (!contextMenu.selectedText) return;

    setLoadingState({ type: 'simplify', active: true });
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
      setLoadingState({ type: null, active: false });
    }
  }, [contextMenu.selectedText]);

  // Handle AI insights
  const handleInsights = useCallback(async () => {
    if (!contextMenu.selectedText) return;

    setLoadingState({ type: 'insights', active: true });
    setAiPopup({
      visible: true,
      type: 'insights',
      originalText: contextMenu.selectedText,
      result: '',
      title: '💡 AI Insights',
      loading: true
    });

    try {
      // Use default persona and job for context menu insights
      const insights = await apiService.generateInsights(
        contextMenu.selectedText,
        'Professional',
        'Understanding key concepts'
      );
      
      // Format insights array into readable text
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
      setLoadingState({ type: null, active: false });
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '=':
          case '+':
            event.preventDefault();
            handleZoomIn();
            break;
          case '-':
            event.preventDefault();
            handleZoomOut();
            break;
          case '0':
            event.preventDefault();
            handleZoomReset();
            break;
        }
      }
      
      switch (event.key) {
        case 'ArrowLeft':
          if (!event.target || (event.target as HTMLElement).tagName !== 'INPUT') {
            event.preventDefault();
            handlePageChange(currentPage - 1);
          }
          break;
        case 'ArrowRight':
          if (!event.target || (event.target as HTMLElement).tagName !== 'INPUT') {
            event.preventDefault();
            handlePageChange(currentPage + 1);
          }
          break;
        case 'Escape':
          handleContextMenuClose();
          setAiPopup(prev => ({ ...prev, visible: false }));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, handlePageChange, handleZoomIn, handleZoomOut, handleZoomReset, handleContextMenuClose]);

  // Handle text selection events
  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      // Small delay to ensure selection is complete
      setTimeout(() => handleTextSelection(event), 10);
    };

    const handleContextMenuEvent = (event: MouseEvent) => {
      // Prevent default context menu on PDF content
      if (documentRef.current?.contains(event.target as Node)) {
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
      handlePageChange(goToSection.page);
    }
  }, [goToSection, handlePageChange]);

  // Render highlights for current page
  const renderHighlights = useMemo(() => {
    return highlights
      .filter(highlight => highlight.page === currentPage)
      .map(highlight => {
        if (!highlight.position) return null;
        
        const colorClasses = {
          primary: 'bg-yellow-400 bg-opacity-30',
          secondary: 'bg-blue-400 bg-opacity-30',
          tertiary: 'bg-green-400 bg-opacity-30'
        };

        return (
          <div
            key={highlight.id}
            className={`absolute pointer-events-none ${colorClasses[highlight.color]}`}
            style={{
              left: highlight.position.x,
              top: highlight.position.y,
              width: highlight.position.width,
              height: highlight.position.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
            title={highlight.text}
          />
        );
      });
  }, [highlights, currentPage, scale]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h3 className="font-medium truncate max-w-64">{documentName}</h3>
          
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm whitespace-nowrap">
              Page {currentPage} of {numPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Page Input */}
          <Input
            type="number"
            min={1}
            max={numPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= numPages) {
                handlePageChange(page);
              }
            }}
            className="w-20 h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <div className="w-32">
            <Slider
              value={[scale]}
              onValueChange={([value]) => setScale(value)}
              min={0.5}
              max={3.0}
              step={0.25}
              className="w-full"
            />
          </div>
          
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <span className="text-sm w-12 text-center">
            {Math.round(scale * 100)}%
          </span>

          {/* Other Controls */}
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => window.open(documentUrl, '_blank')}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div 
        ref={documentRef}
        className={`flex-1 overflow-auto bg-gray-800 ${isFullscreen ? 'fixed inset-0 z-40' : ''}`}
      >
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading PDF...</span>
          </div>
        )}
        
        <div className="flex justify-center p-4">
          <div className="relative">
            <Document
              file={documentUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                data-page-number={currentPage}
                className="shadow-lg"
              />
            </Document>
            
            {/* Render highlights overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {renderHighlights}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={handleContextMenuClose}
        onSimplify={handleSimplify}
        onInsights={handleInsights}
        onHighlight={handleHighlight}
        onCopy={handleCopy}
        loading={loadingState}
      />

      {/* AI Popup */}
      <AiPopup
        aiPopup={aiPopup}
        onClose={() => setAiPopup(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
}