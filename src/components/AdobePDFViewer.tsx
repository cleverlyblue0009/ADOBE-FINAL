import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { pdfHighlighter } from '@/lib/pdfHighlighter';
import { Highlight } from './PDFReader';

declare global {
  interface Window {
    AdobeDC: any;
  }
}

interface AdobePDFViewerProps {
  documentUrl: string;
  documentName: string;
  onPageChange?: (page: number) => void;
  onTextSelection?: (text: string, page: number) => void;
  clientId?: string;
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
  type: 'simplify' | 'insights' | null;
  active: boolean;
}

// Context Menu Component
function ContextMenu({ contextMenu, onClose }: { contextMenu: ContextMenuState; onClose: () => void }) {
  if (!contextMenu.visible) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div 
        className="absolute bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-2 min-w-48"
        style={{
          left: contextMenu.position?.x || 0,
          top: (contextMenu.position?.y || 0) + (contextMenu.position?.height || 0) + 10,
          transform: 'translateX(-50%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-gray-400 p-2 border-b border-gray-700 max-w-64 truncate">
          "{contextMenu.selectedText}"
        </div>
        
        {contextMenu.options?.map((option, index) => (
          <button
            key={index}
            className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded flex items-center gap-2 text-sm"
            onClick={option.action}
          >
            <span>{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// AI Popup Component
function AiPopup({ aiPopup, onClose }: { aiPopup: AiPopupState; onClose: () => void }) {
  if (!aiPopup.visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{aiPopup.title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Original Text:</h4>
          <p className="text-sm text-gray-300 bg-gray-800 p-3 rounded">
            {aiPopup.originalText}
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">
            {aiPopup.type === 'simplify' ? 'Simplified Version:' : 'AI Insights:'}
          </h4>
          <div className="text-sm text-white bg-gray-800 p-3 rounded">
            {aiPopup.result}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdobePDFViewer({ 
  documentUrl, 
  documentName, 
  onPageChange, 
  onTextSelection,
  clientId,
  highlights = [],
  currentHighlightPage = 1,
  goToSection
}: AdobePDFViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const adobeViewRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
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

  // Handle Adobe PDF text selection events
  const handleTextSelection = async (event: any) => {
    console.log("PDF Text Selected:", event);
    
    // Extract selected text and position
    const selectedText = event.data?.selectedText || event.data?.selection?.text;
    const boundingRect = event.data?.boundingRect || event.data?.selection?.boundingRect;
    const pageNumber = event.data?.pageNumber || event.data?.selection?.pageNumber || currentPage;
    
    if (!selectedText || selectedText.trim().length === 0) return;
    
    // Show custom context menu with our AI options
    showContextMenu({
      text: selectedText,
      position: boundingRect ? {
        x: boundingRect.x,
        y: boundingRect.y,
        width: boundingRect.width,
        height: boundingRect.height
      } : { x: 100, y: 100, width: 200, height: 20 },
      pageNumber: pageNumber
    });
  };

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
          label: "Simplify",
          action: () => simplifyText(text)
        },
        {
          icon: "💡",
          label: "Generate Insights",
          action: () => generateInsights(text)
        },
        {
          icon: "📋",
          label: "Copy",
          action: () => navigator.clipboard.writeText(text)
        }
      ]
    });
  };

  const highlightText = async (text: string, position: { x: number; y: number; width: number; height: number }, pageNumber: number) => {
    if (!adobeViewRef.current) return;
    
    try {
      // Create highlight annotation using Adobe API
      const annotation = {
        type: "highlight",
        boundingRect: position,
        pageNumber: pageNumber,
        color: "#FFD700", // Gold highlight
        opacity: 0.5,
        content: text,
        author: "AI Assistant"
      };
      
      // Add annotation using Adobe PDF Embed API
      const annotationManager = adobeViewRef.current.getAnnotationManager();
      if (annotationManager) {
        await annotationManager.addAnnotation(annotation);
      }
      
      // Store highlight in your state/database
      const highlight = {
        id: Date.now(),
        text: text,
        position: position,
        pageNumber: pageNumber,
        type: "highlight",
        timestamp: new Date().toISOString()
      };
      
      // Close context menu
      setContextMenu({ ...contextMenu, visible: false });
      
      toast({
        title: "Text Highlighted",
        description: `Added highlight on page ${pageNumber}`,
      });
      
    } catch (error) {
      console.error("Error adding highlight:", error);
      // Fallback: Store highlight data without visual annotation
      const highlight = {
        id: Date.now(),
        text: text,
        position: position,
        pageNumber: pageNumber,
        type: "highlight",
        timestamp: new Date().toISOString()
      };
      
      toast({
        title: "Highlight Added",
        description: `Saved highlight on page ${pageNumber}`,
      });
    }
  };

  const simplifyText = async (selectedText: string) => {
    setLoading({ type: "simplify", active: true });
    
    try {
      const response = await fetch('/api/simplify-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          difficulty_level: "simple"
        })
      });
      
      const result = await response.json();
      
      // Show simplified text in a popup/modal
      setAiPopup({
        visible: true,
        type: "simplify",
        originalText: selectedText,
        result: result.simplified_text || result.simplified || "Text simplified successfully",
        title: "Simplified Text"
      });
      
    } catch (error) {
      console.error("Error simplifying text:", error);
      toast({
        title: "Error",
        description: "Failed to simplify text",
        variant: "destructive"
      });
    } finally {
      setLoading({ type: "simplify", active: false });
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const generateInsights = async (selectedText: string) => {
    setLoading({ type: "insights", active: true });
    
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          persona: "general user",
          job_to_be_done: "understanding content"
        })
      });
      
      const result = await response.json();
      
      // Show insights in a popup/modal
      setAiPopup({
        visible: true,
        type: "insights",
        originalText: selectedText,
        result: Array.isArray(result.insights) 
          ? result.insights.map((insight: any) => insight.content || insight).join('\n\n')
          : result.insights || "Insights generated successfully",
        title: "AI Generated Insights"
      });
      
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate insights",
        variant: "destructive"
      });
    } finally {
      setLoading({ type: "insights", active: false });
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  // Enhanced navigation to specific sections using multiple approaches
  const goToLocation = async (page: number, section?: string, coordinates?: { x: number; y: number }) => {
    if (!adobeViewRef.current || !window.AdobeDC) {
      console.warn("Adobe PDF viewer not available, attempting fallback navigation");
      await fallbackNavigation(page, section);
      return;
    }

    try {
      console.log(`Navigating to page ${page}${section ? ` for section: ${section}` : ''}`);
      
      // Method 1: Try Adobe's goToLocation API
      try {
        const viewerConfig = {
          page: page,
          zoom: 'FitV', // Fit vertically
          ...(coordinates && {
            left: coordinates.x,
            top: coordinates.y
          })
        };

        await adobeViewRef.current.goToLocation(viewerConfig);
        console.log("Adobe goToLocation successful");
      } catch (gotoError) {
        console.warn("Adobe goToLocation failed, trying alternative methods:", gotoError);
        
        // Method 2: Try using the page navigation API
        try {
          await adobeViewRef.current.getAPIs().then((apis: any) => {
            if (apis.getPageAPIs) {
              return apis.getPageAPIs().goToPage(page);
            }
          });
          console.log("Adobe page navigation API successful");
        } catch (pageApiError) {
          console.warn("Adobe page API failed, using basic navigation:", pageApiError);
          
          // Method 3: Try basic page change
          if (adobeViewRef.current.setCurrentPage) {
            await adobeViewRef.current.setCurrentPage(page);
          }
        }
      }
      
      // If section is provided, try to find and highlight it
      if (section) {
        await highlightSection(section, page);
      }

      setCurrentPage(page);
      if (onPageChange) {
        onPageChange(page);
      }

      toast({
        title: "Navigation Complete",
        description: `Navigated to page ${page}${section ? ` - ${section}` : ''}`,
        duration: 2000
      });
      
    } catch (error) {
      console.error('Adobe navigation completely failed:', error);
      // Final fallback
      await fallbackNavigation(page, section);
    }
  };

  // Fallback navigation when Adobe API is not available or fails
  const fallbackNavigation = async (page: number, section?: string) => {
    try {
      // Try to find iframe and navigate
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (iframe && iframe.src) {
        // Update iframe src with page parameter
        const url = new URL(iframe.src);
        url.hash = `page=${page}`;
        iframe.src = url.toString();
        
        setCurrentPage(page);
        if (onPageChange) {
          onPageChange(page);
        }
        
        toast({
          title: "Navigation (Fallback)",
          description: `Attempted to navigate to page ${page}${section ? ` - ${section}` : ''}`,
          duration: 2000
        });
      } else {
        // Last resort: scroll-based navigation
        scrollToPage(page);
      }
    } catch (error) {
      console.error('Fallback navigation failed:', error);
      toast({
        title: "Navigation Failed",
        description: "Could not navigate to the specified location. Try using the PDF viewer's built-in navigation.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Scroll-based navigation as final fallback
  const scrollToPage = (page: number) => {
    try {
      // Estimate scroll position based on page number
      const container = document.getElementById('adobe-dc-view');
      if (container) {
        const estimatedHeight = (page - 1) * 800; // Rough estimate
        container.scrollTo({
          top: estimatedHeight,
          behavior: 'smooth'
        });
        
        setCurrentPage(page);
        if (onPageChange) {
          onPageChange(page);
        }
      }
    } catch (error) {
      console.error('Scroll navigation failed:', error);
    }
  };

  // Enhanced section highlighting with multiple approaches
  const highlightSection = async (sectionText: string, page: number) => {
    if (!sectionText || sectionText.length < 3) return;
    
    try {
      console.log(`Attempting to highlight section: "${sectionText}" on page ${page}`);
      
      // Method 1: Adobe search and highlight API
      if (adobeViewRef.current && window.AdobeDC) {
        try {
          const annotationManager = adobeViewRef.current.getAnnotationManager();
          if (annotationManager) {
            // Search for the section text
            const searchResults = await adobeViewRef.current.search(sectionText, {
              caseSensitive: false,
              wholeWords: false,
              matchCase: false
            });

            if (searchResults && searchResults.length > 0) {
              // Find result on the target page or closest page
              const targetResult = searchResults.find((r: any) => r.page === page) || 
                                 searchResults.find((r: any) => Math.abs(r.page - page) <= 1) ||
                                 searchResults[0];
              
              if (targetResult) {
                // Create a temporary highlight
                await annotationManager.addAnnotation({
                  type: 'highlight',
                  page: targetResult.page,
                  bounds: targetResult.bounds,
                  color: '#FFE066', // Light yellow
                  opacity: 0.4,
                  content: `Section: ${sectionText}`,
                  isTemporary: true
                });

                console.log(`Successfully highlighted section on page ${targetResult.page}`);
                
                // Remove highlight after 5 seconds
                setTimeout(async () => {
                  try {
                    const annotations = await annotationManager.getAnnotations();
                    const tempAnnotation = annotations.find((a: any) => 
                      a.isTemporary && a.content && a.content.includes(sectionText)
                    );
                    if (tempAnnotation) {
                      await annotationManager.removeAnnotation(tempAnnotation.id);
                    }
                  } catch (removeError) {
                    console.log('Could not remove temporary highlight:', removeError);
                  }
                }, 5000);
                
                return; // Success, no need for fallback
              }
            }
          }
        } catch (adobeError) {
          console.warn('Adobe highlighting failed:', adobeError);
        }
      }
      
      // Method 2: DOM-based highlighting fallback
      await domBasedHighlighting(sectionText, page);
      
    } catch (error) {
      console.log('Section highlighting failed:', error);
      // Show a toast indicating the section we're looking for
      toast({
        title: "Section Located",
        description: `Looking for: "${sectionText.substring(0, 50)}${sectionText.length > 50 ? '...' : ''}"`,
        duration: 3000
      });
    }
  };

  // DOM-based highlighting as fallback
  const domBasedHighlighting = async (sectionText: string, page: number) => {
    try {
      // Wait a bit for PDF to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to find text in the DOM
      const container = document.getElementById('adobe-dc-view');
      if (container) {
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let node;
        const searchText = sectionText.toLowerCase();
        
        while (node = walker.nextNode()) {
          const nodeText = node.textContent?.toLowerCase() || '';
          if (nodeText.includes(searchText.substring(0, 20))) { // Match first 20 chars
            // Found the text, highlight the parent element
            const parentElement = node.parentElement;
            if (parentElement) {
              parentElement.style.backgroundColor = '#FFE06680';
              parentElement.style.border = '2px solid #FFD700';
              parentElement.style.borderRadius = '3px';
              parentElement.style.padding = '2px';
              
              // Scroll into view
              parentElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              
              console.log('DOM-based highlighting successful');
              
              // Remove highlight after 5 seconds
              setTimeout(() => {
                parentElement.style.backgroundColor = '';
                parentElement.style.border = '';
                parentElement.style.borderRadius = '';
                parentElement.style.padding = '';
              }, 5000);
              
              break;
            }
          }
        }
      }
    } catch (error) {
      console.log('DOM-based highlighting failed:', error);
    }
  };

  // Effect to handle goToSection prop changes
  useEffect(() => {
    if (goToSection && isReady) {
      goToLocation(goToSection.page, goToSection.section);
    }
  }, [goToSection, isReady]);

  // Apply highlights when they change or page changes
  useEffect(() => {
    if (highlights.length > 0) {
      // Add styles if not already added
      pdfHighlighter.addHighlightStyles();
      
      // Apply highlights with a small delay to ensure PDF content is rendered
      const timeoutId = setTimeout(() => {
        pdfHighlighter.applyHighlights(highlights, currentHighlightPage || currentPage);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [highlights, currentHighlightPage, currentPage]);

  // Suppress Adobe PDF feature flag errors globally
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('GET_FEATURE_FLAG:') && message.includes('enable-')) {
        // Suppress Adobe PDF feature flag errors
        return;
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('GET_FEATURE_FLAG:') && message.includes('enable-')) {
        // Suppress Adobe PDF feature flag warnings
        return;
      }
      if (message.includes('[mobx.array]') && message.includes('out of bounds')) {
        // Suppress MobX array bounds warnings
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    if (!documentUrl || !viewerRef.current) return;

    const initializeViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsReady(false);

        // Wait for Adobe DC to be available with timeout
        const adobeTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Adobe SDK timeout")), 10000)
        );
        
        const adobeReady = new Promise((resolve) => {
          const checkAdobeDC = () => {
            if (window.AdobeDC) {
              resolve(true);
            } else {
              setTimeout(checkAdobeDC, 100);
            }
          };
          checkAdobeDC();
        });

        await Promise.race([adobeReady, adobeTimeout]);

        // Configure Adobe PDF Embed
        const adobeDCView = new window.AdobeDC.View({
          clientId: clientId || process.env.VITE_ADOBE_CLIENT_ID || "85e35211c6c24c5bb8a6c4c8b9a2b4e8",
          divId: "adobe-dc-view",
          locale: "en-US",
        });

        adobeViewRef.current = adobeDCView;

        // CRITICAL: Enable text selection and annotation events
        await adobeDCView.previewFile({
          content: { location: { url: documentUrl } },
          metaData: { fileName: documentName }
        }, {
          // Enable the APIs we need
          enableFormFillAPIs: true,
          enablePDFAnalytics: false,
          
          // IMPORTANT: Enable text selection events
          showAnnotationTools: false, // We'll create custom tools
          showLeftHandPanel: false,
          showDownloadPDF: false,
          
          // Enable text selection callbacks
          enableTextSelection: true,
          enableSearchAPIs: true
        });

        // REGISTER TEXT SELECTION EVENT LISTENER
        adobeDCView.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.GET_USER_PROFILE_API,
          () => ({ userProfile: { name: "User", email: "user@example.com" } })
        );

        // CRITICAL: Register text selection event
        adobeDCView.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.TEXT_SELECTION,
          handleTextSelection,
          { enableTextSelection: true }
        );

        // Register event listeners
        adobeDCView.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
          (event: any) => {
            console.log('Adobe PDF Event:', event.type, event.data);
            switch (event.type) {
              case "PAGE_VIEW":
                setCurrentPage(event.data.pageNumber);
                if (onPageChange) {
                  onPageChange(event.data.pageNumber);
                }
                break;
              case "TEXT_SELECTION":
                handleTextSelection(event);
                break;
              case "DOCUMENT_OPEN":
              case "APP_RENDERING_DONE":
                console.log("PDF document loaded successfully");
                setIsLoading(false);
                setIsReady(true);
                break;
              case "DOCUMENT_ERROR":
              case "APP_RENDERING_FAILED":
                console.error("PDF document error:", event.data);
                setError("Failed to load PDF document");
                setIsLoading(false);
                setIsReady(false);
                break;
            }
          },
          { enablePDFAnalytics: false }
        );

        setIsReady(true);

      } catch (err) {
        console.error("Error initializing Adobe PDF viewer:", err);
        setError(`Failed to initialize PDF viewer: ${err.message}`);
        setIsLoading(false);
        setIsReady(false);
      }
    };

    initializeViewer();

    // Cleanup
    return () => {
      if (adobeViewRef.current) {
        try {
          adobeViewRef.current.destroy();
        } catch (err) {
          console.warn("Error destroying Adobe PDF viewer:", err);
        }
      }
    };
  }, [documentUrl, documentName, clientId]);

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
    <div className="relative h-full w-full flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-primary" />
            <p className="text-sm text-text-secondary">Loading PDF...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-center max-w-md">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      )}
      
      <div 
        id="adobe-dc-view" 
        ref={viewerRef}
        className="flex-1 w-full h-full"
      />

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
      />

      {/* AI Popup */}
      <AiPopup
        aiPopup={aiPopup}
        onClose={() => setAiPopup({ ...aiPopup, visible: false })}
      />

      {/* Loading overlay for AI operations */}
      {loading.active && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 flex items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            <span className="text-white">
              {loading.type === 'simplify' ? 'Simplifying text...' : 'Generating insights...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced fallback PDF viewer with PDF.js integration and better navigation
export function FallbackPDFViewer({ 
  documentUrl, 
  documentName,
  highlights = [],
  currentPage = 1,
  goToSection,
  onPageChange,
  onTextSelection
}: { 
  documentUrl: string; 
  documentName: string;
  highlights?: Highlight[];
  currentPage?: number;
  goToSection?: { page: number; section?: string } | null;
  onPageChange?: (page: number) => void;
  onTextSelection?: (text: string, page: number) => void;
}) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [pdfPage, setPdfPage] = useState(currentPage);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();
  
  // Enhanced PDF.js URL with better parameters for navigation and features
  const pdfJsUrl = useMemo(() => {
    const baseUrl = documentUrl;
    const params = new URLSearchParams({
      page: pdfPage.toString(),
      zoom: (zoomLevel * 100).toString(),
      toolbar: '1',
      navpanes: '1',
      scrollbar: '1',
      statusbar: '1',
      messages: '0',
      printResolution: '150'
    });
    
    // Use PDF.js viewer if available, otherwise fallback to browser default
    const viewerUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(baseUrl)}#${params.toString()}`;
    return viewerUrl;
  }, [documentUrl, pdfPage, zoomLevel]);
  
  // Apply highlights when they change or page changes
  useEffect(() => {
    if (highlights.length > 0) {
      // Add styles if not already added
      pdfHighlighter.addHighlightStyles();
      
      // Apply highlights with a delay to ensure iframe content is loaded
      const timeoutId = setTimeout(() => {
        pdfHighlighter.applyHighlights(highlights, pdfPage);
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [highlights, pdfPage]);
  
  // Handle goToSection navigation
  useEffect(() => {
    if (goToSection && goToSection.page !== pdfPage) {
      navigateToPage(goToSection.page, goToSection.section);
    }
  }, [goToSection]);
  
  // Enhanced page navigation
  const navigateToPage = async (page: number, section?: string) => {
    try {
      console.log(`Fallback viewer navigating to page ${page}${section ? ` for section: ${section}` : ''}`);
      
      setPdfPage(page);
      
      // Update iframe if it exists
      if (iframeRef.current) {
        const newUrl = documentUrl + `#page=${page}&zoom=${zoomLevel * 100}`;
        iframeRef.current.src = newUrl;
      }
      
      if (onPageChange) {
        onPageChange(page);
      }
      
      // If section is provided, try to highlight it after a delay
      if (section) {
        setTimeout(() => {
          highlightSectionInFallback(section);
        }, 2000);
      }
      
      toast({
        title: "Navigation",
        description: `Navigated to page ${page}${section ? ` - Looking for: ${section.substring(0, 30)}...` : ''}`,
        duration: 2000
      });
      
    } catch (error) {
      console.error('Fallback navigation failed:', error);
      toast({
        title: "Navigation Error",
        description: "Could not navigate to the specified page",
        variant: "destructive"
      });
    }
  };
  
  // Highlight section in fallback viewer
  const highlightSectionInFallback = async (sectionText: string) => {
    try {
      if (!iframeRef.current) return;
      
      // Try to access iframe content and search for text
      const iframe = iframeRef.current;
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Search for text in iframe
          const searchText = sectionText.toLowerCase().substring(0, 30);
          const walker = iframeDoc.createTreeWalker(
            iframeDoc.body,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let node;
          while (node = walker.nextNode()) {
            const nodeText = node.textContent?.toLowerCase() || '';
            if (nodeText.includes(searchText)) {
              const parentElement = node.parentElement;
              if (parentElement) {
                parentElement.style.backgroundColor = '#FFE06680';
                parentElement.style.border = '2px solid #FFD700';
                parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Remove highlight after 5 seconds
                setTimeout(() => {
                  parentElement.style.backgroundColor = '';
                  parentElement.style.border = '';
                }, 5000);
                break;
              }
            }
          }
        }
      } catch (crossOriginError) {
        console.log('Cannot access iframe content due to cross-origin restrictions');
        // Show a toast indicating what we're looking for
        toast({
          title: "Section Located",
          description: `Looking for: "${sectionText.substring(0, 40)}${sectionText.length > 40 ? '...' : ''}"`,
          duration: 4000
        });
      }
    } catch (error) {
      console.log('Section highlighting in fallback failed:', error);
    }
  };
  
  // Handle text selection in fallback viewer
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const text = selection.toString();
        setSelectedText(text);
        setSelectionPosition({
          x: e.clientX,
          y: e.clientY
        });
        
        if (onTextSelection) {
          onTextSelection(text, pdfPage);
        }
      }
    };
    
    // Enhanced text selection handling
    const handleTextSelection = (e: Event) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const text = selection.toString();
        setSelectedText(text);
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
        
        if (onTextSelection) {
          onTextSelection(text, pdfPage);
        }
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mouseup', handleTextSelection);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [pdfPage, onTextSelection]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    toast({
      title: "Copied",
      description: "Text copied to clipboard"
    });
    setSelectedText('');
    setSelectionPosition(null);
  };
  
  const handlePreviousPage = () => {
    if (pdfPage > 1) {
      navigateToPage(pdfPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (pdfPage < totalPages) {
      navigateToPage(pdfPage + 1);
    }
  };
  
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.25, 3.0);
    setZoomLevel(newZoom);
  };
  
  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.25, 0.25);
    setZoomLevel(newZoom);
  };
  
  const handleZoomFit = () => {
    setZoomLevel(1.0);
  };
  
  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
    
    // Try to extract total pages from PDF.js if possible
    setTimeout(() => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          // This might work with PDF.js viewer
          const pdfViewer = (iframe.contentWindow as any).PDFViewerApplication;
          if (pdfViewer && pdfViewer.pdfDocument) {
            setTotalPages(pdfViewer.pdfDocument.numPages);
          }
        }
      } catch (error) {
        console.log('Could not extract total pages from PDF.js');
      }
    }, 2000);
  };
  
  const handleIframeError = () => {
    setIsLoading(false);
    setError("Failed to load PDF document");
  };
  
  return (
    <div className="h-full flex flex-col bg-surface-elevated rounded-lg border border-border-subtle">
      {/* Enhanced toolbar */}
      <div className="p-4 border-b border-border-subtle bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-text-primary">{documentName}</h3>
            <p className="text-sm text-text-secondary">
              Enhanced PDF viewer with navigation support
            </p>
          </div>
          
          {/* Navigation and zoom controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={pdfPage <= 1}
            >
              ← Prev
            </Button>
            
            <span className="text-sm text-text-secondary px-2">
              Page {pdfPage} {totalPages > 0 && `of ${totalPages}`}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={totalPages > 0 && pdfPage >= totalPages}
            >
              Next →
            </Button>
            
            <div className="w-px h-6 bg-border-subtle mx-2" />
            
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              −
            </Button>
            <span className="text-sm text-text-secondary px-2">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              +
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomFit}>
              Fit
            </Button>
          </div>
        </div>
      </div>
      
      {/* PDF content area */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-primary" />
              <p className="text-sm text-text-secondary">Loading PDF...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="text-center max-w-md">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Reload PDF
              </Button>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={pdfJsUrl}
          className="w-full h-full border-0"
          title={documentName}
          sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
        
        {/* Enhanced context menu for text selection */}
        {selectionPosition && selectedText && (
          <div
            className="fixed z-50 bg-white shadow-lg rounded-md border border-gray-200"
            style={{
              left: `${Math.min(selectionPosition.x, window.innerWidth - 200)}px`,
              top: `${Math.max(selectionPosition.y - 50, 10)}px`
            }}
          >
            <div className="p-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded w-full text-left"
              >
                <Copy className="h-4 w-4" />
                Copy text
              </button>
              <div className="text-xs text-gray-500 px-3 py-1 border-t mt-1">
                Selected: "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}