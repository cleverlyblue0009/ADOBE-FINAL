import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  RotateCw,
  Maximize2,
  Download,
  Search
} from 'lucide-react';
import { PDFDocument, Highlight } from './PDFReader';
import { InsightBulbs, sampleInsights } from './InsightBulbs';

interface PDFViewerProps {
  document: PDFDocument;
  currentPage: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  highlights: Highlight[];
  onHighlight: (highlight: Highlight) => void;
}

export function PDFViewer({
  document,
  currentPage,
  zoom,
  onPageChange,
  onZoomChange,
  highlights,
  onHighlight
}: PDFViewerProps) {
  const [totalPages] = useState(30); // Mock total pages
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  // Mock PDF rendering - in real implementation, would use Adobe PDF Embed API
  useEffect(() => {
    // Initialize Adobe PDF Embed API here
    console.log('Loading PDF:', document.url);
  }, [document.url]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.25, 0.5));
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
      // Show highlight options
    }
  };

  const handleHighlightText = (color: 'primary' | 'secondary' | 'tertiary') => {
    if (!selectedText) return;

    const highlight: Highlight = {
      id: `highlight-${Date.now()}`,
      text: selectedText,
      page: currentPage,
      color,
      relevanceScore: 0.85,
      explanation: 'User highlighted text'
    };

    onHighlight(highlight);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  // Function to find text positions in the content
  const findTextInContent = (searchText: string, contentElement: HTMLElement): DOMRect[] => {
    const positions: DOMRect[] = [];
    
    if (!searchText || searchText.length < 3) return positions;
    
    // Normalize the search text
    const normalizedSearch = searchText.toLowerCase().trim();
    const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 2);
    
    // Get all text nodes
    const walker = document.createTreeWalker(
      contentElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent || '';
          return text.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    const textNodes: { node: Text; text: string; offset: number }[] = [];
    let currentOffset = 0;
    let node;
    
    // Build a map of all text nodes with their positions
    while (node = walker.nextNode()) {
      const textNode = node as Text;
      const text = textNode.textContent || '';
      textNodes.push({ node: textNode, text, offset: currentOffset });
      currentOffset += text.length;
    }
    
    // Join all text for searching
    const fullText = textNodes.map(n => n.text).join('').toLowerCase();
    
    // Try to find exact match first
    let searchIndex = fullText.indexOf(normalizedSearch);
    
    if (searchIndex === -1 && searchWords.length > 0) {
      // If no exact match, try to find the first few words
      const partialSearch = searchWords.slice(0, Math.min(3, searchWords.length)).join(' ');
      searchIndex = fullText.indexOf(partialSearch);
    }
    
    if (searchIndex !== -1) {
      // Find which text node contains the match
      let matchLength = normalizedSearch.length;
      
      for (const { node, text, offset } of textNodes) {
        const nodeEndOffset = offset + text.length;
        
        // Check if this node contains part of the match
        if (searchIndex < nodeEndOffset && searchIndex + matchLength > offset) {
          const startInNode = Math.max(0, searchIndex - offset);
          const endInNode = Math.min(text.length, searchIndex + matchLength - offset);
          
          if (startInNode < endInNode) {
            try {
              const range = document.createRange();
              range.setStart(node, startInNode);
              range.setEnd(node, endInNode);
              
              const rects = range.getClientRects();
              for (let i = 0; i < rects.length; i++) {
                const rect = rects[i];
                if (rect.width > 0 && rect.height > 0) {
                  positions.push(rect);
                }
              }
            } catch (e) {
              console.error('Error creating range:', e);
            }
          }
        }
      }
    }
    
    return positions;
  };

  // Render highlights based on actual text positions
  const renderHighlights = () => {
    const contentElement = document.getElementById('pdf-content');
    if (!contentElement) return null;
    
    const pageHighlights = highlights.filter(h => h.page === currentPage);
    
    return pageHighlights.map((highlight) => {
      // Find the text in the content
      let positions = findTextInContent(highlight.text, contentElement);
      
      if (positions.length === 0) {
        // If exact match not found, try to find partial match
        const partialText = highlight.text.substring(0, 30);
        positions = findTextInContent(partialText, contentElement);
      }
      
      return positions.map((rect, index) => {
        const contentRect = contentElement.getBoundingClientRect();
        
        return (
          <div
            key={`${highlight.id}-${index}`}
            className={`absolute pointer-events-auto cursor-pointer transition-all`}
            style={{
              top: `${rect.top - contentRect.top}px`,
              left: `${rect.left - contentRect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundColor: highlight.color === 'primary' ? 'rgba(254, 240, 138, 0.4)' : 
                             highlight.color === 'secondary' ? 'rgba(134, 239, 172, 0.4)' : 
                             'rgba(147, 197, 253, 0.4)',
              zIndex: 10,
              mixBlendMode: 'multiply'
            }}
            title={`${highlight.explanation} (${Math.round(highlight.relevanceScore * 100)}% relevant)`}
            onClick={() => {
              console.log('Highlight clicked:', highlight);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 
                highlight.color === 'primary' ? 'rgba(254, 240, 138, 0.6)' : 
                highlight.color === 'secondary' ? 'rgba(134, 239, 172, 0.6)' : 
                'rgba(147, 197, 253, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 
                highlight.color === 'primary' ? 'rgba(254, 240, 138, 0.4)' : 
                highlight.color === 'secondary' ? 'rgba(134, 239, 172, 0.4)' : 
                'rgba(147, 197, 253, 0.4)';
            }}
          >
            {/* Tooltip on hover */}
            <div className="absolute -top-8 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {highlight.text.substring(0, 50)}...
            </div>
          </div>
        );
      });
    }).flat();
  };

  // Force re-render when highlights change
  const [highlightElements, setHighlightElements] = useState<JSX.Element[]>([]);
  
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      const elements = renderHighlights();
      if (elements) {
        setHighlightElements(elements);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [highlights, currentPage]);

  return (
    <div className="h-full flex flex-col bg-pdf-background">
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between p-3 bg-surface-elevated border-b border-border-subtle">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
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
                if (page >= 1 && page <= totalPages) {
                  onPageChange(page);
                }
              }}
              className="w-16 px-2 py-1 text-center border border-border-subtle rounded bg-background text-text-primary"
              min={1}
              max={totalPages}
            />
            <span className="text-text-secondary">of {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
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
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 min-w-32">
              <Slider
                value={[zoom * 100]}
                onValueChange={([value]) => onZoomChange(value / 100)}
                min={50}
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
              onClick={handleZoomIn}
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
              onClick={() => console.log('Rotate page')}
              aria-label="Rotate page"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label="Toggle fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('Search in document')}
              aria-label="Search document"
            >
              <Search className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('Download document')}
              aria-label="Download document"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 overflow-auto relative">
        <div 
          className="pdf-canvas mx-auto my-8 relative"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            minHeight: '11in',
            width: '8.5in',
            backgroundColor: 'white'
          }}
          onMouseUp={handleTextSelection}
        >
          {/* Mock PDF Content */}
          <div className="p-8 text-gray-900 space-y-6" id="pdf-content">
            <header className="text-center border-b pb-6">
              <h1 className="text-2xl font-bold mb-2">
                Artificial Intelligence in Healthcare
              </h1>
              <p className="text-sm text-gray-600">
                A Comprehensive Review of Current Applications and Future Prospects
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Published in Journal of Medical AI Research, 2024
              </p>
            </header>

            {currentPage === 1 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Abstract</h2>
                <p className="text-sm leading-relaxed mb-4">
                  This paper presents a comprehensive review of artificial intelligence applications in modern healthcare systems. 
                  We examine the transformative potential of machine learning algorithms in clinical decision-making, 
                  patient care optimization, and medical research advancement. Our analysis covers deep learning models 
                  for medical imaging, natural language processing for clinical documentation, and predictive analytics 
                  for patient outcomes.
                </p>
                <p className="text-sm leading-relaxed mb-4">
                  The integration of AI technologies has shown remarkable success in early disease detection, 
                  treatment personalization, and healthcare resource allocation. This is an important concept that relates to the main topic of the document. 
                  However, challenges remain in data privacy, algorithmic bias, and regulatory compliance. This review synthesizes current 
                  research, identifies key opportunities, and proposes frameworks for responsible AI deployment 
                  in clinical settings.
                </p>
                <h3 className="text-lg font-semibold mt-6 mb-3">Keywords</h3>
                <p className="text-sm text-gray-700">
                  Artificial Intelligence, Machine Learning, Healthcare Technology, Medical Imaging, 
                  Clinical Decision Support, Predictive Analytics
                </p>
              </section>
            )}

            {currentPage === 2 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-sm leading-relaxed mb-4">
                  The healthcare industry stands at the precipice of a technological revolution. Artificial intelligence 
                  and machine learning technologies are reshaping how medical professionals diagnose diseases, 
                  develop treatment plans, and manage patient care. The convergence of big data, computational power, 
                  and sophisticated algorithms has created unprecedented opportunities for improving health outcomes 
                  while reducing costs.
                </p>
                <p className="text-sm leading-relaxed mb-4">
                  Recent advances in deep learning have enabled AI systems to analyze medical images with accuracy 
                  matching or exceeding that of experienced radiologists. Supporting evidence and data that reinforces the primary arguments. 
                  Natural language processing models can now extract meaningful insights from unstructured clinical notes, 
                  while predictive models help identify patients at risk of developing chronic conditions before symptoms appear.
                </p>
                <p className="text-sm leading-relaxed mb-4">
                  This paper provides a systematic review of AI applications across various medical specialties, 
                  examining both the remarkable successes and the significant challenges that remain. We analyze 
                  peer-reviewed studies from 2020-2024, focusing on real-world implementations and their measurable 
                  impact on patient outcomes.
                </p>
                <h3 className="text-lg font-semibold mt-6 mb-3">1.1 Historical Context</h3>
                <p className="text-sm leading-relaxed">
                  The journey of AI in healthcare began in the 1970s with early expert systems like MYCIN, 
                  designed to identify bacteria causing severe infections and recommend antibiotics. While these 
                  early systems showed promise, they were limited by the computational resources and data 
                  availability of their time.
                </p>
              </section>
            )}

            {currentPage === 3 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">2. Methodology</h2>
                <p className="text-sm leading-relaxed mb-4">
                  Our research methodology employed a systematic review approach following PRISMA guidelines. 
                  We searched multiple databases including PubMed, IEEE Xplore, and Google Scholar for papers 
                  published between January 2020 and October 2024. Critical analysis point that requires further consideration. 
                  The search strategy combined terms related to artificial intelligence, machine learning, 
                  deep learning, and various medical specialties.
                </p>
                <p className="text-sm leading-relaxed mb-4">
                  Inclusion criteria were: (1) peer-reviewed articles reporting original research, (2) studies 
                  involving AI/ML applications in clinical settings, (3) papers with quantitative outcome measures, 
                  and (4) English language publications. We excluded conference abstracts, opinion pieces, and 
                  studies without clinical validation.
                </p>
                <p className="text-sm leading-relaxed mb-4">
                  Two independent reviewers screened 3,847 initial articles, with 412 meeting our inclusion 
                  criteria. Data extraction focused on AI methodology, clinical application area, performance 
                  metrics, implementation challenges, and patient outcome improvements. Quality assessment 
                  utilized the QUADAS-2 tool for diagnostic accuracy studies.
                </p>
                <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Statistical Analysis</h3>
                <p className="text-sm leading-relaxed">
                  Meta-analysis was performed using random-effects models to account for heterogeneity across 
                  studies. We calculated pooled sensitivity, specificity, and area under the curve (AUC) values 
                  for diagnostic AI applications. Subgroup analyses examined performance variations across 
                  different medical specialties and AI architectures.
                </p>
              </section>
            )}

            {currentPage > 3 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Chapter {currentPage - 1}</h2>
                <p className="text-sm leading-relaxed mb-4">
                  This section would contain the actual content from page {currentPage} of the research paper. 
                  In a real implementation, this content would be rendered by the Adobe PDF Embed API with 
                  full fidelity to the original document formatting.
                </p>
                <p className="text-sm leading-relaxed">
                  The content would include proper typography, figures, charts, and all other elements 
                  exactly as they appear in the original PDF document.
                </p>
              </section>
            )}
          </div>

          {/* Highlight Overlays */}
          {highlightElements}

          {/* Insight Bulbs */}
          <InsightBulbs 
            insights={sampleInsights} 
            currentPage={currentPage} 
            zoom={zoom}
          />
        </div>
      </div>

      {/* Selection Highlight Tools */}
      {selectedText && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 floating-tool p-3 animate-scale-in">
          <p className="text-xs text-text-secondary mb-2">Highlight selected text:</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleHighlightText('primary')}
              className="bg-highlight-primary text-gray-900 hover:bg-highlight-primary/80"
            >
              Yellow
            </Button>
            <Button
              size="sm"
              onClick={() => handleHighlightText('secondary')}
              className="bg-highlight-secondary text-gray-900 hover:bg-highlight-secondary/80"
            >
              Green
            </Button>
            <Button
              size="sm"
              onClick={() => handleHighlightText('tertiary')}
              className="bg-highlight-tertiary text-gray-900 hover:bg-highlight-tertiary/80"
            >
              Blue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}