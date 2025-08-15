import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DocumentOutline } from './DocumentOutline';
import { FloatingTools } from './FloatingTools';
import { AdobePDFViewer, FallbackPDFViewer } from './AdobePDFViewer';
import { CrossConnectionsPanel } from './CrossConnectionsPanel';
import { StrategicInsightsPanel } from './StrategicInsightsPanel';
import { InsightsPanel } from './InsightsPanel';

// Hybrid PDF Viewer component that tries Adobe first, then falls back to iframe
function HybridPDFViewer({ 
  documentUrl, 
  documentName, 
  onPageChange, 
  onTextSelection, 
  clientId 
}: {
  documentUrl: string;
  documentName: string;
  onPageChange?: (page: number) => void;
  onTextSelection?: (text: string, page: number) => void;
  clientId?: string;
}) {
  const [useAdobeViewer, setUseAdobeViewer] = useState(true);
  const [adobeFailed, setAdobeFailed] = useState(false);

  const handleAdobeError = () => {
    console.log("Adobe PDF viewer failed, falling back to iframe viewer");
    setAdobeFailed(true);
    setUseAdobeViewer(false);
  };

  if (!useAdobeViewer || adobeFailed) {
    return <FallbackPDFViewer documentUrl={documentUrl} documentName={documentName} />;
  }

  return (
    <div className="h-full relative">
      <AdobePDFViewer
        documentUrl={documentUrl}
        documentName={documentName}
        onPageChange={onPageChange}
        onTextSelection={onTextSelection}
        clientId={clientId}
      />
      {/* Fallback button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseAdobeViewer(false)}
          className="bg-background/90 backdrop-blur-sm"
        >
          Use Simple Viewer
        </Button>
      </div>
    </div>
  );
}

import { ThemeToggle } from './ThemeToggle';
import { AccessibilityPanel } from './AccessibilityPanel';
import { PodcastPanel } from './PodcastPanel';
import { HighlightPanel } from './HighlightPanel';
import { TextSimplifier } from './TextSimplifier';
import { CopyDownloadPanel } from './CopyDownloadPanel';
import { ReadingAnalyticsPanel } from './ReadingAnalyticsPanel';
import { SmartBookmarksPanel } from './SmartBookmarksPanel';
import { apiService, RelatedSection } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Menu, 
  Upload, 
  BookOpen, 
  Settings,
  Palette,
  Link,
  Brain,
  Highlighter,
  Download,
  BarChart3,
  Bookmark
} from 'lucide-react';

export interface PDFDocument {
  id: string;
  name: string;
  url: string;
  outline: OutlineItem[];
}

export interface OutlineItem {
  id: string;
  title: string;
  level: number;
  page: number;
  children?: OutlineItem[];
}

export interface Highlight {
  id: string;
  text: string;
  page: number;
  color: 'primary' | 'secondary' | 'tertiary';
  relevanceScore: number;
  explanation: string;
}

interface PDFReaderProps {
  documents?: PDFDocument[];
  persona?: string;
  jobToBeDone?: string;
  onBack?: () => void;
}

export function PDFReader({ documents, persona, jobToBeDone, onBack }: PDFReaderProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(320); // Made resizable
  const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeRightPanel, setActiveRightPanel] = useState<'insights' | 'podcast' | 'accessibility' | 'simplifier' | 'export' | 'highlights' | 'analytics' | 'bookmarks' | null>('insights');
  const [selectedText, setSelectedText] = useState<string>('');
  const [currentInsights, setCurrentInsights] = useState<Array<{ type: string; content: string }>>([]);
  const [relatedSections, setRelatedSections] = useState<RelatedSection[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<number>(Date.now());
  const [isActivelyReading, setIsActivelyReading] = useState(true);
  const [totalPages, setTotalPages] = useState(30); // Will be updated from PDF
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Sidebar resize functionality
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.max(280, Math.min(600, e.clientX));
    setLeftSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  // Initialize with first document from props or mock document
  useEffect(() => {
    if (documents && documents.length > 0 && !currentDocument) {
      setCurrentDocument(documents[0]);
      
      // Automatically generate intelligence highlights if persona and job are set
      if (persona && jobToBeDone) {
        setTimeout(() => {
          generateIntelligenceHighlights();
        }, 1000); // Small delay to ensure everything is loaded
      } else {
        // Add some sample highlights to demonstrate the feature
        const sampleHighlights: Highlight[] = [
          {
            id: 'sample-1',
            text: 'This is an important concept that relates to the main topic of the document.',
            page: 1,
            color: 'primary',
            relevanceScore: 0.95,
            explanation: 'Key concept relevant to your analysis'
          },
          {
            id: 'sample-2', 
            text: 'Supporting evidence and data that reinforces the primary arguments.',
            page: 2,
            color: 'secondary',
            relevanceScore: 0.87,
            explanation: 'Supporting evidence for main thesis'
          },
          {
            id: 'sample-3',
            text: 'Critical analysis point that requires further consideration.',
            page: 3,
            color: 'tertiary',
            relevanceScore: 0.82,
            explanation: 'Requires deeper analysis for your job role'
          }
        ];
        
        setHighlights(sampleHighlights);
      }
    }
  }, [documents, currentDocument, persona, jobToBeDone]);

  // Load related sections when page or document changes
  useEffect(() => {
    if (currentDocument && persona && jobToBeDone) {
      loadRelatedSections();
    }
  }, [currentDocument, currentPage, persona, jobToBeDone]);

  const loadRelatedSections = async () => {
    if (!currentDocument || !persona || !jobToBeDone) return;
    
    setIsLoadingRelated(true);
    try {
      const documentIds = documents ? documents.map(d => d.id) : [currentDocument.id];
      const currentSection = getCurrentSectionTitle();
      
      const related = await apiService.getRelatedSections(
        documentIds,
        currentPage,
        currentSection,
        persona,
        jobToBeDone
      );
      
      setRelatedSections(related);
      
      // Convert to highlights for display - only if we have real data
      if (related && related.length > 0) {
        const newHighlights: Highlight[] = related.slice(0, 5).map((section, index) => ({
          id: `related-${section.page_number}-${index}`,
          text: section.section_title,
          page: section.page_number,
          color: ['primary', 'secondary', 'tertiary'][index % 3] as 'primary' | 'secondary' | 'tertiary',
          relevanceScore: section.relevance_score,
          explanation: section.explanation
        }));
        
        // Add to existing highlights instead of replacing them
        setHighlights(prev => {
          const existingIds = new Set(prev.filter(h => !h.id.startsWith('related-')).map(h => h.id));
          const filteredPrev = prev.filter(h => !h.id.startsWith('related-'));
          return [...filteredPrev, ...newHighlights];
        });
        
        toast({
          title: "Related Sections Found",
          description: `Found ${related.length} related sections for the current page.`,
        });
      } else {
        // Clear only related highlights if no related sections found
        setHighlights(prev => prev.filter(h => !h.id.startsWith('related-')));
      }
      
    } catch (error) {
      console.error('Failed to load related sections:', error);
      toast({
        title: "Failed to load related content",
        description: "Unable to find related sections. Please try again.",
        variant: "destructive"
      });
      // Clear only related highlights on error
      setHighlights(prev => prev.filter(h => !h.id.startsWith('related-')));
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const getCurrentSectionTitle = (): string => {
    if (!currentDocument) return "";
    
    // Find the section title for the current page
    const currentOutlineItem = currentDocument.outline
      .filter(item => item.page <= currentPage)
      .sort((a, b) => b.page - a.page)[0];
    
    return currentOutlineItem?.title || "";
  };

  const generateInsightsForText = async (text: string) => {
    if (!persona || !jobToBeDone) return;
    
    try {
      const insights = await apiService.generateInsights(
        text,
        persona,
        jobToBeDone,
        currentDocument?.id
      );
      
      setCurrentInsights(insights.map(insight => ({
        type: insight.type,
        content: insight.content
      })));
      
    } catch (error) {
      console.error('Failed to generate insights for selected text:', error);
    }
  };

  // Function to apply visual highlights to PDF content
  const applyHighlightToPDF = (highlight: Highlight) => {
    try {
      // Find the PDF viewer container
      const pdfContainer = document.querySelector('.adobe-dc-view, iframe, .pdf-viewer-container, #adobe-pdf-viewer');
      if (!pdfContainer) {
        console.log('PDF container not found for highlighting');
        return;
      }

      // Create a highlight overlay container if it doesn't exist
      let overlayContainer = document.getElementById('pdf-highlight-overlay-container');
      if (!overlayContainer) {
        overlayContainer = document.createElement('div');
        overlayContainer.id = 'pdf-highlight-overlay-container';
        overlayContainer.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 100;
        `;
        
        // If it's an iframe, create overlay next to it
        if (pdfContainer.tagName === 'IFRAME') {
          const parent = pdfContainer.parentElement;
          if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(overlayContainer);
          }
        } else {
          pdfContainer.appendChild(overlayContainer);
        }
      }

      // Create a highlight indicator
      const highlightId = `highlight-overlay-${highlight.id}`;
      
      // Remove existing highlight overlay if it exists
      const existingHighlight = document.getElementById(highlightId);
      if (existingHighlight) {
        existingHighlight.remove();
      }

      // Create a visual highlight indicator
      const highlightOverlay = document.createElement('div');
      highlightOverlay.id = highlightId;
      highlightOverlay.className = 'pdf-highlight-overlay';
      
      // Improved positioning calculation
      const containerRect = pdfContainer.getBoundingClientRect();
      const pageHeight = containerRect.height;
      const pageWidth = containerRect.width;
      
      // Better page positioning - account for PDF margins and actual content area
      const pagesPerView = Math.max(1, Math.floor(pageHeight / 800)); // Assume ~800px per page
      const effectivePageHeight = pageHeight / pagesPerView;
      const pageIndex = Math.max(0, highlight.page - 1);
      const estimatedTop = (pageIndex * effectivePageHeight) + (effectivePageHeight * 0.2); // Start 20% down the page
      
      // Improved color system with better contrast and visibility
      const colorMap = {
        'primary': {
          bg: 'rgba(255, 235, 59, 0.3)',
          border: '#FFC107',
          shadow: 'rgba(255, 193, 7, 0.4)'
        },
        'secondary': {
          bg: 'rgba(76, 175, 80, 0.3)',
          border: '#4CAF50',
          shadow: 'rgba(76, 175, 80, 0.4)'
        },
        'tertiary': {
          bg: 'rgba(33, 150, 243, 0.3)',
          border: '#2196F3',
          shadow: 'rgba(33, 150, 243, 0.4)'
        }
      };
      
      const colors = colorMap[highlight.color] || colorMap.primary;
      
      // Dynamic sizing based on text length and relevance
      const textLength = highlight.text.length;
      const minHeight = 24;
      const maxHeight = 60;
      const baseHeight = Math.min(maxHeight, Math.max(minHeight, textLength * 0.3));
      const finalHeight = baseHeight * (0.8 + highlight.relevanceScore * 0.4); // Scale by relevance
      
      // Better width calculation - responsive to content
      const minWidth = Math.min(pageWidth * 0.3, 200);
      const maxWidth = Math.min(pageWidth * 0.8, 600);
      const textBasedWidth = Math.min(maxWidth, Math.max(minWidth, textLength * 8));
      
      highlightOverlay.style.cssText = `
        position: absolute;
        left: ${pageWidth * 0.1}px;
        width: ${textBasedWidth}px;
        top: ${estimatedTop}px;
        height: ${finalHeight}px;
        background: linear-gradient(135deg, ${colors.bg}, ${colors.bg.replace('0.3', '0.2')});
        border: 2px solid ${colors.border};
        border-radius: 6px;
        pointer-events: auto;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: highlightAppear 0.8s ease-out;
        backdrop-filter: blur(1px);
        box-shadow: 0 2px 8px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.2);
      `;

      // Enhanced hover effects
      highlightOverlay.onmouseenter = () => {
        highlightOverlay.style.transform = 'translateY(-2px) scale(1.02)';
        highlightOverlay.style.boxShadow = `0 6px 20px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`;
        highlightOverlay.style.borderWidth = '3px';
      };
      
      highlightOverlay.onmouseleave = () => {
        highlightOverlay.style.transform = 'translateY(0) scale(1)';
        highlightOverlay.style.boxShadow = `0 2px 8px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`;
        highlightOverlay.style.borderWidth = '2px';
      };

      // Add click handler to show highlight details
      highlightOverlay.onclick = () => {
        toast({
          title: "Highlight Details",
          description: `${highlight.explanation}\n\nText: "${highlight.text.substring(0, 100)}..."`,
        });
      };

      // Add tooltip with better formatting
      highlightOverlay.title = `${highlight.explanation}\nRelevance: ${Math.round(highlight.relevanceScore * 100)}%\nPage: ${highlight.page}`;

      overlayContainer.appendChild(highlightOverlay);

      // Improved floating notification
      const floatingIndicator = document.createElement('div');
      floatingIndicator.className = 'pdf-highlight-indicator';
      floatingIndicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${colors.border}, ${colors.border}dd);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
        z-index: 1000;
        font-size: 14px;
        font-weight: 500;
        animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 350px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
      `;
      floatingIndicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 10px; height: 10px; background: rgba(255,255,255,0.9); border-radius: 50%; animation: pulse 2s infinite;"></div>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px;">Highlight Added</div>
            <div style="font-size: 13px; opacity: 0.95; line-height: 1.4;">
              Page ${highlight.page} • ${Math.round(highlight.relevanceScore * 100)}% relevance<br>
              "${highlight.text.substring(0, 80)}${highlight.text.length > 80 ? '...' : ''}"
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(floatingIndicator);

      // Remove floating indicator after 5 seconds
      setTimeout(() => {
        floatingIndicator.style.animation = 'slideOutRight 0.4s cubic-bezier(0.4, 0, 1, 1) forwards';
        setTimeout(() => floatingIndicator.remove(), 400);
      }, 5000);

      // Add improved CSS animations if not already present
      if (!document.getElementById('highlight-animations')) {
        const style = document.createElement('style');
        style.id = 'highlight-animations';
        style.textContent = `
          @keyframes highlightAppear {
            0% { opacity: 0; transform: scale(0.8) translateY(10px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes fadeOut {
            to { opacity: 0; transform: scale(0.95); }
          }
          @keyframes slideInRight {
            from { transform: translateX(120%) scale(0.9); opacity: 0; }
            to { transform: translateX(0) scale(1); opacity: 1; }
          }
          @keyframes slideOutRight {
            to { transform: translateX(120%) scale(0.9); opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.9; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
          }
        `;
        document.head.appendChild(style);
      }

    } catch (error) {
      console.error('Failed to apply highlight to PDF:', error);
      // Show fallback notification
      toast({
        title: "Highlight Added",
        description: `Added highlight on page ${highlight.page}: "${highlight.text.substring(0, 50)}..."`,
      });
    }
  };

  const handleOutlineClick = (item: OutlineItem) => {
    setCurrentPage(item.page);
  };

  const handleHighlight = (highlight: Highlight) => {
    setHighlights(prev => [...prev, highlight]);
  };

  // Create highlight from selected text
  const createHighlightFromSelection = (text: string, page: number, color: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
    if (!text || text.trim().length < 10) return; // Minimum text length

    const highlight: Highlight = {
      id: `user-highlight-${Date.now()}`,
      text: text.trim(),
      page,
      color,
      relevanceScore: 0.9, // User-created highlights are highly relevant
      explanation: 'User highlighted text'
    };

    setHighlights(prev => [...prev, highlight]);
    
    toast({
      title: "Text selected and highlighted",
      description: `Added highlight on page ${page}. AI insights will be generated automatically.`,
    });
  };

  // Enhanced text selection handler
  const handleTextSelection = async (text: string, page: number) => {
    console.log('Text selected:', text, 'on page:', page);
    setSelectedText(text);
    setCurrentPage(page);
    
    // Create highlight from selection if text is long enough
    if (text.length >= 10) {
      createHighlightFromSelection(text, page);
    }
    
    // Automatically generate insights for selected text if conditions are met
    if (text.length > 50 && persona && jobToBeDone) {
      try {
        await generateInsightsForText(text);
        
        // Show success message
        toast({
          title: "AI Insights Generated",
          description: `Generated insights for selected text. Check the Insights panel.`,
        });
      } catch (error) {
        console.error('Failed to generate insights:', error);
        toast({
          title: "Insights Generation Failed",
          description: "Unable to generate insights for selected text.",
          variant: "destructive"
        });
      }
    } else if (text.length > 50) {
      toast({
        title: "Text Selected",
        description: "Set your persona and goals in the Insights panel to generate AI insights.",
        variant: "default"
      });
    }
  };

  // Auto-generate highlights from document intelligence analysis
  const generateIntelligenceHighlights = async () => {
    if (!documents || !persona || !jobToBeDone) return;
    
    try {
      // Get document IDs for analysis
      const documentIds = documents.map(d => d.id);
      
      // Call the document intelligence analysis
      const analysisResult = await apiService.analyzeDocuments(documentIds, persona, jobToBeDone);
      
      if (analysisResult && analysisResult.extracted_sections) {
        const intelligenceHighlights: Highlight[] = [];
        
        // Create highlights from extracted sections
        analysisResult.extracted_sections.forEach((section: any, index: number) => {
          const highlight: Highlight = {
            id: `intelligence-section-${index}`,
            text: `${section.section_title} - Key section identified by AI analysis`,
            page: section.page_number,
            color: section.importance_rank <= 3 ? 'primary' : 
                   section.importance_rank <= 7 ? 'secondary' : 'tertiary',
            relevanceScore: section.relevance_score,
            explanation: `Rank #${section.importance_rank} - Highly relevant section for ${persona} working on ${jobToBeDone}`
          };
          intelligenceHighlights.push(highlight);
        });
        
        // Create highlights from subsection analysis
        if (analysisResult.subsection_analysis) {
          analysisResult.subsection_analysis.forEach((subsection: any, index: number) => {
            const highlight: Highlight = {
              id: `intelligence-subsection-${index}`,
              text: subsection.refined_text || 'Key insight from document analysis',
              page: subsection.page_number,
              color: 'secondary',
              relevanceScore: 0.85, // High relevance for refined text
              explanation: `AI-identified key insight from ${subsection.document}`
            };
            intelligenceHighlights.push(highlight);
          });
        }
        
        // Add to existing highlights, removing duplicates
        setHighlights(prev => {
          const existingIds = new Set(prev.map(h => h.id));
          const newHighlights = intelligenceHighlights.filter(h => !existingIds.has(h.id));
          return [...prev, ...newHighlights];
        });
        
        // Apply visual highlights to the PDF for each new highlight
        intelligenceHighlights.forEach((highlight, index) => {
          setTimeout(() => {
            applyHighlightToPDF(highlight);
          }, index * 200); // Stagger the highlights for better visual effect
        });
        
        toast({
          title: "AI Analysis Complete",
          description: `Generated ${intelligenceHighlights.length} intelligent highlights based on document analysis.`,
        });
      }
    } catch (error) {
      console.error('Failed to generate intelligence highlights:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze documents for intelligent highlighting.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border-subtle bg-surface-elevated/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-6">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-2 hover:bg-surface-hover"
              >
                ←
                Back
              </Button>
            )}
            
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">DocuSense</h1>
                {persona && (
                  <p className="text-sm text-text-secondary font-medium">
                    {persona} • {jobToBeDone}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="gap-2 hover:bg-surface-hover"
              aria-label="Toggle outline"
            >
              <Menu className="h-4 w-4" />
              Outline
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={generateIntelligenceHighlights}
              disabled={!documents || !persona || !jobToBeDone}
              className="gap-2 hover:bg-surface-hover"
              aria-label="Generate AI highlights"
            >
              <Highlighter className="h-4 w-4" />
              AI Highlights
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (currentDocument) {
                  try {
                    const blob = await apiService.downloadHighlightedPDF(currentDocument.name);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `highlighted_${currentDocument.name}`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast({
                      title: "Download Started",
                      description: "Your highlighted PDF is being downloaded"
                    });
                  } catch (error) {
                    toast({
                      title: "Download Failed", 
                      description: "Failed to download highlighted PDF",
                      variant: "destructive"
                    });
                  }
                }
              }}
              disabled={!currentDocument || highlights.length === 0}
              className="gap-2 hover:bg-surface-hover"
              aria-label="Download highlighted PDF"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="gap-2 hover:bg-surface-hover"
              aria-label="Toggle tools panel"
            >
              <Settings className="h-4 w-4" />
              Tools
            </Button>
            
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Outline & Navigation */}
        {leftSidebarOpen && (
          <aside 
            className="bg-surface-elevated/50 border-r border-border-subtle flex flex-col animate-fade-in backdrop-blur-sm relative min-w-0"
            style={{ width: `${leftSidebarWidth}px`, maxWidth: `${leftSidebarWidth}px` }}
          >
            <div className="flex-1 overflow-hidden flex flex-col min-w-0">
              {/* Document Outline */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <DocumentOutline
                  documents={documents}
                  currentDocument={currentDocument}
                  currentPage={currentPage}
                  onItemClick={handleOutlineClick}
                  onDocumentSwitch={setCurrentDocument}
                />
              </div>
            </div>
            
            {/* Resize Handle */}
            <div 
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-border-subtle transition-colors"
              onMouseDown={handleMouseDown}
              title="Drag to resize sidebar"
            />
          </aside>
        )}

        {/* Main PDF Viewer */}
        <main className="flex-1 relative">
          {currentDocument ? (
            <HybridPDFViewer
              documentUrl={currentDocument.url}
              documentName={currentDocument.name}
              onPageChange={setCurrentPage}
              onTextSelection={handleTextSelection}
              clientId={import.meta.env.VITE_ADOBE_CLIENT_ID}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <BookOpen className="h-16 w-16 text-text-tertiary mx-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-text-primary mb-2">
                    No PDF loaded
                  </h2>
                  <p className="text-text-secondary">
                    Upload a PDF file to get started with intelligent reading
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Floating Tools */}
          <FloatingTools
            currentDocument={currentDocument}
            currentPage={currentPage}
            onHighlight={handleHighlight}
          />
        </main>

        {/* Right Panel - Interactive Utilities */}
        {rightPanelOpen && (
          <aside className="w-96 max-w-96 min-w-0 bg-surface-elevated/50 border-l border-border-subtle flex flex-col animate-fade-in backdrop-blur-sm overflow-hidden">
            <div className="p-5 border-b border-border-subtle min-w-0">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'insights', label: 'Insights', icon: BookOpen },
                  { key: 'strategic', label: 'Strategic', icon: Brain },
                  { key: 'connections', label: 'Connections', icon: Link },
                  { key: 'podcast', label: 'Podcast', icon: Settings },
                  { key: 'accessibility', label: 'Access', icon: Palette },
                  { key: 'simplifier', label: 'Simplify', icon: Upload },
                  { key: 'export', label: 'Export', icon: Upload },
                  { key: 'highlights', label: 'Highlights', icon: Highlighter },
                  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark }
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={activeRightPanel === key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveRightPanel(activeRightPanel === key ? null : key as any)}
                    className="gap-2 h-10 justify-start"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden min-w-0">
              {activeRightPanel === 'insights' && (
                <div className="min-w-0 overflow-hidden h-full">
                  <InsightsPanel 
                    documentIds={documents?.map(d => d.id) || []}
                    documentId={currentDocument?.id}
                    persona={persona}
                    jobToBeDone={jobToBeDone}
                    currentText={selectedText || getCurrentSectionTitle()}
                    onPageNavigate={setCurrentPage}
                  />
                </div>
              )}
              
              {activeRightPanel === 'strategic' && (
                <div className="min-w-0 overflow-hidden h-full">
                  <StrategicInsightsPanel 
                    documentId={currentDocument?.id}
                    persona={persona}
                    jobToBeDone={jobToBeDone}
                    currentText={selectedText || getCurrentSectionTitle()}
                    currentPage={currentPage}
                    onPageNavigate={setCurrentPage}
                  />
                </div>
              )}
              
              {activeRightPanel === 'connections' && currentDocument && (
                <div className="min-w-0 overflow-hidden h-full">
                  <div className="p-4 overflow-y-auto h-full">
                    <CrossConnectionsPanel 
                      documentId={currentDocument.id}
                      onNavigateToDocument={(docId) => {
                        // Find the document by ID and switch to it
                        const targetDocument = documents.find(doc => doc.id === docId);
                        if (targetDocument) {
                          setCurrentDocument(targetDocument);
                          setCurrentPage(1); // Start at the first page
                          toast({
                            title: "Document Switched",
                            description: `Now viewing: ${targetDocument.title}`,
                          });
                        } else {
                          toast({
                            title: "Document Not Found",
                            description: "The referenced document is not available in the current session.",
                            variant: "destructive"
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              {activeRightPanel === 'podcast' && (
                <div className="min-w-0 overflow-hidden h-full">
                  <PodcastPanel 
                    documentId={currentDocument?.id}
                    currentPage={currentPage}
                    currentText={selectedText || getCurrentSectionTitle()}
                    relatedSections={relatedSections.map(r => r.section_title)}
                    insights={currentInsights.map(i => i.content)}
                  />
                </div>
              )}
              
              {activeRightPanel === 'accessibility' && (
                <div className="min-w-0 overflow-hidden h-full">
                  <AccessibilityPanel 
                    currentText={selectedText || getCurrentSectionTitle()}
                    onFontSizeChange={(size) => {
                      // Handle font size changes
                      console.log('Font size changed to:', size);
                    }}
                    onDyslexiaModeChange={(enabled) => {
                      // Handle dyslexia mode changes
                      console.log('Dyslexia mode:', enabled);
                    }}
                    onColorBlindModeChange={(enabled) => {
                      // Handle color blind mode changes
                      console.log('Color blind mode:', enabled);
                    }}
                    onLanguageChange={(language) => {
                      setCurrentLanguage(language);
                      // Here you could add logic to translate content or change UI language
                      console.log('Language changed to:', language);
                    }}
                  />
                </div>
              )}
              
              {activeRightPanel === 'simplifier' && (
                <div className="min-w-0 overflow-hidden h-full">
                  <TextSimplifier 
                    originalText={selectedText || getCurrentSectionTitle()}
                    onSimplifiedText={(text) => console.log('Simplified:', text)}
                  />
                </div>
              )}

              {activeRightPanel === 'export' && (
                <div className="min-w-0 overflow-hidden h-full">
                  <CopyDownloadPanel
                    selectedText={selectedText}
                    currentSection={getCurrentSectionTitle()}
                    documentTitle={currentDocument?.name}
                    insights={currentInsights}
                    relatedSections={relatedSections.map(r => ({
                      section_title: r.section_title,
                      explanation: r.explanation
                    }))}
                  />
                </div>
              )}

              {activeRightPanel === 'highlights' && (
                <div className="min-w-0 overflow-hidden h-full">
                  <HighlightPanel 
                    highlights={highlights}
                    onHighlightClick={(highlight) => {
                      setCurrentPage(highlight.page);
                      // Apply visual highlight to PDF
                      setTimeout(() => {
                        applyHighlightToPDF(highlight);
                      }, 500); // Small delay to ensure page navigation completes
                      toast({
                        title: "Navigated to Highlight",
                        description: `Page ${highlight.page}: ${highlight.text.substring(0, 50)}...`,
                      });
                    }}
                  />
                </div>
              )}

              {activeRightPanel === 'analytics' && (
                <div className="min-w-0 overflow-hidden h-full">
                  <ReadingAnalyticsPanel
                    currentPage={currentPage}
                    totalPages={totalPages}
                    readingStartTime={readingStartTime}
                    isActivelyReading={isActivelyReading}
                    documentsRead={documents?.length || 1}
                    persona={persona}
                    jobToBeDone={jobToBeDone}
                  />
                </div>
              )}

              {activeRightPanel === 'bookmarks' && (
                <div className="min-w-0 overflow-hidden h-full">
                  <SmartBookmarksPanel
                    currentPage={currentPage}
                    selectedText={selectedText}
                    currentSection={getCurrentSectionTitle()}
                    documentId={currentDocument?.id}
                    persona={persona}
                    jobToBeDone={jobToBeDone}
                  />
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}