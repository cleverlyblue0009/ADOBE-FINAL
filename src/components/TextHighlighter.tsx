// Enhanced Text Highlighter Component
// Integrates intelligent text analysis with PDF highlighting

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Target, 
  BarChart3, 
  BookOpen, 
  CheckCircle,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { highlightEngine } from '@/lib/highlightEngine';
import { textAnalysisService } from '@/lib/textAnalysis';
import { Highlight } from './PDFReader';

interface TextHighlighterProps {
  documentText: string;
  pageTexts: Map<number, string>;
  currentPage: number;
  persona?: string;
  jobToBeDone?: string;
  onHighlightsGenerated: (highlights: Highlight[]) => void;
  existingHighlights: Highlight[];
}

interface HighlightStats {
  total: number;
  byType: Record<string, number>;
  qualityScore: number;
  coverage: number;
}

export function TextHighlighter({
  documentText,
  pageTexts,
  currentPage,
  persona,
  jobToBeDone,
  onHighlightsGenerated,
  existingHighlights
}: TextHighlighterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [highlightStats, setHighlightStats] = useState<HighlightStats | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(['key-concept', 'statistic', 'definition', 'action-item', 'conclusion'])
  );
  const { toast } = useToast();

  // Calculate highlight statistics
  useEffect(() => {
    if (existingHighlights.length > 0) {
      calculateStats();
    }
  }, [existingHighlights]);

  const calculateStats = () => {
    const analysis = highlightEngine.analyzeExistingHighlights(
      existingHighlights, 
      documentText
    );

    const byType = existingHighlights.reduce((acc, highlight) => {
      // Try to determine type from existing highlights
      const smartHighlight = highlightEngine.fromRegularHighlights([highlight])[0];
      const type = smartHighlight.contentType || 'key-concept';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalPages = pageTexts.size;
    const highlightedPages = new Set(existingHighlights.map(h => h.page)).size;
    const coverage = totalPages > 0 ? (highlightedPages / totalPages) * 100 : 0;

    setHighlightStats({
      total: existingHighlights.length,
      byType,
      qualityScore: analysis.qualityScore,
      coverage: Math.round(coverage)
    });
  };

  const generateSmartHighlights = useCallback(async () => {
    if (!documentText || pageTexts.size === 0) {
      toast({
        title: "No Content Available",
        description: "Please ensure the document is fully loaded before generating highlights.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate smart highlights using the enhanced engine
      const smartHighlights = highlightEngine.generateSmartHighlights(
        documentText,
        pageTexts,
        persona,
        jobToBeDone
      );

      // Filter by selected types
      const filteredHighlights = smartHighlights.filter(h => 
        selectedTypes.has(h.contentType)
      );

      // Remove duplicates and merge with existing highlights
      const deduplicatedHighlights = highlightEngine.deduplicateHighlights([
        ...highlightEngine.fromRegularHighlights(existingHighlights),
        ...filteredHighlights
      ]);

      // Convert back to regular highlights for compatibility
      const finalHighlights = deduplicatedHighlights.map(h => 
        highlightEngine.toRegularHighlight(h)
      );

      onHighlightsGenerated(finalHighlights);
      
      toast({
        title: "Smart Highlights Generated",
        description: `Generated ${filteredHighlights.length} intelligent highlights based on your preferences.`,
      });

      // Update stats
      setTimeout(calculateStats, 500);
      
    } catch (error) {
      console.error('Error generating smart highlights:', error);
      toast({
        title: "Highlight Generation Failed",
        description: "Failed to generate smart highlights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [documentText, pageTexts, persona, jobToBeDone, selectedTypes, existingHighlights, onHighlightsGenerated, toast]);

  const generatePageHighlights = useCallback(async () => {
    const currentPageText = pageTexts.get(currentPage);
    if (!currentPageText) {
      toast({
        title: "No Page Content",
        description: "Current page content is not available.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get surrounding context (previous and next pages)
      const prevPageText = pageTexts.get(currentPage - 1) || '';
      const nextPageText = pageTexts.get(currentPage + 1) || '';
      const context = `${prevPageText.slice(-200)} ${currentPageText} ${nextPageText.slice(0, 200)}`;

      // Generate contextual highlights for current page
      const pageHighlights = highlightEngine.generateContextualHighlights(
        currentPageText,
        context,
        currentPage,
        persona,
        jobToBeDone
      );

      // Filter by selected types
      const filteredHighlights = pageHighlights.filter(h => 
        selectedTypes.has(h.contentType)
      );

      if (filteredHighlights.length === 0) {
        toast({
          title: "No Highlights Found",
          description: "No relevant content found on this page with the selected criteria.",
        });
        return;
      }

      // Merge with existing highlights
      const mergedHighlights = [...existingHighlights, ...filteredHighlights.map(h => 
        highlightEngine.toRegularHighlight(h)
      )];

      onHighlightsGenerated(mergedHighlights);

      toast({
        title: "Page Highlights Added",
        description: `Added ${filteredHighlights.length} highlights to page ${currentPage}.`,
      });

      setTimeout(calculateStats, 500);

    } catch (error) {
      console.error('Error generating page highlights:', error);
      toast({
        title: "Page Highlight Failed",
        description: "Failed to generate highlights for this page.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [currentPage, pageTexts, persona, jobToBeDone, selectedTypes, existingHighlights, onHighlightsGenerated, toast]);

  const toggleHighlightType = (type: string) => {
    const newSelectedTypes = new Set(selectedTypes);
    if (newSelectedTypes.has(type)) {
      newSelectedTypes.delete(type);
    } else {
      newSelectedTypes.add(type);
    }
    setSelectedTypes(newSelectedTypes);
  };

  const highlightTypeConfig = {
    'key-concept': { label: 'Key Concepts', icon: Target, color: 'bg-yellow-100 text-yellow-800' },
    'statistic': { label: 'Statistics', icon: BarChart3, color: 'bg-blue-100 text-blue-800' },
    'definition': { label: 'Definitions', icon: BookOpen, color: 'bg-green-100 text-green-800' },
    'action-item': { label: 'Action Items', icon: CheckCircle, color: 'bg-orange-100 text-orange-800' },
    'conclusion': { label: 'Conclusions', icon: Zap, color: 'bg-purple-100 text-purple-800' }
  };

  return (
    <div className="space-y-4 p-4 bg-surface-elevated rounded-lg border border-border-subtle">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-primary" />
          <h3 className="font-semibold text-text-primary">Smart Highlighting</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-1"
        >
          {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showAdvanced ? 'Simple' : 'Advanced'}
        </Button>
      </div>

      {/* Highlight Statistics */}
      {highlightStats && (
        <div className="grid grid-cols-3 gap-3 p-3 bg-background rounded-md">
          <div className="text-center">
            <div className="text-lg font-bold text-text-primary">{highlightStats.total}</div>
            <div className="text-xs text-text-secondary">Total Highlights</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-brand-primary">{highlightStats.qualityScore}%</div>
            <div className="text-xs text-text-secondary">Quality Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-text-primary">{highlightStats.coverage}%</div>
            <div className="text-xs text-text-secondary">Page Coverage</div>
          </div>
        </div>
      )}

      {/* Highlight Type Selection */}
      {showAdvanced && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Select Highlight Types:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(highlightTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              const isSelected = selectedTypes.has(type);
              const count = highlightStats?.byType[type] || 0;
              
              return (
                <button
                  key={type}
                  onClick={() => toggleHighlightType(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' 
                      : 'border-border-subtle bg-background text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{config.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={generateSmartHighlights}
          disabled={isGenerating || selectedTypes.size === 0}
          className="flex-1 gap-2"
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate All
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={generatePageHighlights}
          disabled={isGenerating || selectedTypes.size === 0}
          className="gap-2"
        >
          <Target className="h-4 w-4" />
          Current Page
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-text-tertiary space-y-1">
        <p>
          <strong>Generate All:</strong> Analyzes the entire document to create intelligent highlights.
        </p>
        <p>
          <strong>Current Page:</strong> Focuses on highlighting relevant content on the current page only.
        </p>
        {persona && jobToBeDone && (
          <p className="text-brand-primary">
            Optimized for <strong>{persona}</strong> working on <strong>{jobToBeDone}</strong>
          </p>
        )}
      </div>
    </div>
  );
}