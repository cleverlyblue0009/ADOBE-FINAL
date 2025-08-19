import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Grid3x3, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff,
  Shuffle,
  RotateCcw,
  Star,
  Search,
  Filter,
  BookOpen,
  Brain,
  Zap,
  Highlighter,
  ExternalLink
} from 'lucide-react';
import { Highlight } from './PDFReader';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  highlight: Highlight;
  difficulty: 'easy' | 'medium' | 'hard';
  mastery: number; // 0-100
  lastStudied?: Date;
}

interface HighlightsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: Highlight[];
  onHighlightClick?: (highlight: Highlight) => void;
}

export function HighlightsPopup({ isOpen, onClose, highlights, onHighlightClick }: HighlightsPopupProps) {
  const [view, setView] = useState<'grid' | 'flashcard'>('grid');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [studyMode, setStudyMode] = useState<'sequential' | 'random'>('sequential');

  // Generate flashcards from highlights
  useEffect(() => {
    const generateFlashcards = () => {
      const cards: Flashcard[] = highlights.map(highlight => ({
        id: highlight.id,
        question: generateQuestion(highlight),
        answer: highlight.text,
        highlight,
        difficulty: getDifficulty(highlight),
        mastery: Math.floor(Math.random() * 40) + 20, // Random initial mastery
        lastStudied: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random last studied
      }));
      
      setFlashcards(cards);
      setCurrentCardIndex(0);
      setShowAnswer(false);
    };

    if (highlights.length > 0) {
      generateFlashcards();
    }
  }, [highlights]);

  // Generate contextual questions
  const generateQuestion = (highlight: Highlight): string => {
    const text = highlight.text;
    const explanation = highlight.explanation;
    
    if (explanation) {
      if (explanation.toLowerCase().includes('definition')) {
        return `Define the concept highlighted in this passage:`;
      } else if (explanation.toLowerCase().includes('important')) {
        return `Why is this information considered important?`;
      } else if (explanation.toLowerCase().includes('example')) {
        return `What example is being provided here?`;
      } else {
        return `Explain the significance of this highlighted text:`;
      }
    }
    
    // Generate question based on text content and context
    if (text.length > 150) {
      return `Summarize the key points from this passage:`;
    } else if (text.includes('definition') || text.includes('means') || text.includes('is defined as')) {
      return `What is being defined here?`;
    } else if (text.includes('because') || text.includes('therefore') || text.includes('thus')) {
      return `What cause-and-effect relationship is described?`;
    } else if (text.includes('first') || text.includes('second') || text.includes('steps')) {
      return `What process or sequence is being outlined?`;
    } else {
      return `What is the main point of this highlighted information?`;
    }
  };

  // Determine difficulty
  const getDifficulty = (highlight: Highlight): 'easy' | 'medium' | 'hard' => {
    const textLength = highlight.text.length;
    const relevanceScore = highlight.relevanceScore;
    
    if (textLength < 80 && relevanceScore > 0.8) return 'easy';
    if (textLength > 200 || relevanceScore < 0.4) return 'hard';
    return 'medium';
  };

  // Filter flashcards
  const filteredFlashcards = flashcards.filter(card => {
    const matchesSearch = card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || card.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  // Navigation
  const nextCard = () => {
    if (studyMode === 'random') {
      setCurrentCardIndex(Math.floor(Math.random() * filteredFlashcards.length));
    } else {
      setCurrentCardIndex((prev) => (prev + 1) % filteredFlashcards.length);
    }
    setShowAnswer(false);
  };

  const previousCard = () => {
    if (studyMode === 'sequential') {
      setCurrentCardIndex((prev) => (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length);
    } else {
      setCurrentCardIndex(Math.floor(Math.random() * filteredFlashcards.length));
    }
    setShowAnswer(false);
  };

  const goToCard = (index: number) => {
    setCurrentCardIndex(index);
    setShowAnswer(false);
    setView('flashcard');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'text-green-600 dark:text-green-400';
    if (mastery >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getColorName = (color: Highlight['color']) => {
    switch (color) {
      case 'primary': return 'Important';
      case 'secondary': return 'Key Concept';
      case 'tertiary': return 'Reference';
      case 'yellow': return 'Note';
      case 'green': return 'Definition';
      case 'blue': return 'Example';
      case 'gold': return 'Critical';
      default: return 'Highlight';
    }
  };

  const getColorClasses = (color: Highlight['color']) => {
    switch (color) {
      case 'primary': return 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700';
      case 'secondary': return 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700';
      case 'tertiary': return 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700';
      case 'yellow': return 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700';
      case 'green': return 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700';
      case 'blue': return 'bg-cyan-50 border-cyan-300 dark:bg-cyan-950 dark:border-cyan-700';
      case 'gold': return 'bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-700';
      default: return 'bg-gray-50 border-gray-300 dark:bg-gray-950 dark:border-gray-700';
    }
  };

  const currentCard = filteredFlashcards[currentCardIndex];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Highlighter className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Highlights & Study Cards</h2>
                <p className="text-sm text-muted-foreground">Interactive flashcards from your highlighted content</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('grid')}
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Grid View
              </Button>
              <Button
                variant={view === 'flashcard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('flashcard')}
                disabled={filteredFlashcards.length === 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Study Mode
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredFlashcards.length} cards
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border-subtle bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Search highlights and flashcards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as any)}
              className="px-3 py-2 border border-border-subtle rounded-md bg-background text-sm"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {view === 'flashcard' && filteredFlashcards.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStudyMode(studyMode === 'sequential' ? 'random' : 'sequential')}
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {studyMode === 'sequential' ? 'Sequential' : 'Random'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentCardIndex(0);
                    setShowAnswer(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === 'grid' ? (
            // Grid View - Shows highlights as cards
            <div className="h-full overflow-auto p-6">
              {filteredFlashcards.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Highlighter className="h-16 w-16 text-text-secondary mb-4" />
                  <h3 className="text-lg font-medium mb-2">No highlights available</h3>
                  <p className="text-text-secondary">
                    Use AI Highlights in the PDF viewer to generate intelligent highlights
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFlashcards.map((card, index) => (
                    <Card 
                      key={card.id} 
                      className={`cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${getColorClasses(card.highlight.color)}`}
                      onClick={() => {
                        if (onHighlightClick) {
                          onHighlightClick(card.highlight);
                        }
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getDifficultyColor(card.difficulty)}>
                            {card.difficulty}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Page {card.highlight.page}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getColorName(card.highlight.color)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                card.highlight.relevanceScore >= 0.9 ? 'bg-green-500' :
                                card.highlight.relevanceScore >= 0.8 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(card.highlight.relevanceScore * 100)}% relevance
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span className={`text-xs ${getMasteryColor(card.mastery)}`}>
                              {card.mastery}%
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-text-primary line-clamp-4 mb-3 leading-relaxed">
                          "{card.answer}"
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {card.highlight.explanation}
                        </p>
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToCard(index);
                            }}
                            className="text-xs"
                          >
                            <Brain className="h-3 w-3 mr-1" />
                            Study Card
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onHighlightClick) {
                                onHighlightClick(card.highlight);
                              }
                            }}
                            className="text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Go to Page
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Flashcard Study Mode
            <div className="h-full flex items-center justify-center p-6">
              {currentCard ? (
                <div className="w-full max-w-3xl">
                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
                      <span>Card {currentCardIndex + 1} of {filteredFlashcards.length}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(currentCard.difficulty)}>
                          {currentCard.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          Page {currentCard.highlight.page}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span className={getMasteryColor(currentCard.mastery)}>
                            {currentCard.mastery}%
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${((currentCardIndex + 1) / filteredFlashcards.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Flashcard */}
                  <Card className={`min-h-[500px] flex flex-col border-l-4 ${getColorClasses(currentCard.highlight.color)}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {showAnswer ? 'Answer' : 'Question'}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getColorName(currentCard.highlight.color)}
                          </Badge>
                          <Badge variant="outline">
                            Page {currentCard.highlight.page}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex-1 mb-6">
                        {showAnswer ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm font-medium mb-2">Highlighted Text:</p>
                              <p className="leading-relaxed text-base">
                                "{currentCard.answer}"
                              </p>
                            </div>
                            
                            {currentCard.highlight.explanation && (
                              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">
                                  Why This Matters:
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                  {currentCard.highlight.explanation}
                                </p>
                              </div>
                            )}
                            
                            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                              <p className="text-sm font-medium mb-2 text-green-800 dark:text-green-200">
                                Relevance Score:
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-green-200 dark:bg-green-800 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${currentCard.highlight.relevanceScore * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                  {Math.round(currentCard.highlight.relevanceScore * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 bg-muted rounded-lg flex items-center justify-center min-h-[300px]">
                            <p className="text-xl text-center leading-relaxed font-medium">
                              {currentCard.question}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <Button
                          onClick={previousCard}
                          variant="outline"
                          size="sm"
                          disabled={filteredFlashcards.length <= 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              if (onHighlightClick) {
                                onHighlightClick(currentCard.highlight);
                              }
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Go to Page {currentCard.highlight.page}
                          </Button>
                          
                          <Button
                            onClick={() => setShowAnswer(!showAnswer)}
                            variant={showAnswer ? "secondary" : "default"}
                            size="lg"
                          >
                            {showAnswer ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Answer
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show Answer
                              </>
                            )}
                          </Button>
                        </div>
                        
                        <Button
                          onClick={nextCard}
                          variant="outline"
                          size="sm"
                          disabled={filteredFlashcards.length <= 1}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center">
                  <Zap className="h-16 w-16 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No cards to study</h3>
                  <p className="text-text-secondary">
                    Try adjusting your search or filter settings
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {highlights.length > 0 && (
          <div className="p-4 border-t border-border-subtle bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Highlighter className="h-4 w-4" />
                <span>{highlights.length} highlights</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span>{flashcards.length} study cards</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{new Set(highlights.map(h => h.page)).size} pages covered</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <span>Avg. Relevance: </span>
              <span className="font-medium">
                {Math.round(
                  highlights.reduce((acc, h) => acc + h.relevanceScore, 0) / highlights.length * 100
                )}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}