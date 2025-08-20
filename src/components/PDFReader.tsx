import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DocumentOutline } from './DocumentOutline';
import { EnhancedLeftPanel } from './EnhancedLeftPanel';
import { FloatingTools } from './FloatingTools';
import { CustomPDFViewer } from './CustomPDFViewer';
import { EnhancedPDFViewer } from './EnhancedPDFViewer';
import { CrossConnectionsPanel } from './CrossConnectionsPanel';
import { StrategicInsightsPanel } from './StrategicInsightsPanel';
import { EnhancedStrategicPanel } from './EnhancedStrategicPanel';
import { InsightsPanel } from './InsightsPanel';
import { EnhancedInsightsPanel } from './EnhancedInsightsPanel';
import { EnhancedAIInsightsPanel } from './EnhancedAIInsightsPanel';
import { TextLayerHighlight } from '@/lib/textbookHighlighter';
import { Badge } from '@/components/ui/badge';

// Custom PDF Viewer wrapper component
function CustomPDFViewerWrapper({ 
  documentUrl, 
  documentName, 
  documentId,
  onPageChange, 
  onTextSelection, 
  highlights,
  currentPage,
  goToSection,
  onHighlightsChange
}: {
  documentUrl: string;
  documentName: string;
  documentId?: string;
  onPageChange?: (page: number) => void;
  onTextSelection?: (text: string, page: number) => void;
  highlights?: Highlight[];
  currentPage?: number;
  goToSection?: { page: number; section?: string } | null;
  onHighlightsChange?: (highlights: TextLayerHighlight[]) => void;
}) {
  return (
    <CustomPDFViewer
      documentUrl={documentUrl}
      documentName={documentName}
      documentId={documentId}
      onPageChange={onPageChange}
      onTextSelection={onTextSelection}
      highlights={highlights}
      currentHighlightPage={currentPage}
      goToSection={goToSection}
      onHighlightsChange={onHighlightsChange}
    />
  );
}

