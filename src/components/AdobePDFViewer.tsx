import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy } from 'lucide-react';
import { TextSelectionMenu } from './TextSelectionMenu';
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
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Enhanced text selection with Adobe API
  const handleAdobeTextSelection = async () => {
    if (!adobeViewRef.current || !window.AdobeDC) return;

    try {
      // Use Adobe's text selection API
      const annotationManager = adobeViewRef.current.getAnnotationManager();
      const previewFilePromise = adobeViewRef.current.getFilePromise();
      
      if (annotationManager && previewFilePromise) {
        // Listen for text selection events
        adobeViewRef.current.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.GET_USER_PROFILE_API,
          (profile: any) => {
            console.log('User profile:', profile);
          }
        );

        // Enhanced text selection event
        adobeViewRef.current.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.TEXT_SEARCH_API,
          (searchResult: any) => {
            console.log('Text search result:', searchResult);
          }
        );

        // Listen for annotation events
        annotationManager.registerEventListener(
          (event: any) => {
            if (event.type === 'ANNOTATION_SELECTED') {
              const annotation = event.data;
              if (annotation.type === 'textSelection') {
                setSelectedText(annotation.content || '');
                if (onTextSelection) {
                  onTextSelection(annotation.content || '', annotation.page || currentPage);
                }
              }
            }
          },
          { listenOn: window.AdobeDC.View.Enum.EventType.ANNOTATION_SELECTED }
        );
      }
    } catch (error) {
      console.log('Adobe text selection API not fully available, using fallback');
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

  // Handle text selection
  useEffect(() => {
    const handleTextSelection = (e: Event) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const text = selection.toString();
        console.log('Text selected:', text);
        setSelectedText(text);
        
        // Get selection position for context menu
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
        
        if (onTextSelection) {
          onTextSelection(text, currentPage);
        }
      } else if (e.type === 'mouseup' && !selectedText) {
        // Only clear selection if there's no selected text and it's a mouseup
        clearSelection();
      }
    };

    // Handle right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Always prevent default context menu
      
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        e.stopPropagation();
        
        // Set the selected text and position
        const text = selection.toString();
        console.log('Context menu triggered for:', text);
        setSelectedText(text);
        setSelectionPosition({
          x: e.clientX,
          y: e.clientY
        });
        
        if (onTextSelection) {
          onTextSelection(text, currentPage);
        }
      } else {
        // If no text is selected, show a message
        console.log('No text selected for context menu');
        clearSelection();
      }
    };

    // Add event listeners to document and the viewer container
    const addListeners = () => {
      console.log('Adding text selection listeners');
      document.addEventListener('mouseup', handleTextSelection);
      document.addEventListener('touchend', handleTextSelection);
      document.addEventListener('contextmenu', handleContextMenu);
      
      // Also add to the Adobe DC view container
      const adobeContainer = document.getElementById('adobe-dc-view');
      if (adobeContainer) {
        adobeContainer.addEventListener('contextmenu', handleContextMenu);
      }
      
      // Try to add to iframe content if available
      const iframe = document.querySelector('iframe');
      if (iframe) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.addEventListener('mouseup', handleTextSelection);
            iframeDoc.addEventListener('contextmenu', handleContextMenu);
            console.log('Added listeners to iframe document');
          }
        } catch (e) {
          console.log('Could not access iframe content (cross-origin)');
        }
      }
    };

    // Add listeners with a delay to ensure the PDF is loaded
    const timeoutId = setTimeout(addListeners, 2000);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
      document.removeEventListener('contextmenu', handleContextMenu);
      
      const adobeContainer = document.getElementById('adobe-dc-view');
      if (adobeContainer) {
        adobeContainer.removeEventListener('contextmenu', handleContextMenu);
      }
      
      const iframe = document.querySelector('iframe');
      if (iframe) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.removeEventListener('mouseup', handleTextSelection);
            iframeDoc.removeEventListener('contextmenu', handleContextMenu);
          }
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
    };
  }, [currentPage, onTextSelection, selectedText]);

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

  const handleHighlight = async (color: 'yellow' | 'green' | 'blue' | 'pink') => {
    // Store highlight in backend
    try {
      await apiService.addHighlight({
        text: selectedText,
        color,
        page: currentPage,
        documentName
      });
      
      toast({
        title: "Text Highlighted",
        description: `Added ${color} highlight to page ${currentPage}`
      });
      
      // Trigger text selection callback to parent for insights generation
      if (onTextSelection && selectedText.length > 50) {
        console.log('Triggering insights generation for highlighted text');
        onTextSelection(selectedText, currentPage);
      }

      // Apply visual highlight to PDF using Adobe PDF Embed API
      if (adobeViewRef.current && window.AdobeDC) {
        try {
          // Create annotation using Adobe PDF API
          const annotationManager = adobeViewRef.current.getAnnotationManager();
          if (annotationManager) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              
              // Create highlight annotation
              annotationManager.addAnnotation({
                type: 'highlight',
                color: color === 'yellow' ? '#FFFF00' : 
                       color === 'green' ? '#00FF00' : 
                       color === 'blue' ? '#0000FF' : '#FF69B4',
                page: currentPage,
                bounds: {
                  x: rect.left,
                  y: rect.top,
                  width: rect.width,
                  height: rect.height
                },
                content: selectedText
              });
            }
          }
        } catch (annotationError) {
          console.log('Adobe annotation API not available, using fallback highlighting');
          // Fallback: Add highlight overlay using DOM manipulation
          addHighlightOverlay(selectedText, color, currentPage);
        }
      } else {
        // Fallback highlighting for when Adobe API is not available
        addHighlightOverlay(selectedText, color, currentPage);
      }
    } catch (error) {
      console.error('Failed to add highlight:', error);
      toast({
        title: "Highlight Failed",
        description: "Failed to add highlight. Please try again.",
        variant: "destructive"
      });
    }
    
    clearSelection();
  };

  // Fallback highlight overlay function
  const addHighlightOverlay = (text: string, color: string, page: number) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    try {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.className = `pdf-highlight pdf-highlight-${color}`;
      span.style.backgroundColor = color === 'yellow' ? '#FFFF0080' : 
                                   color === 'green' ? '#00FF0080' : 
                                   color === 'blue' ? '#0000FF80' : '#FF69B480';
      span.style.borderRadius = '2px';
      span.style.padding = '1px 2px';
      
      try {
        range.surroundContents(span);
      } catch (e) {
        // If we can't surround contents, extract and wrap
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
    } catch (error) {
      console.log('Could not apply visual highlight overlay:', error);
    }
  };



  const clearSelection = () => {
    setSelectedText('');
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
  };

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
          clientId: clientId || "85e35211c6c24c5bb8a6c4c8b9a2b4e8", // Better default client ID
          divId: viewerRef.current.id,
          // Suppress feature flag warnings
          enableFeatureFlags: {
            "enable-tools-multidoc": false,
            "edit-config": false,
            "enable-accessibility": false,
            "preview-config": false,
            "enable-inline-organize": false,
            "enable-pdf-request-signatures": false,
            "DCWeb_edit_image_experiment": false
          }
        });

        adobeViewRef.current = adobeDCView;

        // PDF viewing configuration
        const viewerConfig = {
          embedMode: "SIZED_CONTAINER",
          showAnnotationTools: true,
          showLeftHandPanel: false,
          showDownloadPDF: true,
          showPrintPDF: true,
          showZoomControl: true,
          enableFormFilling: false,
          showPageControls: true,
          dockPageControls: false,
          showBookmarks: false,
          enableAnnotations: true,
          enableTextSelection: true,
          // Annotation tools configuration
          annotationTools: {
            highlight: true,
            strikethrough: true,
            underline: true,
            squiggly: true,
            note: true,
            freeText: true
          },
          // Disable feature flags that cause console errors
          enableFeatureFlags: {
            "enable-tools-multidoc": false,
            "edit-config": false,
            "enable-accessibility": false,
            "preview-config": false,
            "enable-inline-organize": false,
            "enable-pdf-request-signatures": false,
            "DCWeb_edit_image_experiment": false
          }
        };

        // Set loading timeout before loading PDF
        const loadingTimeoutId = setTimeout(() => {
          console.log("PDF loading timeout reached");
          setIsLoading(false);
          setIsReady(true);
        }, 8000);

        // Register event listeners first
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
                if (event.data.selection) {
                  setSelectedText(event.data.selection.text);
                  setCurrentPage(event.data.selection.pageNumber);
                  if (onTextSelection) {
                    onTextSelection(
                      event.data.selection.text,
                      event.data.selection.pageNumber
                    );
                  }
                }
                break;
              case "DOCUMENT_OPEN":
              case "APP_RENDERING_DONE":
                console.log("PDF document loaded successfully");
                clearTimeout(loadingTimeoutId);
                setIsLoading(false);
                setIsReady(true);
                break;
              case "DOCUMENT_ERROR":
              case "APP_RENDERING_FAILED":
                console.error("PDF document error:", event.data);
                clearTimeout(loadingTimeoutId);
                setError("Failed to load PDF document");
                setIsLoading(false);
                setIsReady(false);
                break;
            }
          },
          { enablePDFAnalytics: false }
        );

        // Load the PDF after setting up callbacks
        await adobeDCView.previewFile({
          content: { location: { url: documentUrl } },
          metaData: { fileName: documentName }
        }, viewerConfig);

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

  // Generate unique ID for the viewer container
  const viewerId = `adobe-pdf-viewer-${Math.random().toString(36).substr(2, 9)}`;

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

      {/* Text Selection Context Menu */}
      <TextSelectionMenu
        selectedText={selectedText}
        position={selectionPosition}
        pageContext={`Page ${currentPage} of ${documentName}`}
        documentId={documentUrl}
        onHighlight={handleHighlight}
        onClose={clearSelection}
      />
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