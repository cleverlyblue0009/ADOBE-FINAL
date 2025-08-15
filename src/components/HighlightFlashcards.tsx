import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Copy, 
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCcw,
  BookOpen,
  Star,
  Eye
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Highlight } from './PDFReader';

interface HighlightFlashcardsProps {
  highlights: Highlight[];
  onHighlightClick: (highlight: Highlight) => void;
  onRemoveHighlight?: (highlightId: string) => void;
}

export function HighlightFlashcards({ 
  highlights, 
  onHighlightClick, 
  onRemoveHighlight 
}: HighlightFlashcardsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState<'all' | 'primary' | 'secondary' | 'tertiary'>('all');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('carousel');

  const filteredHighlights = highlights
    .filter(highlight => {
      const matchesSearch = highlight.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           highlight.explanation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesColor = filterColor === 'all' || highlight.color === filterColor;
      return matchesSearch && matchesColor;
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const currentHighlight = filteredHighlights[currentCardIndex];

  const getColorName = (color: Highlight['color']) => {
    switch (color) {
      case 'primary': return 'Important';
      case 'secondary': return 'Key Concept';
      case 'tertiary': return 'Reference';
    }
  };

  const getColorClasses = (color: Highlight['color']) => {
    switch (color) {
      case 'primary': return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      case 'secondary': return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case 'tertiary': return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
    }
  };

  const getColorBadge = (color: Highlight['color']) => {
    switch (color) {
      case 'primary': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'secondary': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'tertiary': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const nextCard = () => {
    if (currentCardIndex < filteredHighlights.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const resetCards = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  const FlashcardContent = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search highlights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {filterColor === 'all' ? 'All Types' : getColorName(filterColor as any)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'carousel' ? 'grid' : 'carousel')}
          >
            {viewMode === 'carousel' ? 'Grid View' : 'Card View'}
          </Button>
        </div>

        {filteredHighlights.length > 0 && (
          <div className="text-sm text-gray-500">
            {viewMode === 'carousel' 
              ? `${currentCardIndex + 1} of ${filteredHighlights.length}`
              : `${filteredHighlights.length} highlight${filteredHighlights.length !== 1 ? 's' : ''}`
            }
          </div>
        )}
      </div>

      {filteredHighlights.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No highlights found
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterColor !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start highlighting text in the PDF to create flashcards'
            }
          </p>
        </div>
      ) : viewMode === 'carousel' ? (
        /* Carousel View */
        <div className="space-y-6">
          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevCard}
              disabled={currentCardIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetCards}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextCard}
              disabled={currentCardIndex === filteredHighlights.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Flashcard */}
          <div className="max-w-2xl mx-auto">
            <Card 
              className={`
                min-h-[400px] cursor-pointer transition-all duration-300 hover:shadow-lg
                ${getColorClasses(currentHighlight.color)}
                ${isFlipped ? 'transform-gpu' : ''}
              `}
              onClick={flipCard}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getColorBadge(currentHighlight.color)}>
                      {getColorName(currentHighlight.color)}
                    </Badge>
                    <Badge variant="outline">
                      Page {currentHighlight.page}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className={`h-3 w-3 ${
                        currentHighlight.relevanceScore >= 0.9 ? 'text-yellow-500 fill-current' :
                        currentHighlight.relevanceScore >= 0.8 ? 'text-yellow-500' : 'text-gray-400'
                      }`} />
                      <span className="text-xs text-gray-500">
                        {Math.round(currentHighlight.relevanceScore * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        •••
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(currentHighlight.text);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Text
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onHighlightClick(currentHighlight);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Go to Page
                      </DropdownMenuItem>
                      {onRemoveHighlight && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveHighlight(currentHighlight.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="text-center">
                  <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                    <Eye className="h-3 w-3 mr-1" />
                    Click to {isFlipped ? 'show text' : 'show explanation'}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="min-h-[200px] flex items-center justify-center">
                  {!isFlipped ? (
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Highlighted Text
                      </h3>
                      <blockquote className="text-base leading-relaxed text-gray-700 dark:text-gray-300 border-l-4 border-gray-300 pl-4 italic">
                        "{currentHighlight.text}"
                      </blockquote>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Explanation & Context
                      </h3>
                      <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                        {currentHighlight.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Grid View */
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHighlights.map((highlight, index) => (
              <Card 
                key={highlight.id}
                className={`
                  cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                  ${getColorClasses(highlight.color)}
                `}
                onClick={() => onHighlightClick(highlight)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getColorBadge(highlight.color)} variant="secondary">
                      {getColorName(highlight.color)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Page {highlight.page}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <blockquote className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
                    "{highlight.text.length > 120 
                      ? highlight.text.substring(0, 120) + '...' 
                      : highlight.text}"
                  </blockquote>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className={`h-3 w-3 ${
                        highlight.relevanceScore >= 0.9 ? 'text-yellow-500 fill-current' :
                        highlight.relevanceScore >= 0.8 ? 'text-yellow-500' : 'text-gray-400'
                      }`} />
                      <span className="text-xs text-gray-500">
                        {Math.round(highlight.relevanceScore * 100)}%
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(highlight.text);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Maximize2 className="h-4 w-4" />
          Flashcards ({highlights.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Highlight Flashcards
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-6">
          <FlashcardContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}