import { ThemeToggle } from './ThemeToggle';
import { AccessibilityPanel } from './AccessibilityPanel';
import { PodcastPanel } from './PodcastPanel';
import { HighlightPanel } from './HighlightPanel';
import { EnhancedHighlightFlashcards } from './EnhancedHighlightFlashcards';
import { HighlightsPopup } from './HighlightsPopup';
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
  title: string;
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
  color: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'yellow' | 'green' | 'blue' | 'gold';
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
  const [aiHighlightsVisible, setAiHighlightsVisible] = useState(false); // New state for AI highlights visibility
  const [highlightsPopupOpen, setHighlightsPopupOpen] = useState(false); // New state for highlights popup
  const [goToSection, setGoToSection] = useState<{ page: number; section?: string } | null>(null);
  const [activeRightPanel, setActiveRightPanel] = useState<'insights' | 'strategic' | 'connections' | 'podcast' | 'accessibility' | 'simplifier' | 'export' | 'highlights' | 'analytics' | 'bookmarks' | null>('highlights');

  // Reset goToSection after it's been processed to prevent continuous navigation
  useEffect(() => {
    if (goToSection) {
      const timer = setTimeout(() => {
        setGoToSection(null);
      }, 100); // Small delay to ensure the PDF viewer processes the navigation
      return () => clearTimeout(timer);
    }
  }, [goToSection]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [currentInsights, setCurrentInsights] = useState<Array<{ type: string; content: string }>>([]);
  const [relatedSections, setRelatedSections] = useState<RelatedSection[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<number>(Date.now());
  const [isActivelyReading, setIsActivelyReading] = useState(true);
  const [totalPages, setTotalPages] = useState(30); // Will be updated from PDF
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [textbookHighlights, setTextbookHighlights] = useState<TextLayerHighlight[]>([]);

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
    // Highlights are now automatically applied through the HybridPDFViewer component
    // which uses the pdfHighlighter utility for better text matching and positioning
    console.log('Highlight navigation:', highlight);
    
    // Show a notification about the highlight
    toast({
      title: "Highlight Active",
      description: `Viewing highlight on page ${highlight.page}: "${highlight.text.substring(0, 50)}..."`,
    });
  };

  const handleOutlineClick = (item: OutlineItem) => {
    console.log(`PDFReader: Navigating to page ${item.page} for item: ${item.title}`);
    setCurrentPage(item.page);
    
    // Show a toast to confirm navigation
    toast({
      title: "Navigated to Section",
      description: `${item.title} (Page ${item.page})`,
    });
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
              explanation: `Key insight for ${persona} - ${jobToBeDone}`
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
        
        // Enable AI highlights visibility and show flashcards
        setAiHighlightsVisible(true);
        setActiveRightPanel('highlights');
        
        toast({
          title: "AI Analysis Complete",
          description: `Generated ${intelligenceHighlights.length} intelligent highlights based on document analysis.`,
        });
      } else {
        // Fallback: Generate smart highlights based on document structure
        generateFallbackHighlights();
      }
    } catch (error) {
      console.error('Failed to generate intelligence highlights:', error);
      // Fallback: Generate smart highlights based on document structure
      generateFallbackHighlights();
    }
  };

  // Generate fallback highlights when API is unavailable
  const generateFallbackHighlights = () => {
    const fallbackHighlights: Highlight[] = [];
    
    // Generate highlights based on document outline and structure
    if (currentDocument && currentDocument.outline.length > 0) {
      currentDocument.outline.forEach((item, index) => {
        if (index < 8) { // Limit to first 8 sections
          const highlight: Highlight = {
            id: `fallback-outline-${index}`,
            text: item.title || `Section ${index + 1}`,
            page: item.page,
            color: index < 3 ? 'primary' : index < 6 ? 'secondary' : 'tertiary',
            relevanceScore: Math.max(0.6, 1 - (index * 0.05)), // Decreasing relevance
            explanation: `Important section for ${persona || 'your role'}: ${item.title || `Section ${index + 1}`}`
          };
          fallbackHighlights.push(highlight);
        }
      });
    } else {
      // Generate generic highlights when no outline is available
      const genericHighlights = [
        {
          id: 'fallback-intro',
          text: 'Introduction',
          page: 1,
          color: 'primary' as const,
          relevanceScore: 0.95,
          explanation: `Key introduction section highly relevant for ${persona || 'your role'}`
        },
        {
          id: 'fallback-overview',
          text: 'Overview',
          page: Math.max(1, Math.floor(currentPage * 0.2)),
          color: 'secondary' as const,
          relevanceScore: 0.85,
          explanation: `Overview section providing context for ${jobToBeDone || 'your task'}`
        },
        {
          id: 'fallback-key-points',
          text: 'Key Points',
          page: Math.max(1, Math.floor(currentPage * 0.5)),
          color: 'primary' as const,
          relevanceScore: 0.9,
          explanation: `Critical information section for ${persona || 'your role'}`
        },
        {
          id: 'fallback-details',
          text: 'Important Details',
          page: Math.max(1, Math.floor(currentPage * 0.7)),
          color: 'tertiary' as const,
          relevanceScore: 0.75,
          explanation: `Detailed information relevant to ${jobToBeDone || 'your objectives'}`
        },
        {
          id: 'fallback-conclusion',
          text: 'Conclusion',
          page: Math.max(1, currentPage),
          color: 'secondary' as const,
          relevanceScore: 0.8,
          explanation: `Summary and conclusions for ${persona || 'your role'}`
        }
      ];
      
      fallbackHighlights.push(...genericHighlights);
    }
    
    // Add some content-based highlights if we have current text
    if (selectedText && selectedText.length > 50) {
      fallbackHighlights.push({
        id: 'fallback-selected',
        text: selectedText.slice(0, 200),
        page: currentPage,
        color: 'primary',
        relevanceScore: 0.9,
        explanation: `Currently selected text - highly relevant to your ${jobToBeDone || 'current task'}`
      });
    }
    
    // Add to existing highlights
    setHighlights(prev => {
      const existingIds = new Set(prev.map(h => h.id));
      const newHighlights = fallbackHighlights.filter(h => !existingIds.has(h.id));
      const updatedHighlights = [...prev, ...newHighlights];
      
      // Apply highlights immediately after setting them
      setTimeout(() => {
        newHighlights.forEach((highlight, index) => {
          setTimeout(() => {
            applyHighlightToPDF(highlight);
          }, index * 200); // Stagger the application
        });
      }, 100);
      
      return updatedHighlights;
    });
    
    // Enable AI highlights visibility and show flashcards
    setAiHighlightsVisible(true);
    setActiveRightPanel('highlights');
    
    toast({
      title: "Smart Highlights Generated",
      description: `Generated ${fallbackHighlights.length} highlights based on document structure and your role as ${persona || 'user'}.`,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background pdf-reader-layout">
      {/* Header */}
      <header className="border-b border-border-subtle bg-surface-elevated/95 backdrop-blur-md shadow-sm relative z-40">
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
              onClick={() => {
                if (highlights.length === 0) {
                  // Generate new highlights first
                  generateIntelligenceHighlights();
                  // Open popup after a short delay to allow highlights to be generated
                  setTimeout(() => {
                    setHighlightsPopupOpen(true);
                  }, 1000);
                } else {
                  // Open highlights popup directly
                  setHighlightsPopupOpen(true);
                }
                
                toast({
                  title: "Opening AI Highlights",
                  description: "View and study your highlighted content in flashcard format"
                });
              }}
              disabled={!documents}
              className="gap-2 hover:bg-surface-hover"
              aria-label="Open AI highlights popup"
            >
              <Highlighter className="h-4 w-4" />
              AI Highlights
              {highlights.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {highlights.length}
                </Badge>
              )}
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

      <div className="flex flex-1 min-h-0 relative">
        {/* Left Sidebar - Enhanced Navigation */}
        {leftSidebarOpen && (
          <aside 
            className="fixed left-0 h-full bg-surface-elevated/95 border-r border-border-subtle flex flex-col animate-fade-in backdrop-blur-sm z-30 shadow-xl pdf-reader-sidebar"
            style={{ 
              width: `300px`, 
              maxWidth: `300px`,
              top: '73px', // Account for header height
              height: 'calc(100vh - 73px)'
            }}
          >
            <div className="flex-1 overflow-hidden flex flex-col min-w-0 p-4 sidebar-content">
              <EnhancedLeftPanel
                documents={documents}
                currentDocument={currentDocument}
                currentPage={currentPage}
                totalPages={totalPages}
                persona={persona}
                jobToBeDone={jobToBeDone}
                onDocumentChange={setCurrentDocument}
                onPageNavigate={setCurrentPage}
                onSectionNavigate={(page, section) => {
                  setCurrentPage(page);
                  setGoToSection({ page, section });
                  toast({
                    title: "Navigating to Section",
                    description: `${section} - Page ${page}`,
                  });
                }}
                onQuickAction={(actionId) => {
                  switch (actionId) {
                    case 'strategic':
                      setActiveRightPanel('strategic');
                      break;
                    case 'highlights':
                      setActiveRightPanel('highlights');
                      break;
                    case 'insights':
                      setActiveRightPanel('insights');
                      break;
                    default:
                      break;
                  }
                }}
              />
            </div>
            
            {/* Resize Handle */}
            <div 
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-border-subtle transition-colors"
              onMouseDown={handleMouseDown}
              title="Drag to resize sidebar"
            />
          </aside>
        )}

        {/* Main PDF Viewer - Enhanced */}
        <main 
          className="flex-1 relative transition-all duration-300 p-4 main-content-area"
          style={{ 
            marginLeft: leftSidebarOpen ? '320px' : '20px',
            marginRight: rightPanelOpen ? '340px' : '20px',
            minWidth: '0',
            overflow: 'hidden'
          }}
        >
          {currentDocument ? (
            <CustomPDFViewerWrapper
              documentUrl={currentDocument.url}
              documentName={currentDocument.name}
              documentId={currentDocument.id}
              onPageChange={setCurrentPage}
              onTextSelection={handleTextSelection}
              highlights={highlights}
              currentPage={currentPage}
              goToSection={goToSection}
              onHighlightsChange={(newHighlights) => {
                console.log('Highlights changed:', newHighlights);
              }}
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
          <aside 
            className="fixed right-0 bg-surface-elevated/95 border-l border-border-subtle flex flex-col animate-fade-in backdrop-blur-sm overflow-hidden shadow-xl z-30 pdf-reader-sidebar"
            style={{
              width: '340px',
              maxWidth: '340px',
              top: '73px', // Account for header height
              height: 'calc(100vh - 73px)'
            }}
          >
            <div className="p-4 border-b border-border-subtle min-w-0">
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

            <div className="flex-1 overflow-hidden min-w-0 p-4 sidebar-content">
              {activeRightPanel === 'insights' && (
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
                  <EnhancedAIInsightsPanel 
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
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
                  <EnhancedStrategicPanel 
                    documentId={currentDocument?.id}
                    persona={persona}
                    jobToBeDone={jobToBeDone}
                    currentText={selectedText || getCurrentSectionTitle()}
                    currentPage={currentPage}
                    onPageNavigate={setCurrentPage}
                    onSectionNavigate={(page, section) => {
                      setCurrentPage(page);
                      setGoToSection({ page, section });
                      toast({
                        title: "Navigating to Section",
                        description: `Going to page ${page} - ${section}`,
                      });
                    }}
                  />
                </div>
              )}
              
              {activeRightPanel === 'connections' && currentDocument && (
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
                  <div className="overflow-y-auto h-full">
                    <CrossConnectionsPanel 
                      documentId={currentDocument.id}
                      onNavigateToDocument={(docId) => {
                        console.log('Attempting to navigate to document:', docId);
                        console.log('Available documents:', documents.map(d => ({ id: d.id, title: d.title })));
                        
                        // Find the document by ID (try exact match first, then partial match)
                        let targetDocument = documents.find(doc => doc.id === docId);
                        
                        // If exact match fails, try to find by title or name
                        if (!targetDocument) {
                          targetDocument = documents.find(doc => 
                            doc.title.toLowerCase().includes(docId.toLowerCase()) ||
                            doc.name.toLowerCase().includes(docId.toLowerCase()) ||
                            docId.toLowerCase().includes(doc.title.toLowerCase()) ||
                            docId.toLowerCase().includes(doc.name.toLowerCase())
                          );
                        }
                        
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
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
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
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
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
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
                  <TextSimplifier 
                    originalText={selectedText || getCurrentSectionTitle()}
                    onSimplifiedText={(text) => console.log('Simplified:', text)}
                  />
                </div>
              )}

              {activeRightPanel === 'export' && (
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
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
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
                  <EnhancedHighlightFlashcards
                    highlights={highlights}
                    onHighlightClick={(highlight) => {
                      // Navigate to the highlight page
                      setCurrentPage(highlight.page);
                      
                      // The highlight will be automatically shown through the PDF viewer
                      toast({
                        title: "Navigated to Highlight",
                        description: `Page ${highlight.page}: ${highlight.text.substring(0, 50)}...`,
                      });
                    }}
                    onRemoveHighlight={(highlightId) => {
                      // Remove highlight from the list
                      setHighlights(prev => prev.filter(h => h.id !== highlightId));
                      toast({
                        title: "Highlight Removed",
                        description: "The highlight has been successfully removed.",
                      });
                    }}
                    onGenerateMore={() => {
                      // Generate more intelligent highlights
                      generateIntelligenceHighlights();
                      toast({
                        title: "Generating Smart Highlights",
                        description: "AI is analyzing the document for important passages...",
                      });
                    }}
                    currentPage={currentPage}
                    persona={persona}
                    jobToBeDone={jobToBeDone}
                  />
                </div>
              )}

              {activeRightPanel === 'analytics' && (
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
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
                <div className="min-w-0 overflow-y-auto h-full break-words panel-content">
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

      {/* Highlights Popup */}
      <HighlightsPopup
        isOpen={highlightsPopupOpen}
        onClose={() => setHighlightsPopupOpen(false)}
        highlights={highlights}
        onHighlightClick={(highlight) => {
          // Navigate to the highlight page and close popup
          setCurrentPage(highlight.page);
          setHighlightsPopupOpen(false);
          
          toast({
            title: "Navigated to Highlight",
            description: `Page ${highlight.page}: ${highlight.text.substring(0, 50)}...`,
          });
        }}
      />
    </div>
  );
}