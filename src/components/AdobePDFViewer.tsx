import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { TextSelectionMenu } from './TextSelectionMenu';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

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
}

export function AdobePDFViewer({ 
  documentUrl, 
  documentName, 
  onPageChange, 
  onTextSelection,
  clientId 
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

  // Handle text selection
  useEffect(() => {
    const handleTextSelection = (e: Event) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const text = selection.toString();
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
      } else if (e.type === 'mouseup') {
        // Clear selection if no text is selected
        clearSelection();
      }
    };

    // Prevent default context menu when text is selected to show custom menu
    const preventDefaultContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Enhanced selection handling for Adobe PDF viewer
    const handleSelectionChange = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          const text = selection.toString();
          setSelectedText(text);
          
          // Get selection position for context menu
          try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelectionPosition({
              x: rect.left + rect.width / 2,
              y: rect.top - 10 // Position above selection
            });
            
            if (onTextSelection) {
              onTextSelection(text, currentPage);
            }
          } catch (error) {
            console.log('Could not get selection position:', error);
          }
        }
      }, 100); // Small delay to ensure selection is complete
    };

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    document.addEventListener('contextmenu', preventDefaultContextMenu);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
      document.removeEventListener('contextmenu', preventDefaultContextMenu);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [currentPage, onTextSelection]);

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

  const handleSimplify = async () => {
    try {
      const simplified = await apiService.simplifyText(selectedText);
      toast({
        title: "Simplified Text",
        description: simplified.text
      });
    } catch (error) {
      console.error('Failed to simplify text:', error);
    }
    clearSelection();
  };

  const handleTranslate = async () => {
    // Implement translation
    toast({
      title: "Translation",
      description: "Translation feature coming soon!"
    });
    clearSelection();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    toast({
      title: "Copied",
      description: "Text copied to clipboard"
    });
    clearSelection();
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(selectedText);
      window.speechSynthesis.speak(utterance);
      toast({
        title: "Reading Aloud",
        description: "Text is being read aloud"
      });
    }
    clearSelection();
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
        // Store globally for highlight functionality
        (window as any).adobeViewInstance = adobeDCView;

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
        onHighlight={handleHighlight}
        onSimplify={handleSimplify}
        onTranslate={handleTranslate}
        onCopy={handleCopy}
        onSpeak={handleSpeak}
        onClose={clearSelection}
      />
    </div>
  );
}

// Fallback PDF viewer for when Adobe API is not available
export function FallbackPDFViewer({ documentUrl, documentName }: { documentUrl: string; documentName: string }) {
  return (
    <div className="h-full flex flex-col bg-surface-elevated rounded-lg border border-border-subtle">
      <div className="p-4 border-b border-border-subtle">
        <h3 className="font-medium text-text-primary">{documentName}</h3>
        <p className="text-sm text-text-secondary">Fallback PDF viewer</p>
      </div>
      
      <div className="flex-1 p-4">
        <iframe
          src={`${documentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-full border-0 rounded"
          title={documentName}
        />
      </div>
    </div>
  );
}