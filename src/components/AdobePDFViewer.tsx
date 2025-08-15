import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy } from 'lucide-react';
import { TextSelectionMenu } from './TextSelectionMenu';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
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
  onHighlightApplied?: (highlight: Highlight) => void;
}

// PDF Text Search and Highlighting Utilities
class PDFTextSearcher {
  private static instance: PDFTextSearcher;
  private searchCache = new Map<string, { text: string; page: number; elements: Element[] }>();
  
  static getInstance(): PDFTextSearcher {
    if (!PDFTextSearcher.instance) {
      PDFTextSearcher.instance = new PDFTextSearcher();
    }
    return PDFTextSearcher.instance;
  }

  // Find text in PDF content with fuzzy matching
  findTextInPDF(searchText: string, targetPage?: number): Array<{
    element: Element;
    textNode: Text;
    startOffset: number;
    endOffset: number;
    page: number;
    confidence: number;
  }> {
    const results: Array<{
      element: Element;
      textNode: Text;
      startOffset: number;
      endOffset: number;
      page: number;
      confidence: number;
    }> = [];

    if (!searchText || searchText.trim().length < 3) return results;

    const normalizedSearch = this.normalizeText(searchText);
    const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 2);
    
    // Get all text-containing elements in the PDF viewer
    const pdfContainer = document.querySelector('#adobe-dc-view, .pdf-content, iframe');
    if (!pdfContainer) return results;

    // Try to find text in Adobe PDF viewer content
    this.searchInContainer(pdfContainer, searchWords, normalizedSearch, targetPage, results);
    
