import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Lightbulb,
  X,
  Sparkles,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface ExternalFact {
  fact: string;
  topic: string;
  category: string;
  page_number?: number;
}

interface DidYouKnowPopupProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  pageNumber: number;
  pageText?: string;
  onFactGenerated?: (fact: ExternalFact) => void;
}

export function DidYouKnowPopup({
  isOpen,
  onClose,
  documentId,
  pageNumber,
  pageText,
  onFactGenerated
}: DidYouKnowPopupProps) {
  const [fact, setFact] = useState<ExternalFact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category emojis and colors
  const categoryConfig = {
    science: { emoji: '🔬', color: 'bg-blue-100 text-blue-800', label: 'Science' },
    history: { emoji: '📜', color: 'bg-amber-100 text-amber-800', label: 'History' },
    technology: { emoji: '💻', color: 'bg-purple-100 text-purple-800', label: 'Technology' },
    nature: { emoji: '🌿', color: 'bg-green-100 text-green-800', label: 'Nature' },
    culture: { emoji: '🎭', color: 'bg-pink-100 text-pink-800', label: 'Culture' },
    other: { emoji: '💡', color: 'bg-gray-100 text-gray-800', label: 'General' }
  };

  // Load existing fact or generate new one when popup opens
  useEffect(() => {
    if (isOpen && documentId && pageNumber !== undefined) {
      loadOrGenerateFact();
    }
  }, [isOpen, documentId, pageNumber]);

  const loadOrGenerateFact = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, try to get existing facts for this page
      const response = await fetch(`/api/documents/${documentId}/facts/page/${pageNumber}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.facts && data.facts.length > 0) {
          setFact(data.facts[0]); // Use the first available fact
          return;
        }
      }

      // If no existing facts, generate a new one
      if (pageText) {
        await generateNewFact();
      } else {
        setError('No content available to generate facts from');
      }

    } catch (err) {
      console.error('Error loading fact:', err);
      setError('Failed to load interesting facts for this page');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewFact = async () => {
    if (!pageText) {
      setError('No page content available');
      return;
    }

    try {
      const response = await fetch('/api/documents/generate-page-fact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          page_number: pageNumber,
          page_text: pageText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate fact');
      }

      const data = await response.json();
      
      if (data.fact) {
        setFact(data.fact);
        onFactGenerated?.(data.fact);
      } else {
        setError('No interesting facts could be generated for this page');
      }

    } catch (err) {
      console.error('Error generating fact:', err);
      setError('Failed to generate an interesting fact for this page');
    }
  };

  const getCategoryConfig = (category: string) => {
    return categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.other;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {/* Glowing bulb animation */}
            <div className="relative">
              <Lightbulb className="h-6 w-6 text-yellow-500 animate-pulse" />
              <div className="absolute inset-0 h-6 w-6 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
              <div className="absolute inset-0 h-6 w-6 bg-yellow-300 rounded-full opacity-10 animate-pulse animation-delay-75"></div>
            </div>
            <span className="bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent font-bold">
              Did You Know?
            </span>
            <Sparkles className="h-4 w-4 text-yellow-500 animate-bounce" />
          </DialogTitle>
          <DialogDescription>
            Fascinating facts related to page {pageNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <div className="absolute inset-0 h-8 w-8 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
              </div>
              <span className="ml-3 text-sm text-gray-600 animate-pulse">
                Discovering amazing facts...
              </span>
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-700">
                  <X className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </CardContent>
            </Card>
          ) : fact ? (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={`${getCategoryConfig(fact.category).color} shadow-sm`}
                  >
                    {getCategoryConfig(fact.category).emoji} {getCategoryConfig(fact.category).label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateNewFact()}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 hover:bg-white/50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : 'hover:rotate-180 transition-transform duration-300'}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0 mt-1">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <div className="absolute inset-0 h-5 w-5 bg-yellow-400 rounded-full opacity-30 animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">
                        {fact.fact}
                      </p>
                    </div>
                  </div>
                  
                  {fact.topic && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Related to: <span className="font-medium text-gray-700">{fact.topic}</span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generateNewFact()}
              disabled={isLoading || !pageText}
              className="text-xs hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Generate New Fact
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs hover:bg-gray-50 transition-colors"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing the Did You Know popup
export function useDidYouKnowPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<{
    documentId: string;
    pageNumber: number;
    pageText?: string;
  } | null>(null);

  const showPopup = (documentId: string, pageNumber: number, pageText?: string) => {
    setCurrentPage({ documentId, pageNumber, pageText });
    setIsOpen(true);
  };

  const hidePopup = () => {
    setIsOpen(false);
    setCurrentPage(null);
  };

  return {
    isOpen,
    currentPage,
    showPopup,
    hidePopup
  };
}