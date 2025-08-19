import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Highlighter, 
  Search, 
  Filter, 
  Copy, 
  Download,
  ExternalLink,
  Trash2,
  SortAsc,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Brain,
  CreditCard
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Highlight } from './PDFReader';
import { FlashcardModal } from './FlashcardModal';
import { TextLayerHighlight } from '@/lib/textbookHighlighter';

interface HighlightPanelProps {
  highlights: Highlight[];
  onHighlightClick: (highlight: Highlight) => void;
  onRemoveHighlight?: (highlightId: string) => void;
  textbookHighlights?: TextLayerHighlight[];
}

export function HighlightPanel({ highlights, onHighlightClick, onRemoveHighlight, textbookHighlights = [] }: HighlightPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState<'all' | 'primary' | 'secondary' | 'tertiary'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'page' | 'recent'>('relevance');
  const [expandedHighlights, setExpandedHighlights] = useState<Set<string>>(new Set());
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);

  const toggleExpanded = (highlightId: string) => {
    setExpandedHighlights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(highlightId)) {
        newSet.delete(highlightId);
      } else {
        newSet.add(highlightId);
      }
      return newSet;
    });
  };

  const filteredHighlights = highlights
    .filter(highlight => {
      const matchesSearch = highlight.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           highlight.explanation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesColor = filterColor === 'all' || highlight.color === filterColor;
      return matchesSearch && matchesColor;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'page':
          return a.page - b.page;
        case 'recent':
          return parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]);
        default:
          return 0;
      }
    });

  const getColorName = (color: Highlight['color']) => {
    switch (color) {
      case 'primary': return 'Important';
      case 'secondary': return 'Key Concept';
      case 'tertiary': return 'Reference';
    }
  };

  const getColorClasses = (color: Highlight['color']) => {
    switch (color) {
      case 'primary': return 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700';
      case 'secondary': return 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700';
      case 'tertiary': return 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700';
    }
  };

  const handleExportHighlights = () => {
    const exportData = filteredHighlights.map(h => ({
      text: h.text,
      page: h.page,
      relevance: h.relevanceScore,
      explanation: h.explanation,
      color: getColorName(h.color)
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'highlights.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAllHighlights = () => {
    const allText = filteredHighlights
      .map(h => `Page ${h.page}: "${h.text}" - ${h.explanation}`)
      .join('\n\n');
    navigator.clipboard?.writeText(allText);
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border-subtle">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Highlighter className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-text-primary">Highlights</h3>
            <Badge variant="secondary" className="text-xs">
              {highlights.length}
            </Badge>
          </div>
          
          {/* Flashcards Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlashcardModalOpen(true)}
            disabled={highlights.length === 0}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            Study Cards
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-4 w-4" />
          <Input
            placeholder="Search highlights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Filter className="h-4 w-4" />
                {filterColor === 'all' ? 'All Types' : getColorName(filterColor as any)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterColor('all')}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterColor('primary')}>
                Important
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterColor('secondary')}>
                Key Concept
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterColor('tertiary')}>
                Reference
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <SortAsc className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('relevance')}>
                By Relevance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('page')}>
                By Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('recent')}>
                Most Recent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Buttons */}
        {filteredHighlights.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAllHighlights}
              className="flex-1 gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHighlights}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Highlights List - using native scrolling */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredHighlights.length > 0 ? (
            filteredHighlights.map((highlight) => {
              const isExpanded = expandedHighlights.has(highlight.id);
              const isLongText = highlight.text.length > 150;
              
              return (
                <div
                  key={highlight.id}
                  className={`
                    p-3 rounded-lg border-l-4 cursor-pointer transition-all
                    ${getColorClasses(highlight.color)}
                    hover:shadow-md hover:scale-[1.01]
                  `}
                  onClick={() => onHighlightClick(highlight)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Page {highlight.page}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          highlight.color === 'primary' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          highlight.color === 'secondary' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {getColorName(highlight.color)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            highlight.relevanceScore >= 0.9 ? 'bg-green-500' :
                            highlight.relevanceScore >= 0.8 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="text-xs text-text-tertiary">
                          {Math.round(highlight.relevanceScore * 100)}%
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard?.writeText(highlight.text);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Text
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onHighlightClick(highlight);
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Go to Page
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {onRemoveHighlight && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveHighlight(highlight.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm text-text-primary leading-relaxed">
                      "{isExpanded || !isLongText 
                        ? highlight.text 
                        : `${highlight.text.substring(0, 150)}...`}"
                    </p>
                    {isLongText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(highlight.id);
                        }}
                        className="mt-1 h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                      >
                        {isExpanded ? (
                          <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
                        ) : (
                          <>Show more <ChevronDown className="h-3 w-3 ml-1" /></>
                        )}
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-text-secondary">
                    {highlight.explanation}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              {highlights.length === 0 ? (
                <>
                  <Highlighter className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-sm text-text-secondary mb-1">
                    No highlights yet
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Select text in the PDF to create highlights
                  </p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-sm text-text-secondary mb-1">
                    No highlights match your search
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Try adjusting your search terms or filters
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterColor('all');
                    }}
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {highlights.length > 0 && (
        <div className="p-4 border-t border-border-subtle flex-shrink-0">
          <div className="text-xs text-text-secondary space-y-1">
            <div className="flex justify-between">
              <span>Total Highlights</span>
              <span>{highlights.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg. Relevance</span>
              <span>
                {Math.round(
                  highlights.reduce((acc, h) => acc + h.relevanceScore, 0) / highlights.length * 100
                )}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pages Covered</span>
              <span>
                {new Set(highlights.map(h => h.page)).size}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Flashcard Modal */}
      <FlashcardModal
        isOpen={flashcardModalOpen}
        onClose={() => setFlashcardModalOpen(false)}
        highlights={highlights}
        textbookHighlights={textbookHighlights}
      />
    </div>
  );
}