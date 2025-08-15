import { useState, useEffect, useRef } from 'react';
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
  Search,
  Lightbulb,
  X,
  Highlighter,
  Info
} from 'lucide-react';
import { PDFDocument, Highlight } from './PDFReader';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DoYouKnowInsight {
  id: string;
  x: number; // percentage position
  y: number; // percentage position
  page: number;
  title: string;
  content: string;
  category: 'fact' | 'tip' | 'connection' | 'definition';
}

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
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightMenuPosition, setHighlightMenuPosition] = useState({ x: 0, y: 0 });
  const [doYouKnowInsights, setDoYouKnowInsights] = useState<DoYouKnowInsight[]>([]);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Generate mock "Do You Know" insights
  useEffect(() => {
    const mockInsights: DoYouKnowInsight[] = [
      {
        id: 'insight-1',
        x: 75,
        y: 20,
        page: currentPage,
        title: 'Did You Know?',
        content: 'This concept is directly related to the principles discussed in Chapter 3. The correlation between these topics has been proven in multiple peer-reviewed studies, showing a 87% consistency rate.',
        category: 'connection'
      },
      {
        id: 'insight-2',
        x: 25,
        y: 45,
        page: currentPage,
        title: 'Key Insight',
        content: 'Recent research from MIT (2024) suggests that this methodology increases efficiency by up to 40% when properly implemented in organizational settings.',
        category: 'fact'
      },
      {
        id: 'insight-3',
        x: 60,
        y: 70,
        page: currentPage,
        title: 'Pro Tip',
        content: 'Industry experts recommend combining this approach with agile methodologies for optimal results. This hybrid strategy has been successfully adopted by 70% of Fortune 500 companies.',
        category: 'tip'
      },
      {
        id: 'insight-4',
        x: 40,
        y: 30,
        page: currentPage,
        title: 'Definition',
        content: 'This technical term originates from Latin and refers to the systematic approach of breaking down complex problems into manageable components.',
        category: 'definition'
      }
    ];
    setDoYouKnowInsights(mockInsights);
  }, [currentPage]);

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

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setHighlightMenuPosition({ 
        x: rect.left + rect.width / 2, 
        y: rect.top - 10 
      });
      setShowHighlightMenu(true);
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
    setShowHighlightMenu(false);
    window.getSelection()?.removeAllRanges();
  };

  const getInsightIcon = (category: DoYouKnowInsight['category']) => {
    switch (category) {
      case 'fact': return '💡';
      case 'tip': return '✨';
      case 'connection': return '🔗';
      case 'definition': return '📖';
    }
  };

  return (
    <div className="h-full flex flex-col bg-pdf-background">
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between p-3 bg-surface-elevated border-b border-border-subtle shadow-sm">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="hover:bg-surface-hover"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-text-secondary min-w-[100px] text-center">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="hover:bg-surface-hover"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="hover:bg-surface-hover"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-[150px]">
            <Slider
              value={[zoom * 100]}
              onValueChange={([value]) => onZoomChange(value / 100)}
              min={50}
              max={300}
              step={25}
              className="w-24"
            />
            <span className="text-sm text-text-secondary min-w-[45px]">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3.0}
            className="hover:bg-surface-hover"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Additional Tools */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hover:bg-surface-hover">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="hover:bg-surface-hover">
            <Search className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hover:bg-surface-hover"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="hover:bg-surface-hover">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content Area with Highlights and Insights */}
      <div 
        ref={pdfContainerRef}
        className="flex-1 overflow-auto relative"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        onMouseUp={handleTextSelection}
      >
        <div className="max-w-4xl mx-auto my-8 relative">
          {/* Mock PDF Page */}
          <div className="bg-white shadow-2xl relative" style={{ aspectRatio: '8.5/11' }}>
            {/* Page Content */}
            <div className="p-16 space-y-4 select-text">
              {/* Integrated Highlights */}
              {highlights
                .filter(h => h.page === currentPage)
                .map(highlight => (
                  <div
                    key={highlight.id}
                    className={`inline-block px-1 rounded transition-all cursor-pointer hover:opacity-80 ${
                      highlight.color === 'primary' ? 'bg-yellow-200/60' :
                      highlight.color === 'secondary' ? 'bg-green-200/60' :
                      'bg-blue-200/60'
                    }`}
                    title={highlight.explanation}
                  >
                    {/* This would overlay actual PDF text */}
                    <span className="text-gray-800">{highlight.text.substring(0, 50)}...</span>
                  </div>
                ))}

              {/* Mock PDF Text */}
              <h1 className="text-3xl font-bold mb-6 text-gray-900">Chapter {currentPage}: Advanced Concepts</h1>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
                culpa qui officia deserunt mollit anim id est laborum.
              </p>

              <h2 className="text-xl font-semibold mb-3 text-gray-800">Key Principles</h2>
              
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Principle 1: Foundation of understanding</li>
                <li>Principle 2: Application in practice</li>
                <li>Principle 3: Advanced implementation</li>
                <li>Principle 4: Optimization strategies</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
                doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
                veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
            </div>

            {/* Do You Know Insights - Floating Bulbs */}
            {doYouKnowInsights
              .filter(insight => insight.page === currentPage)
              .map(insight => (
                <Popover key={insight.id}>
                  <PopoverTrigger asChild>
                    <button
                      className={`absolute group transition-all duration-300 ${
                        activeInsight === insight.id ? 'scale-110' : 'hover:scale-105'
                      }`}
                      style={{ 
                        left: `${insight.x}%`, 
                        top: `${insight.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => setActiveInsight(activeInsight === insight.id ? null : insight.id)}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 animate-pulse" />
                        <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2.5 shadow-lg border-2 border-white">
                          <Lightbulb className="h-5 w-5 text-white" />
                        </div>
                        <span className="absolute -top-1 -right-1 text-lg">
                          {getInsightIcon(insight.category)}
                        </span>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 p-0 border-0 shadow-2xl"
                    side="top"
                    align="center"
                  >
                    <Card className="border-0 bg-gradient-to-br from-surface-elevated to-background">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-brand-primary flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            {insight.title}
                          </h3>
                          <span className="text-2xl">{getInsightIcon(insight.category)}</span>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {insight.content}
                        </p>
                      </CardContent>
                    </Card>
                  </PopoverContent>
                </Popover>
              ))}
          </div>
        </div>
      </div>

      {/* Floating Highlight Menu */}
      {showHighlightMenu && (
        <div 
          className="fixed z-50 bg-surface-elevated rounded-lg shadow-2xl border border-border-subtle p-2 flex items-center gap-1"
          style={{ 
            left: highlightMenuPosition.x, 
            top: highlightMenuPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleHighlightText('primary')}
            className="hover:bg-yellow-100"
          >
            <div className="h-4 w-4 bg-yellow-400 rounded" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleHighlightText('secondary')}
            className="hover:bg-green-100"
          >
            <div className="h-4 w-4 bg-green-400 rounded" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleHighlightText('tertiary')}
            className="hover:bg-blue-100"
          >
            <div className="h-4 w-4 bg-blue-400 rounded" />
          </Button>
          <div className="w-px h-6 bg-border-subtle mx-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHighlightMenu(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Page Number Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-surface-elevated/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-border-subtle">
        <span className="text-sm font-medium text-text-primary">
          {currentPage} / {totalPages}
        </span>
      </div>
    </div>
  );
}