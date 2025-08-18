import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Lightbulb,
  BookOpen,
  Star,
  ArrowRight,
  Eye,
  Trash2,
  Copy,
  Bookmark,
  Zap,
  Brain,
  Target,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Highlight } from './PDFReader';

interface EnhancedHighlightFlashcardsProps {
  highlights: Highlight[];
  onHighlightClick: (highlight: Highlight) => void;
  onRemoveHighlight: (highlightId: string) => void;
  onGenerateMore?: () => void;
  currentPage?: number;
  persona?: string;
  jobToBeDone?: string;
}

interface FlashcardData extends Highlight {
  category: 'key-insight' | 'important-fact' | 'actionable' | 'question' | 'definition';
  learningTip?: string;
  relatedConcepts?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  studyProgress: number; // 0-100
}

export function EnhancedHighlightFlashcards({
  highlights,
  onHighlightClick,
  onRemoveHighlight,
  onGenerateMore,
  currentPage = 1,
  persona,
  jobToBeDone
}: EnhancedHighlightFlashcardsProps) {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const { toast } = useToast();

  // Convert highlights to flashcards with enhanced data
  useEffect(() => {
    const enhancedFlashcards: FlashcardData[] = highlights.map((highlight, index) => ({
      ...highlight,
      category: getCategoryFromRelevance(highlight.relevanceScore),
      learningTip: generateLearningTip(highlight, persona, jobToBeDone),
      relatedConcepts: generateRelatedConcepts(highlight.text),
      difficulty: getDifficultyLevel(highlight.text),
      studyProgress: Math.min(Math.round(highlight.relevanceScore * 100), 95) // Based on relevance score
    }));
    
    setFlashcards(enhancedFlashcards);
  }, [highlights, persona, jobToBeDone]);

  const getCategoryFromRelevance = (score: number): FlashcardData['category'] => {
    if (score >= 0.9) return 'key-insight';
    if (score >= 0.8) return 'important-fact';
    if (score >= 0.7) return 'actionable';
    if (score >= 0.6) return 'question';
    return 'definition';
  };

  const generateLearningTip = (highlight: Highlight, persona?: string, jobToBeDone?: string): string => {
    const text = highlight.text.toLowerCase();
    const keyWords = text.split(' ').filter(word => word.length > 4);
    
    // Generate contextual tips based on highlight content and persona
    if (text.includes('important') || text.includes('key') || text.includes('critical')) {
      return `This appears to be a critical concept for ${persona || 'professionals'} working on ${jobToBeDone || 'similar objectives'}. Consider how it impacts your current approach.`;
    }
    
    if (text.includes('process') || text.includes('method') || text.includes('approach')) {
      return `This process-related information could be directly applicable to your ${jobToBeDone || 'work'}. Think about implementation steps.`;
    }
    
    if (text.includes('data') || text.includes('research') || text.includes('study')) {
      return `As a ${persona || 'professional'}, consider how this evidence supports or challenges your current understanding.`;
    }
    
    if (keyWords.length > 0) {
      return `Focus on how the concept of "${keyWords[0]}" relates to your role as ${persona || 'a professional'} and your ${jobToBeDone || 'objectives'}.`;
    }
    
    return `Consider the practical implications of this information for your work as ${persona || 'a professional'} focused on ${jobToBeDone || 'your goals'}.`;
  };

  const generateRelatedConcepts = (text: string): string[] => {
    // Extract key terms and generate related concepts
    const words = text.split(' ').filter(word => word.length > 4);
    return words.slice(0, 3).map(word => word.charAt(0).toUpperCase() + word.slice(1));
  };

  const getDifficultyLevel = (text: string): FlashcardData['difficulty'] => {
    const wordCount = text.split(' ').length;
    if (wordCount > 50) return 'hard';
    if (wordCount > 25) return 'medium';
    return 'easy';
  };

  const filteredFlashcards = filterCategory === 'all' 
    ? flashcards 
    : flashcards.filter(card => card.category === filterCategory);

  const currentCard = filteredFlashcards[currentCardIndex];

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % filteredFlashcards.length);
    setShowBack(false);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length);
    setShowBack(false);
  };

  const getCategoryIcon = (category: FlashcardData['category']) => {
    switch (category) {
      case 'key-insight': return <Lightbulb className="h-4 w-4" />;
      case 'important-fact': return <BookOpen className="h-4 w-4" />;
      case 'actionable': return <Target className="h-4 w-4" />;
      case 'question': return <Brain className="h-4 w-4" />;
      case 'definition': return <Star className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: FlashcardData['category']) => {
    switch (category) {
      case 'key-insight': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'important-fact': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'actionable': return 'bg-green-100 text-green-800 border-green-200';
      case 'question': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'definition': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: FlashcardData['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (flashcards.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Flashcards
          </CardTitle>
          <CardDescription>
            AI-generated flashcards from your highlights
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">No flashcards yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Highlight important text to generate smart flashcards
              </p>
            </div>
            {onGenerateMore && (
              <Button onClick={onGenerateMore} className="gap-2">
                <Zap className="h-4 w-4" />
                Generate Smart Highlights
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-primary" />
            <h3 className="font-semibold">Smart Flashcards</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredFlashcards.length} cards
          </Badge>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1">
          {['all', 'key-insight', 'important-fact', 'actionable', 'question', 'definition'].map((category) => (
            <Button
              key={category}
              variant={filterCategory === category ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setFilterCategory(category);
                setCurrentCardIndex(0);
                setShowBack(false);
              }}
              className="h-7 px-2 text-xs capitalize"
            >
              {category.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Study Mode Toggle */}
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <Button
            variant={studyMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setStudyMode(!studyMode)}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            Study Mode
          </Button>
          {onGenerateMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerateMore}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Generate More
            </Button>
          )}
        </div>
      </div>

      {/* Flashcard Display */}
      {studyMode && currentCard ? (
        <ScrollArea className="flex-1">
          <div className="p-4">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevCard}
              disabled={filteredFlashcards.length <= 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              {currentCardIndex + 1} of {filteredFlashcards.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextCard}
              disabled={filteredFlashcards.length <= 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Flashcard */}
          <Card className={`mb-4 cursor-pointer transition-all duration-300 ${showBack ? 'scale-105' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className={`${getCategoryColor(currentCard.category)} gap-1`}>
                  {getCategoryIcon(currentCard.category)}
                  {currentCard.category.replace('-', ' ')}
                </Badge>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getDifficultyColor(currentCard.difficulty)}>
                    {currentCard.difficulty}
                  </Badge>
                  <span className="text-xs text-gray-500">Page {currentCard.page}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent 
              className="min-h-[200px] flex items-center justify-center cursor-pointer"
              onClick={() => setShowBack(!showBack)}
            >
              {!showBack ? (
                <div className="text-center">
                  <div className="text-lg font-medium mb-4 leading-relaxed">
                    {currentCard.text}
                  </div>
                  <p className="text-sm text-gray-500">Click to reveal insights</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Key Insight</h4>
                    <p className="text-sm text-blue-800">{currentCard.explanation}</p>
                  </div>
                  
                  {currentCard.learningTip && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Learning Tip</h4>
                      <p className="text-sm text-yellow-800">{currentCard.learningTip}</p>
                    </div>
                  )}
                  
                  {currentCard.relatedConcepts && currentCard.relatedConcepts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Related Concepts</h4>
                      <div className="flex flex-wrap gap-1">
                        {currentCard.relatedConcepts.map((concept, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onHighlightClick(currentCard)}
              className="flex-1 gap-2"
            >
              <Eye className="h-4 w-4" />
              View in PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(currentCard.text);
                toast({
                  title: "Copied",
                  description: "Flashcard content copied to clipboard",
                });
              }}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveHighlight(currentCard.id)}
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          </div>
        </ScrollArea>
      ) : (
        /* List View */
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredFlashcards.map((flashcard, index) => (
              <Card
                key={flashcard.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  currentPage === flashcard.page ? 'ring-2 ring-brand-primary' : ''
                }`}
                onClick={() => onHighlightClick(flashcard)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${getCategoryColor(flashcard.category)} gap-1 text-xs`}>
                      {getCategoryIcon(flashcard.category)}
                      {flashcard.category.replace('-', ' ')}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Page {flashcard.page}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getDifficultyColor(flashcard.difficulty)}`}>
                        {flashcard.difficulty}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {flashcard.text}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-gray-500">
                          {Math.round(flashcard.relevanceScore * 100)}% relevant
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentCardIndex(index);
                          setStudyMode(true);
                        }}
                        className="h-6 w-6 p-0"
                        title="Study this card"
                      >
                        <BookOpen className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveHighlight(flashcard.id);
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        title="Remove highlight"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}