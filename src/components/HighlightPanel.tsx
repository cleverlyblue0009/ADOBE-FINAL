import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ChevronRight
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Highlight } from './PDFReader';

interface HighlightPanelProps {
  highlights: Highlight[];
  onHighlightClick: (highlight: Highlight) => void;
}

export function HighlightPanel({ highlights, onHighlightClick }: HighlightPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState<'all' | 'primary' | 'secondary' | 'tertiary'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'page' | 'recent'>('relevance');

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
      case 'primary': return 'Yellow';
      case 'secondary': return 'Green';
      case 'tertiary': return 'Blue';
    }
  };

  const getColorClasses = (color: Highlight['color']) => {
    switch (color) {
      case 'primary': return 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200';
      case 'secondary': return 'bg-green-100 border-green-400 hover:bg-green-200';
      case 'tertiary': return 'bg-blue-100 border-blue-400 hover:bg-blue-200';
    }
  };

  const getColorDot = (color: Highlight['color']) => {
    switch (color) {
      case 'primary': return 'bg-yellow-400';
      case 'secondary': return 'bg-green-400';
      case 'tertiary': return 'bg-blue-400';
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
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = async () => {
    const text = filteredHighlights
      .map(h => `"${h.text}" (Page ${h.page}) - ${h.explanation}`)
      .join('\n\n');
    
    try {
      await navigator.clipboard.writeText(text);
      // Would show success toast
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-surface-elevated to-background">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle bg-surface-elevated/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-lg">
              <Highlighter className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Highlights</h2>
              <p className="text-xs text-text-secondary">{filteredHighlights.length} highlights</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-surface-hover">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleCopyAll}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportHighlights}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            type="text"
            placeholder="Search highlights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 border-border-subtle focus:border-brand-primary transition-colors"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Color Filter */}
          <div className="flex items-center gap-1 flex-1">
            <Button
              variant={filterColor === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterColor('all')}
              className="h-7 text-xs"
            >
              All
            </Button>
            <Button
              variant={filterColor === 'primary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterColor('primary')}
              className="h-7 text-xs"
            >
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1" />
              Yellow
            </Button>
            <Button
              variant={filterColor === 'secondary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterColor('secondary')}
              className="h-7 text-xs"
            >
              <div className="w-3 h-3 bg-green-400 rounded-full mr-1" />
              Green
            </Button>
            <Button
              variant={filterColor === 'tertiary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterColor('tertiary')}
              className="h-7 text-xs"
            >
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-1" />
              Blue
            </Button>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <SortAsc className="h-3 w-3 mr-1" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('relevance')}>
                By Relevance
                {sortBy === 'relevance' && <div className="ml-auto h-2 w-2 bg-brand-primary rounded-full" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('page')}>
                By Page
                {sortBy === 'page' && <div className="ml-auto h-2 w-2 bg-brand-primary rounded-full" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('recent')}>
                Most Recent
                {sortBy === 'recent' && <div className="ml-auto h-2 w-2 bg-brand-primary rounded-full" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Highlights List - Properly Scrollable */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {filteredHighlights.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Highlighter className="h-8 w-8 text-brand-primary/50" />
              </div>
              <p className="text-text-secondary text-sm">No highlights found</p>
              <p className="text-text-tertiary text-xs mt-1">
                {searchTerm ? 'Try adjusting your search' : 'Select text in the PDF to create highlights'}
              </p>
            </div>
          ) : (
            filteredHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className={`group p-4 rounded-xl border-2 cursor-pointer transition-all ${getColorClasses(highlight.color)}`}
                onClick={() => onHighlightClick(highlight)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getColorDot(highlight.color)}`} />
                    <Badge variant="outline" className="text-xs">
                      Page {highlight.page}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10"
                    >
                      {Math.round(highlight.relevanceScore * 100)}% relevant
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Highlighted Text */}
                <p className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
                  "{highlight.text}"
                </p>

                {/* Explanation */}
                <p className="text-xs text-text-secondary italic">
                  {highlight.explanation}
                </p>

                {/* Actions on Hover */}
                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(highlight.text);
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Jump to page
                      onHighlightClick(highlight);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Go to Page
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Summary Footer */}
      <div className="p-4 border-t border-border-subtle bg-surface-elevated/50 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Total: {highlights.length} highlights</span>
          <span>Avg. Relevance: {Math.round(
            (highlights.reduce((sum, h) => sum + h.relevanceScore, 0) / highlights.length) * 100
          )}%</span>
        </div>
      </div>
    </div>
  );
}