    // Also try searching in any iframe content (fallback viewer)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          this.searchInContainer(iframeDoc.body, searchWords, normalizedSearch, targetPage, results);
        }
      } catch (e) {
        console.log('Cannot access iframe content (cross-origin)');
      }
    });

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private searchInContainer(
    container: Element | Document, 
    searchWords: string[], 
    fullSearchText: string,
    targetPage: number | undefined,
    results: Array<{
      element: Element;
      textNode: Text;
      startOffset: number;
      endOffset: number;
      page: number;
      confidence: number;
    }>
  ) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent || '';
          return text.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let currentNode: Text | null;
    while (currentNode = walker.nextNode() as Text) {
      const textContent = currentNode.textContent || '';
      const normalizedText = this.normalizeText(textContent);
      
      // Try exact match first
      let matchIndex = normalizedText.indexOf(fullSearchText);
      let matchLength = fullSearchText.length;
      let confidence = 1.0;

      if (matchIndex === -1) {
        // Try partial matching with words
        const partialMatch = this.findPartialMatch(normalizedText, searchWords);
        if (partialMatch) {
          matchIndex = partialMatch.index;
          matchLength = partialMatch.length;
          confidence = partialMatch.confidence;
        }
      }

      if (matchIndex !== -1) {
        const element = currentNode.parentElement;
        if (element) {
          const page = this.estimatePageNumber(element, targetPage);
          
          results.push({
            element,
            textNode: currentNode,
            startOffset: matchIndex,
            endOffset: matchIndex + matchLength,
            page,
            confidence
          });
        }
      }
    }
  }

  private findPartialMatch(text: string, searchWords: string[]): { index: number; length: number; confidence: number } | null {
    let bestMatch: { index: number; length: number; confidence: number } | null = null;
    
    // Try to find the longest sequence of matching words
    for (let i = 0; i < searchWords.length; i++) {
      const wordSequence = searchWords.slice(i, Math.min(i + 3, searchWords.length)).join(' ');
      const index = text.indexOf(wordSequence);
      
      if (index !== -1) {
        const confidence = wordSequence.length / searchWords.join(' ').length;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            index,
            length: wordSequence.length,
            confidence
          };
        }
      }
    }

    return bestMatch;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .trim();
  }

  private estimatePageNumber(element: Element, targetPage?: number): number {
    if (targetPage) return targetPage;
    
    // Try to find page indicators in the element or its parents
    let current: Element | null = element;
    while (current) {
      const pageAttr = current.getAttribute('data-page') || 
                      current.getAttribute('page') ||
                      current.className.match(/page-(\d+)/)?.[1];
      
      if (pageAttr) {
        return parseInt(pageAttr, 10);
      }
      
      current = current.parentElement;
    }
    
    // Fallback: estimate based on scroll position or element position
    const rect = element.getBoundingClientRect();
    const containerHeight = window.innerHeight;
    const estimatedPage = Math.max(1, Math.floor(rect.top / containerHeight) + 1);
    
    return estimatedPage;
  }

  // Apply visual highlight to found text
  applyHighlight(
    textNode: Text,
    startOffset: number,
    endOffset: number,
    highlight: Highlight,
    onHighlightApplied?: (highlight: Highlight) => void
  ): HTMLElement | null {
    try {
      const range = document.createRange();
      range.setStart(textNode, startOffset);
      range.setEnd(textNode, endOffset);

      const highlightElement = document.createElement('mark');
      highlightElement.id = `highlight-${highlight.id}`;
      highlightElement.className = `pdf-highlight pdf-highlight-${highlight.color}`;
      
      // Set colors based on highlight type
      const colorMap = {
        'primary': { bg: 'rgba(255, 235, 59, 0.6)', border: '#FBC02D' },
        'secondary': { bg: 'rgba(76, 175, 80, 0.6)', border: '#388E3C' },
        'tertiary': { bg: 'rgba(33, 150, 243, 0.6)', border: '#1976D2' }
      };
      
      const colors = colorMap[highlight.color] || colorMap.primary;
      
      highlightElement.style.cssText = `
        background-color: ${colors.bg};
        border-bottom: 2px solid ${colors.border};
        border-radius: 2px;
        padding: 1px 0;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      `;

      // Add hover effects
      highlightElement.addEventListener('mouseenter', () => {
        highlightElement.style.backgroundColor = colors.bg.replace('0.6', '0.8');
        highlightElement.style.transform = 'scale(1.02)';
      });

      highlightElement.addEventListener('mouseleave', () => {
        highlightElement.style.backgroundColor = colors.bg;
        highlightElement.style.transform = 'scale(1)';
      });

      // Add click handler
      highlightElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showHighlightTooltip(highlightElement, highlight);
      });

      // Add tooltip
      highlightElement.title = `${highlight.explanation}\nRelevance: ${Math.round(highlight.relevanceScore * 100)}%`;

      // Surround the range with the highlight element
      try {
        range.surroundContents(highlightElement);
      } catch (e) {
        // If we can't surround contents, extract and wrap
        const contents = range.extractContents();
        highlightElement.appendChild(contents);
        range.insertNode(highlightElement);
      }

      // Animate the highlight
      highlightElement.style.animation = 'highlightFadeIn 1s ease-out';

      if (onHighlightApplied) {
        onHighlightApplied(highlight);
      }

      return highlightElement;
    } catch (error) {
      console.error('Failed to apply highlight:', error);
      return null;
    }
  }

  private showHighlightTooltip(element: HTMLElement, highlight: Highlight) {
    // Remove existing tooltips
    document.querySelectorAll('.highlight-tooltip').forEach(tooltip => tooltip.remove());

    const tooltip = document.createElement('div');
    tooltip.className = 'highlight-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      max-width: 300px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.3s ease-out;
    `;

    tooltip.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; color: #FFC107;">
        Page ${highlight.page} • ${Math.round(highlight.relevanceScore * 100)}% Relevant
      </div>
      <div style="margin-bottom: 8px;">
        "${highlight.text.substring(0, 100)}${highlight.text.length > 100 ? '...' : ''}"
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        ${highlight.explanation}
      </div>
    `;

    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 8}px`;

    document.body.appendChild(tooltip);

    // Auto-remove tooltip after 5 seconds
    setTimeout(() => {
      tooltip.style.animation = 'fadeOut 0.3s ease-in forwards';
      setTimeout(() => tooltip.remove(), 300);
    }, 5000);

    // Remove on click elsewhere
    const removeTooltip = (e: Event) => {
      if (!tooltip.contains(e.target as Node)) {
        tooltip.remove();
        document.removeEventListener('click', removeTooltip);
      }
    };
    setTimeout(() => document.addEventListener('click', removeTooltip), 100);
  }

  // Remove all highlights
  clearAllHighlights() {
    document.querySelectorAll('.pdf-highlight').forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        parent.normalize();
      }
    });
  }

  // Remove specific highlight
  removeHighlight(highlightId: string) {
    const highlightElement = document.getElementById(`highlight-${highlightId}`);
    if (highlightElement) {
      const parent = highlightElement.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlightElement.textContent || ''), highlightElement);
        parent.normalize();
      }
    }
  }
}

export function AdobePDFViewer({ 
  documentUrl, 
  documentName, 
  onPageChange, 
  onTextSelection,
  clientId,
  highlights = [],
  onHighlightApplied
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
  const textSearcher = PDFTextSearcher.getInstance();
  const [appliedHighlights, setAppliedHighlights] = useState<Set<string>>(new Set());

  // Apply highlights when they change or when PDF is ready
  useEffect(() => {
    if (!isReady || !highlights.length) return;

    // Wait a bit for PDF content to be fully rendered
    const timer = setTimeout(() => {
      applyHighlightsToContent();
    }, 1500);

    return () => clearTimeout(timer);
  }, [highlights, isReady, currentPage]);

  // Function to apply all highlights to the current PDF content
  const applyHighlightsToContent = async () => {
    console.log('Applying highlights to PDF content:', highlights.length);
    
    for (const highlight of highlights) {
      // Skip if already applied
      if (appliedHighlights.has(highlight.id)) continue;
      
      try {
        // Find text in the PDF
        const searchResults = textSearcher.findTextInPDF(highlight.text, highlight.page);
        console.log(`Found ${searchResults.length} matches for highlight:`, highlight.text.substring(0, 50));
        
        if (searchResults.length > 0) {
          // Apply highlight to the best match
          const bestMatch = searchResults[0];
          const highlightElement = textSearcher.applyHighlight(
            bestMatch.textNode,
            bestMatch.startOffset,
            bestMatch.endOffset,
            highlight,
            onHighlightApplied
          );
          
          if (highlightElement) {
            setAppliedHighlights(prev => new Set([...prev, highlight.id]));
            console.log('Successfully applied highlight:', highlight.id);
          }
        } else {
          console.log('No text found for highlight:', highlight.text.substring(0, 50));
        }
      } catch (error) {
        console.error('Error applying highlight:', error);
      }
      
      // Small delay between highlights to prevent overwhelming the DOM
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // Function to highlight specific text (called from HighlightPanel)
  const highlightSpecificText = (highlight: Highlight) => {
    console.log('Highlighting specific text:', highlight.text.substring(0, 50));
    
    // First navigate to the page if needed
    if (currentPage !== highlight.page) {
      setCurrentPage(highlight.page);
      if (onPageChange) {
        onPageChange(highlight.page);
      }
    }
    
    // Apply highlight after a short delay to ensure page navigation
    setTimeout(() => {
      const searchResults = textSearcher.findTextInPDF(highlight.text, highlight.page);
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        const highlightElement = textSearcher.applyHighlight(
          bestMatch.textNode,
          bestMatch.startOffset,
          bestMatch.endOffset,
          highlight,
          onHighlightApplied
        );
        
        if (highlightElement) {
          // Scroll to the highlight
          highlightElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Flash the highlight
          highlightElement.style.animation = 'highlightFlash 2s ease-in-out';
          
          toast({
            title: "Highlight Found",
            description: `Navigated to highlight on page ${highlight.page}`,
          });
        }
      } else {
        toast({
          title: "Text Not Found",
          description: "Could not locate the highlighted text in the current page",
          variant: "destructive"
        });
      }
    }, 500);
  };

  // Expose highlight function to parent component
  useEffect(() => {
    if (window) {
      (window as any).highlightTextInPDF = highlightSpecificText;
    }
    
    return () => {
      if (window) {
        delete (window as any).highlightTextInPDF;
      }
    };
  }, []);

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

      {/* CSS Animations for Highlights */}
      <style>{`
        @keyframes highlightFadeIn {
          0% { 
            opacity: 0; 
            transform: scale(0.95); 
            background-color: rgba(255, 193, 7, 0.9);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.05); 
            background-color: rgba(255, 193, 7, 0.8);
          }
          100% { 
            opacity: 1; 
            transform: scale(1); 
          }
        }

        @keyframes highlightFlash {
          0%, 100% { opacity: 1; }
          25% { opacity: 0.3; background-color: rgba(255, 193, 7, 0.9); }
          50% { opacity: 1; background-color: rgba(255, 193, 7, 0.7); }
          75% { opacity: 0.3; background-color: rgba(255, 193, 7, 0.9); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }

        .pdf-highlight {
          position: relative;
          z-index: 10;
        }

        .pdf-highlight::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .pdf-highlight:hover::before {
          opacity: 1;
          box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.5);
        }
      `}</style>
    </div>
  );
}

// Fallback PDF viewer for when Adobe API is not available
export function FallbackPDFViewer({ 
  documentUrl, 
  documentName, 
  highlights = [],
  onHighlightApplied 
}: { 
  documentUrl: string; 
  documentName: string;
  highlights?: Highlight[];
  onHighlightApplied?: (highlight: Highlight) => void;
}) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const { toast } = useToast();
  
  // Handle text selection in fallback viewer
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      
      // For fallback viewer, show a simple copy option
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const text = selection.toString();
        setSelectedText(text);
        setSelectionPosition({
          x: e.clientX,
          y: e.clientY
        });
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    toast({
      title: "Copied",
      description: "Text copied to clipboard"
    });
    setSelectedText('');
    setSelectionPosition(null);
  };
  
  return (
    <div className="h-full flex flex-col bg-surface-elevated rounded-lg border border-border-subtle">
      <div className="p-4 border-b border-border-subtle">
        <h3 className="font-medium text-text-primary">{documentName}</h3>
        <p className="text-sm text-text-secondary">Fallback PDF viewer - Limited features available</p>
      </div>
      
      <div className="flex-1 p-4 relative">
        <iframe
          src={`${documentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-full border-0 rounded"
          title={documentName}
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
        
        {/* Simple context menu for fallback viewer */}
        {selectionPosition && selectedText && (
          <div
            className="fixed z-50 bg-white shadow-lg rounded-md p-2 border border-gray-200"
            style={{
              left: `${selectionPosition.x}px`,
              top: `${selectionPosition.y}px`
            }}
          >
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
            >
              <Copy className="h-4 w-4" />
              Copy text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}