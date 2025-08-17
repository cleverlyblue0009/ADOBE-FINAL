import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { pdfHighlighter } from '@/lib/pdfHighlighter';
import { Highlight } from './PDFReader';
import { ReactPDFViewer } from './ReactPDFViewer';
import { FallbackPDFViewer } from './FallbackPDFViewer';

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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contextMenu.visible && menuRef.current) {
      menuRef.current.focus();
      console.log("✅ Custom context menu rendered and focused");
    }
  }, [contextMenu.visible]);

  useEffect(() => {
    console.log("🎛️ Context menu state changed:", {
      visible: contextMenu.visible,
      selectedText: contextMenu.selectedText?.substring(0, 30),
      position: contextMenu.position,
      optionsCount: contextMenu.options?.length
    });
  }, [contextMenu]);

  if (!contextMenu.visible) {
    console.log("❌ Context menu not visible, returning null");
    return null;
  }

  console.log("🎨 Rendering context menu with position:", contextMenu.position);

  return (
    <>
      {/* Invisible backdrop to catch clicks */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* OUR CUSTOM AI-POWERED CONTEXT MENU */}
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
        
        {/* AI-POWERED MENU OPTIONS */}
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

  // Enhanced text selection using DOM events instead of Adobe callbacks
  const setupPdfTextSelection = () => {
    console.log("🔍 Setting up PDF text selection...");
    
    // Function to check if PDF is ready and set up text selection
    const attemptSetup = (retryCount = 0) => {
      const maxRetries = 10;
      const retryDelay = 1000;
      
      console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries} to set up text selection`);
      
      if (retryCount >= maxRetries) {
        console.error("❌ Failed to set up text selection after maximum retries");
        return;
      }
      const pdfContainer = document.getElementById('adobe-dc-view');
      if (!pdfContainer) {
        console.warn(`❌ PDF container not found on attempt ${retryCount + 1}, retrying...`);
        setTimeout(() => attemptSetup(retryCount + 1), retryDelay);
        return;
      }

      // Check if PDF content is actually loaded (look for iframe or canvas elements)
      const pdfContent = pdfContainer.querySelector('iframe, canvas, embed, object');
      if (!pdfContent) {
        console.warn(`⏳ PDF content not loaded yet on attempt ${retryCount + 1}, retrying...`);
        setTimeout(() => attemptSetup(retryCount + 1), retryDelay);
        return;
      }

      console.log("✅ PDF container and content found, adding event listeners");

      // CRITICAL: Prevent default context menu on PDF container and ALL its children
      const preventContextMenu = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log("Default context menu prevented on PDF container");
        return false;
      };

      // Add context menu prevention to container and all child elements
      pdfContainer.addEventListener('contextmenu', preventContextMenu, true);
      
      // NUCLEAR OPTION: Also prevent on all iframes within the container
      const preventIframeContextMenu = () => {
        const iframes = pdfContainer.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            iframe.addEventListener('contextmenu', preventContextMenu, true);
            // Also try to access iframe content if same-origin
            if (iframe.contentDocument) {
              iframe.contentDocument.addEventListener('contextmenu', preventContextMenu, true);
            }
          } catch (e) {
            console.log('Could not access iframe content (cross-origin)');
          }
        });
      };

      // Run iframe prevention immediately and periodically
      preventIframeContextMenu();
      const iframeInterval = setInterval(preventIframeContextMenu, 1000);

      // Handle text selection immediately (not on right-click)
      const handlePdfTextSelection = (event: MouseEvent) => {
        console.log("🖱️ Text selection event triggered:", event.type, "at", event.clientX, event.clientY);

        // Small delay to ensure selection is captured properly
        setTimeout(() => {
          const selection = window.getSelection();
          const selectedText = selection?.toString().trim();
          
          console.log("📝 Text selection detected:", selectedText ? `"${selectedText.substring(0, 50)}..."` : "NO TEXT SELECTED");
          console.log("📊 Selection details:", {
            rangeCount: selection?.rangeCount,
            type: selection?.type,
            anchorNode: selection?.anchorNode?.nodeName,
            focusNode: selection?.focusNode?.nodeName
          });
          
          if (!selectedText || selectedText.length === 0) {
            console.log("❌ No text selected, hiding context menu");
            setContextMenu({ visible: false, selectedText: '', position: null, pageNumber: 1, options: [] });
            return;
          }

          // Get selection position for menu placement
          const range = selection?.getRangeAt(0);
          if (!range) return;
          
          const rect = range.getBoundingClientRect();
          
          // Verify selection is within PDF container
          const pdfRect = pdfContainer.getBoundingClientRect();
          
          console.log("📐 Position check:", {
            selectionRect: rect,
            pdfRect: pdfRect,
            isWithinBounds: rect.top >= pdfRect.top && rect.left >= pdfRect.left && 
                           rect.bottom <= pdfRect.bottom && rect.right <= pdfRect.right
          });

          if (rect.top >= pdfRect.top && rect.left >= pdfRect.left && 
              rect.bottom <= pdfRect.bottom && rect.right <= pdfRect.right) {
            
            console.log("✅ Showing custom context menu at:", rect);
            
            // Show OUR custom menu immediately
            showContextMenu({
              text: selectedText,
              position: {
                x: rect.left + (rect.width / 2),
                y: rect.bottom + 10,
                width: rect.width,
                height: rect.height
              },
              pageNumber: currentPage
            });
          } else {
            console.log("❌ Selection is outside PDF bounds, showing menu anyway as fallback");
            // Show menu anyway as fallback - user might have selected text in an iframe
            showContextMenu({
              text: selectedText,
              position: {
                x: rect.left + (rect.width / 2),
                y: rect.bottom + 10,
                width: rect.width,
                height: rect.height
              },
              pageNumber: currentPage
            });
          }
        }, 50); // Reduced delay for faster response
      };

      // Enhanced selection change handler
      const handleSelectionChange = () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        
        if (!selectedText) {
          // Only hide menu if no text is selected
          setContextMenu({ visible: false, selectedText: '', position: null, pageNumber: 1, options: [] });
          return;
        }

        // Check if selection is in PDF area
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          const pdfContainer = document.getElementById('adobe-dc-view');
          
          if (pdfContainer && (pdfContainer.contains(container) || pdfContainer === container)) {
            const rect = range.getBoundingClientRect();
            
            console.log("Selection change detected in PDF:", selectedText);
            
            // Show custom menu immediately when text is selected
            showContextMenu({
              text: selectedText,
              position: {
                x: rect.left + (rect.width / 2),
                y: rect.bottom + 10,
                width: rect.width,
                height: rect.height
              },
              pageNumber: currentPage
            });
          }
        }
      };

      // Add multiple event listeners for comprehensive text selection detection
      pdfContainer.addEventListener('mouseup', handlePdfTextSelection, true);
      pdfContainer.addEventListener('touchend', handlePdfTextSelection, true);
      pdfContainer.addEventListener('click', handlePdfTextSelection, true);
      
      // Also add to any iframes within the PDF container
      const addEventListenersToIframes = () => {
        const iframes = pdfContainer.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            // Add events to iframe itself
            iframe.addEventListener('mouseup', handlePdfTextSelection, true);
            iframe.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              const event = new MouseEvent('contextmenu', {
                clientX: e.clientX,
                clientY: e.clientY,
                bubbles: true
              });
              pdfContainer.dispatchEvent(event);
            }, true);
            
            // Try to access iframe content if same-origin
            if (iframe.contentDocument) {
              iframe.contentDocument.addEventListener('mouseup', handlePdfTextSelection, true);
              iframe.contentDocument.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const event = new MouseEvent('contextmenu', {
                  clientX: e.clientX + iframe.offsetLeft,
                  clientY: e.clientY + iframe.offsetTop,
                  bubbles: true
                });
                pdfContainer.dispatchEvent(event);
              }, true);
            }
          } catch (e) {
            console.log('Could not access iframe content (cross-origin)');
          }
        });
      };
      
      // Run iframe setup immediately and periodically
      addEventListenersToIframes();
      const iframeSetupInterval = setInterval(addEventListenersToIframes, 2000);
      
      // Global selection change listener
      document.addEventListener('selectionchange', handleSelectionChange);
      
      // Prevent right-click default behavior on all mouse buttons
      pdfContainer.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // Right click
          e.preventDefault();
          e.stopPropagation();
          console.log("Right-click prevented");
        }
      }, true);

      // Also prevent on mouse context menu specifically
      pdfContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log("🚫 Context menu event specifically prevented");
        
        // If there's selected text, show our menu
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        console.log("🔍 Right-click detected - Selected text:", selectedText ? `"${selectedText.substring(0, 30)}..."` : "NONE");
        
        if (selectedText) {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          console.log("📍 Right-click position:", { x: e.clientX, y: e.clientY, rect });
          
          if (rect) {
            console.log("✅ Showing context menu from right-click");
            showContextMenu({
              text: selectedText,
              position: {
                x: e.clientX,
                y: e.clientY,
                width: rect.width,
                height: rect.height
              },
              pageNumber: currentPage
            });
          } else {
            console.log("❌ No selection range found for right-click");
          }
        } else {
          console.log("❌ No selected text for right-click context menu");
        }
        return false;
      }, true);

      console.log("Enhanced text selection setup complete");
      
              // Store cleanup function
        return () => {
          clearInterval(iframeInterval);
          clearInterval(iframeSetupInterval);
          pdfContainer.removeEventListener('mouseup', handlePdfTextSelection, true);
          pdfContainer.removeEventListener('touchend', handlePdfTextSelection, true);
          pdfContainer.removeEventListener('click', handlePdfTextSelection, true);
          pdfContainer.removeEventListener('contextmenu', preventContextMenu, true);
          document.removeEventListener('selectionchange', handleSelectionChange);
        };
      };
      
      // Start the setup attempts
      attemptSetup();
    };

  // Handle Adobe PDF text selection events (REMOVED - this was causing the error)
  // const handleTextSelection = async (event: any) => {
  //   console.log("PDF Text Selected:", event);
  //   // This function is no longer needed as we use DOM-based selection
  // };

  const showContextMenu = ({ text, position, pageNumber }: { 
    text: string; 
    position: { x: number; y: number; width: number; height: number }; 
    pageNumber: number 
  }) => {
    console.log("🎯 showContextMenu called with:", { text: text.substring(0, 30), position, pageNumber });
    
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

  const highlightText = async (text: string, position: { x: number; y: number; width: number; height: number }, pageNumber: number) => {
    try {
      // Visual feedback for highlighting
      console.log("Highlighting:", text);
      
      // Store highlight in state/localStorage
      const highlight = {
        id: Date.now(),
        text: text,
        position: position,
        pageNumber: pageNumber,
        type: "highlight",
        timestamp: new Date().toISOString()
      };
      
      // Close context menu
      setContextMenu({ visible: false, selectedText: '', position: null, pageNumber: 1, options: [] });
      
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

  // Global context menu prevention for PDF area (SIMPLIFIED to avoid conflicts)
  useEffect(() => {
    // Less aggressive global prevention - only prevent if no text is selected
    const preventContextMenu = (e: Event) => {
      const pdfContainer = document.getElementById('adobe-dc-view');
      const target = e.target as Node;
      
      if (pdfContainer && (pdfContainer.contains(target) || pdfContainer === target)) {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        
        console.log("🌍 Global context menu event - Selected text:", selectedText ? `"${selectedText.substring(0, 30)}..."` : "NONE");
        
        // Always prevent default context menu
        e.preventDefault();
        e.stopPropagation();
        
        // If there's selected text, show our custom menu
        if (selectedText && e instanceof MouseEvent) {
          console.log("🌍 Global handler showing context menu");
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          if (rect) {
            showContextMenu({
              text: selectedText,
              position: {
                x: e.clientX,
                y: e.clientY,
                width: rect.width,
                height: rect.height
              },
              pageNumber: currentPage
            });
          }
        } else {
          console.log("🌍 Global handler - no text selected, just preventing default menu");
        }
        return false;
      }
    };

    // Use capture phase to catch events early
    document.addEventListener('contextmenu', preventContextMenu, { capture: true, passive: false });
    
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu, true);
    };
  }, [documentUrl, currentPage]);

  // NUCLEAR OPTION: Complete context menu disable (as backup)
  useEffect(() => {
    // Only enable if needed - can be controlled by a flag
    const enableNuclearOption = false; // Set to true if default menu still appears
    
    if (!enableNuclearOption) return;
    
    // NUCLEAR OPTION: Disable ALL context menus when PDF is active
    const disableAllContextMenus = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("All context menus disabled (nuclear option)");
      return false;
    };

    // Add to capture phase to catch all context menu events
    document.addEventListener('contextmenu', disableAllContextMenus, true);
    
    return () => {
      document.removeEventListener('contextmenu', disableAllContextMenus, true);
    };
  }, []);

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
        console.log("🚀 INITIALIZING ADOBE PDF VIEWER (NOT SIMPLE VIEWER)");
        console.log("Adobe DC available:", !!window.AdobeDC);
        console.log("PDF URL:", documentUrl);
        console.log("Adobe Client ID:", clientId || process.env.VITE_ADOBE_CLIENT_ID);
        console.log("Container element:", viewerRef.current);
        
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
              console.log("Adobe DC SDK is ready");
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
          // Enhanced PDF preview configuration for better text selection
          embedMode: "SIZED_CONTAINER",
          showAnnotationTools: false,
          showLeftHandPanel: false,
          showDownloadPDF: false,
          showPrintPDF: false,
          showZoomControl: true,
          enableFormFillAPIs: false,
          enablePDFAnalytics: false,
          showPageControls: true,
          dockPageControls: false,
          enableTextSelection: true,
          enableSearchAPIs: true
        });

        // REGISTER ONLY SUPPORTED CALLBACKS
        adobeDCView.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.GET_USER_PROFILE_API,
          () => ({ userProfile: { name: "User", email: "user@example.com" } })
        );

        // REMOVED: The problematic TEXT_SELECTION callback that was causing the error
        // adobeDCView.registerCallback(
        //   window.AdobeDC.View.Enum.CallbackType.TEXT_SELECTION,
        //   handleTextSelection,
        //   { enableTextSelection: true }
        // );

        // Register event listeners for supported events only
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
              case "DOCUMENT_OPEN":
              case "APP_RENDERING_DONE":
                console.log("PDF document loaded successfully");
                setIsLoading(false);
                setIsReady(true);
                // Set up DOM-based text selection after PDF loads
                setupPdfTextSelection();
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
    <>
      {/* CSS to prevent default context menus and enable text selection */}
      <style>{`
        /* Force text selection and prevent default context menus */
        #adobe-dc-view {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          user-select: text !important;
          -webkit-context-menu: none !important;
          -moz-context-menu: none !important;
          context-menu: none !important;
        }

        #adobe-dc-view * {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          user-select: text !important;
          -webkit-context-menu: none !important;
          -moz-context-menu: none !important;
          context-menu: none !important;
        }

        /* Disable context menus on all PDF elements */
        #adobe-dc-view iframe,
        #adobe-dc-view iframe *,
        #adobe-dc-view canvas,
        #adobe-dc-view canvas *,
        #adobe-dc-view div,
        #adobe-dc-view div * {
          -webkit-context-menu: none !important;
          -moz-context-menu: none !important;
          context-menu: none !important;
          pointer-events: auto;
        }

        /* Ensure our custom context menu appears above everything */
        .fixed.z-50 {
          z-index: 999999 !important;
        }
      `}</style>
      
      <div className="relative h-full w-full flex flex-col">
        {/* Adobe Viewer Indicator */}
        <div className="absolute top-2 left-2 z-20 bg-blue-600 text-white text-xs px-2 py-1 rounded">
          Adobe PDF Viewer Active
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-primary" />
              <p className="text-sm text-text-secondary">Loading Adobe PDF Viewer...</p>
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
        onClose={() => setContextMenu({ visible: false, selectedText: '', position: null, pageNumber: 1, options: [] })}
      />

      {/* AI Popup */}
      <AiPopup
        aiPopup={aiPopup}
        onClose={() => setAiPopup({ visible: false, type: 'simplify', originalText: '', result: '', title: '' })}
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
    </>
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
    <div className="h-full flex flex-col bg-surface-elevated rounded-lg border border-border-subtle relative">
      {/* Simple Viewer Indicator */}
      <div className="absolute top-2 left-2 z-20 bg-orange-600 text-white text-xs px-2 py-1 rounded">
        Simple PDF Viewer Active
      </div>
      
      {/* Enhanced toolbar */}
      <div className="p-4 border-b border-border-subtle bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-text-primary">{documentName}</h3>
            <p className="text-sm text-text-secondary">
              Simple PDF viewer (fallback mode)
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

// New Hybrid PDF Viewer Component
export function HybridPDFViewer({
  documentUrl,
  documentName,
  onPageChange,
  onTextSelection,
  highlights = [],
  currentHighlightPage,
  goToSection,
  onHighlight
}: AdobePDFViewerProps) {
  const [viewerType, setViewerType] = useState<'react-pdf' | 'fallback' | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try React-PDF first
    setViewerType('react-pdf');
  }, []);

  const handleReactPDFError = (error: Error) => {
    console.log("React-PDF failed, falling back to iframe viewer:", error.message);
    setError(error.message);
    setViewerType('fallback');
  };

  if (viewerType === 'loading') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Initializing PDF viewer...</span>
      </div>
    );
  }

  if (viewerType === 'fallback') {
    return (
      <FallbackPDFViewer
        documentUrl={documentUrl}
        documentName={documentName}
        onPageChange={onPageChange}
        onTextSelection={onTextSelection}
        highlights={highlights}
        currentHighlightPage={currentHighlightPage}
        goToSection={goToSection}
        onHighlight={onHighlight}
      />
    );
  }

  return (
    <div className="relative h-full">
             <ReactPDFViewer
         documentUrl={documentUrl}
         documentName={documentName}
         onPageChange={onPageChange}
         onTextSelection={onTextSelection}
         highlights={highlights}
         currentHighlightPage={currentHighlightPage}
         goToSection={goToSection}
         onHighlight={onHighlight}
         onError={handleReactPDFError}
       />
      
      {/* Error boundary - if React-PDF fails, show fallback option */}
      {error && (
        <div className="absolute top-4 right-4 bg-yellow-900 border border-yellow-600 rounded-lg p-3 max-w-sm">
          <p className="text-yellow-100 text-sm mb-2">
            Advanced PDF viewer encountered an issue
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewerType('fallback')}
            className="text-yellow-100 border-yellow-600 hover:bg-yellow-800"
          >
            Use Fallback Viewer
          </Button>
        </div>
      )}
    </div>
  );
}