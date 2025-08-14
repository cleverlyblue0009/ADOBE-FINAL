import { useState, useEffect } from 'react';
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

  // Helper function to render text with highlights
  const renderHighlightedText = (text: string, pageHighlights: Highlight[]) => {
    if (pageHighlights.length === 0) return text;

    // Sort highlights by relevance score
    const sortedHighlights = [...pageHighlights].sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Create spans for highlighted portions
    let result = text;
    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    // Try to find and highlight matching text
    sortedHighlights.forEach(highlight => {
      const searchText = highlight.text.toLowerCase();
      const textLower = text.toLowerCase();
      
      // Try to find partial matches for section titles or key phrases
      const words = searchText.split(' ').filter(w => w.length > 3);
      
      for (const word of words) {
        const index = textLower.indexOf(word, lastIndex);
        if (index !== -1) {
          // Found a match, highlight this word and surrounding context
          const start = Math.max(0, index - 20);
          const end = Math.min(text.length, index + word.length + 20);
          
          if (start > lastIndex) {
            elements.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, start)}</span>);
          }
          
          elements.push(
            <span
              key={`highlight-${highlight.id}`}
              className={`highlight-${highlight.color} px-1 rounded`}
              title={`${highlight.explanation} (${Math.round(highlight.relevanceScore * 100)}% relevant)`}
            >
              {text.slice(start, end)}
            </span>
          );
          
          lastIndex = end;
          break;
        }
      }
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(<span key={`text-end`}>{text.slice(lastIndex)}</span>);
    }

    return elements.length > 0 ? <>{elements}</> : text;
  };

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
          <div className="pdf-content p-8 max-w-4xl mx-auto">
            {currentPage === 1 && (
              <section className="mb-8">
                <h1 className="text-3xl font-bold mb-4">{document.title}</h1>
                <p className="text-sm leading-relaxed mb-4">
                  {renderHighlightedText(
                    `This comprehensive study examines the implementation and impact of artificial intelligence 
                    technologies in modern healthcare systems. Through extensive research and clinical trials, 
                    we demonstrate that machine learning algorithms achieve 
                    94% accuracy in diagnostic imaging applications, significantly improving patient 
                    outcomes while reducing diagnostic time by up to 60%.`,
                    highlights.filter(h => h.page === currentPage)
                  )}
                </p>
                <p className="text-sm leading-relaxed">
                  {renderHighlightedText(
                    `Our findings indicate that AI integration faces several challenges, including 
                    data privacy concerns and regulatory compliance 
                    requirements that must be addressed for widespread adoption. However, the potential 
                    benefits far outweigh these limitations, particularly in areas of early disease detection 
                    and personalized treatment planning.`,
                    highlights.filter(h => h.page === currentPage)
                  )}
                </p>
              </section>
            )}

            {currentPage === 2 && (
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Methodology and Implementation</h2>
                <p className="text-sm leading-relaxed mb-4">
                  {renderHighlightedText(
                    `The research methodology employed in this study combines quantitative analysis of clinical 
                    data with qualitative assessments from healthcare professionals. We analyzed over 10,000 
                    patient records across 15 medical institutions, focusing on diagnostic accuracy and treatment 
                    outcomes. Integration with existing EHR systems requires 
                    standardized protocols to ensure seamless data flow and maintain interoperability 
                    across different healthcare providers. This standardization is crucial for the success 
                    of AI implementation at scale.`,
                    highlights.filter(h => h.page === currentPage)
                  )}
                </p>
                <p className="text-sm leading-relaxed">
                  Current research focuses on three primary areas: diagnostic imaging, predictive analytics, 
                  and personalized medicine. Each of these domains presents unique opportunities and challenges 
                  that we will explore in detail throughout this paper.
                </p>
              </section>
            )}

            {currentPage > 2 && (
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