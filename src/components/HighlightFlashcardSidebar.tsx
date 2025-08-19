import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff,
  Shuffle,
  RotateCcw,
  Star
} from 'lucide-react';
import { TextLayerHighlight } from '@/lib/textbookHighlighter';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  highlight: TextLayerHighlight;
  isFlipped: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface HighlightFlashcardSidebarProps {
  highlights: TextLayerHighlight[];
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function HighlightFlashcardSidebar({ 
  highlights, 
  isVisible, 
  onToggleVisibility 
}: HighlightFlashcardSidebarProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState<'sequential' | 'random'>('sequential');

  // Generate flashcards from highlights
  useEffect(() => {
    const generateFlashcards = () => {
      const cards: Flashcard[] = highlights.map(highlight => ({
        id: highlight.id,
        question: generateQuestion(highlight),
        answer: highlight.text,
        highlight,
        isFlipped: false,
        difficulty: getDifficulty(highlight)
      }));
      
      setFlashcards(cards);
      setCurrentCardIndex(0);
      setShowAnswer(false);
    };

    if (highlights.length > 0) {
      generateFlashcards();
    }
  }, [highlights]);

  // Generate question from highlight
  const generateQuestion = (highlight: TextLayerHighlight): string => {
    const text = highlight.text;
    const explanation = highlight.explanation;
    
    if (explanation) {
      return `What does this highlighted text mean? (Context: ${explanation})`;
    }
    
    // Generate question based on text content
    if (text.length > 100) {
      return `Summarize the key points from this highlighted passage:`;
    } else if (text.includes('definition') || text.includes('means') || text.includes('is')) {
      return `What is being defined in this highlighted text?`;
    } else {
      return `What is the significance of this highlighted information?`;
    }
  };

  // Determine difficulty based on highlight properties
  const getDifficulty = (highlight: TextLayerHighlight): 'easy' | 'medium' | 'hard' => {
    const textLength = highlight.text.length;
    const relevanceScore = highlight.relevanceScore || 0.5;
    
    if (textLength < 50 && relevanceScore > 0.8) return 'easy';
    if (textLength > 200 || relevanceScore < 0.4) return 'hard';
    return 'medium';
  };

  // Navigation functions
  const nextCard = () => {
    if (studyMode === 'random') {
      setCurrentCardIndex(Math.floor(Math.random() * flashcards.length));
    } else {
      setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
    }
    setShowAnswer(false);
  };

  const previousCard = () => {
    if (studyMode === 'sequential') {
      setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    } else {
      setCurrentCardIndex(Math.floor(Math.random() * flashcards.length));
    }
    setShowAnswer(false);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const shuffleCards = () => {
    setStudyMode(studyMode === 'sequential' ? 'random' : 'sequential');
  };

  const resetStudy = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setStudyMode('sequential');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentCard = flashcards[currentCardIndex];

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleVisibility}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 rounded-l-lg rounded-r-none"
        variant="outline"
        size="sm"
      >
        <BookOpen className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border-subtle shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Flashcards
          </h2>
          <Button
            onClick={onToggleVisibility}
            variant="ghost"
            size="sm"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>{flashcards.length} cards from highlights</span>
          <Badge variant="outline">
            Page {currentCard?.highlight.pageNumber || 1}
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              onClick={shuffleCards}
              variant="outline"
              size="sm"
              title={`Switch to ${studyMode === 'sequential' ? 'random' : 'sequential'} mode`}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={resetStudy}
              variant="outline"
              size="sm"
              title="Reset to first card"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-text-secondary">
            {currentCardIndex + 1} of {flashcards.length}
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 p-4 flex flex-col">
        {currentCard ? (
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {showAnswer ? 'Answer' : 'Question'}
                </CardTitle>
                <Badge className={getDifficultyColor(currentCard.difficulty)}>
                  {currentCard.difficulty}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 mb-4">
                {showAnswer ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Highlighted Text:</p>
                      <p className="text-sm leading-relaxed">
                        {currentCard.answer}
                      </p>
                    </div>
                    
                    {currentCard.highlight.explanation && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium mb-2 text-blue-800">
                          Context:
                        </p>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          {currentCard.highlight.explanation}
                        </p>
                      </div>
                    )}
                    
                    {currentCard.highlight.relevanceScore && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Star className="h-4 w-4" />
                        Relevance: {Math.round(currentCard.highlight.relevanceScore * 100)}%
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {currentCard.question}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <Button
                  onClick={previousCard}
                  variant="outline"
                  size="sm"
                  disabled={flashcards.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={toggleAnswer}
                  variant={showAnswer ? "secondary" : "default"}
                  size="sm"
                  className="flex-1 mx-2"
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
                
                <Button
                  onClick={nextCard}
                  variant="outline"
                  size="sm"
                  disabled={flashcards.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <CardContent className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-text-secondary" />
              <p className="text-text-secondary">
                No highlights available for flashcards.
              </p>
              <p className="text-sm text-text-secondary mt-2">
                Highlights will appear here as flashcards when AI generates them.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Study Progress */}
      {flashcards.length > 0 && (
        <div className="p-4 border-t border-border-subtle">
          <div className="text-xs text-text-secondary mb-2">Study Progress</div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-brand-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentCardIndex + 1) / flashcards.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}