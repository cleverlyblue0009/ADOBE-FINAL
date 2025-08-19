import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, X, Sparkles, TrendingUp, BookOpen, Clock } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DidYouKnowFact {
  id: string;
  fact: string;
  source_type: 'research' | 'statistic' | 'historical' | 'trending';
  relevance_explanation: string;
  tags?: string[];
}

interface DidYouKnowPopupProps {
  facts: DidYouKnowFact[];
  isVisible?: boolean;
  className?: string;
}

const getSourceTypeIcon = (sourceType: string) => {
  switch (sourceType) {
    case 'research': return <BookOpen className="h-4 w-4 text-blue-600" />;
    case 'statistic': return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'historical': return <Clock className="h-4 w-4 text-amber-600" />;
    case 'trending': return <Sparkles className="h-4 w-4 text-purple-600" />;
    default: return <Lightbulb className="h-4 w-4 text-gray-600" />;
  }
};

const getSourceTypeColor = (sourceType: string) => {
  switch (sourceType) {
    case 'research': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'statistic': return 'bg-green-100 text-green-800 border-green-200';
    case 'historical': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'trending': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function DidYouKnowPopup({ facts, isVisible = true, className = "" }: DidYouKnowPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isGlowing, setIsGlowing] = useState(true);

  // Cycle through facts if there are multiple
  useEffect(() => {
    if (facts.length > 1) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % facts.length);
      }, 5000); // Change fact every 5 seconds when popup is open

      return () => clearInterval(interval);
    }
  }, [facts.length, isOpen]);

  // Stop glowing after popup is opened once
  useEffect(() => {
    if (isOpen) {
      setIsGlowing(false);
    }
  }, [isOpen]);

  if (!isVisible || facts.length === 0) {
    return null;
  }

  const currentFact = facts[currentFactIndex];

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`
              h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110
              ${isGlowing 
                ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 animate-pulse shadow-yellow-400/50' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              }
            `}
            title="Did You Know? - Interesting Facts"
          >
            <Lightbulb className={`h-6 w-6 text-white ${isGlowing ? 'animate-bounce' : ''}`} />
            {isGlowing && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-ping" />
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="left" 
          className="w-80 p-0 border-0 shadow-2xl"
          sideOffset={10}
        >
          <Card className="border-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  Did You Know?
                </CardTitle>
                <div className="flex items-center gap-2">
                  {facts.length > 1 && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {currentFactIndex + 1} of {facts.length}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0 hover:bg-white/20 text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                    {getSourceTypeIcon(currentFact.source_type)}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 font-medium ${getSourceTypeColor(currentFact.source_type)}`}
                  >
                    {currentFact.source_type.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border-l-4 border-l-blue-400">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                    {currentFact.fact}
                  </p>
                </div>
                
                <div className="bg-blue-50/50 dark:bg-blue-950/50 p-2 rounded border-l-2 border-l-blue-300">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Why this matters:</span> {currentFact.relevance_explanation}
                  </p>
                </div>
                
                {currentFact.tags && currentFact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentFact.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-2 py-0.5 bg-purple-50 border-purple-200 text-purple-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {facts.length > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentFactIndex((prev) => (prev - 1 + facts.length) % facts.length)}
                    className="text-xs"
                  >
                    ← Previous
                  </Button>
                  <div className="flex gap-1">
                    {facts.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full transition-all duration-200 ${
                          index === currentFactIndex 
                            ? 'bg-blue-600 scale-125' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentFactIndex((prev) => (prev + 1) % facts.length)}
                    className="text-xs"
                  >
                    Next →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}