// Interactive Word Hover System with "Do You Know?" Popups
// Provides contextual definitions and explanations for complex terms

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  BookOpen, 
  ExternalLink, 
  X,
  Lightbulb,
  Brain
} from 'lucide-react';
import { textAnalysisService } from '@/lib/textAnalysis';

interface TooltipData {
  term: string;
  definition: string;
  context: string;
  relatedTerms: string[];
  examples?: string[];
  source?: string;
}

interface HoverTooltipProps {
  isEnabled: boolean;
  documentContext?: string;
  onTermLookup?: (term: string) => void;
}

interface TooltipState {
  visible: boolean;
  position: { x: number; y: number };
  data: TooltipData | null;
  loading: boolean;
}

export function HoverTooltip({ 
  isEnabled, 
  documentContext = '',
  onTermLookup 
}: HoverTooltipProps) {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    position: { x: 0, y: 0 },
    data: null,
    loading: false
  });
  
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Knowledge base for common terms (in a real app, this would come from an API)
  const knowledgeBase = new Map<string, TooltipData>([
    ['algorithm', {
      term: 'Algorithm',
      definition: 'A step-by-step procedure or formula for solving a problem or completing a task.',
      context: 'In computing and mathematics, algorithms are fundamental building blocks for processing data and making decisions.',
      relatedTerms: ['data structure', 'complexity', 'optimization'],
      examples: ['Sorting algorithms (bubble sort, quicksort)', 'Search algorithms (binary search)', 'Machine learning algorithms'],
      source: 'Computer Science Fundamentals'
    }],
    ['methodology', {
      term: 'Methodology',
      definition: 'A system of methods used in a particular area of study or activity.',
      context: 'Research methodology refers to the systematic approach used to conduct research and gather information.',
      relatedTerms: ['framework', 'approach', 'protocol'],
      examples: ['Quantitative methodology', 'Qualitative methodology', 'Mixed-methods approach'],
      source: 'Research Methods'
    }],
    ['framework', {
      term: 'Framework',
      definition: 'A basic structure underlying a system, concept, or text; a set of principles or rules.',
      context: 'Frameworks provide a foundation for developing applications, conducting research, or organizing thoughts.',
      relatedTerms: ['methodology', 'architecture', 'structure'],
      examples: ['Software frameworks (React, Angular)', 'Theoretical frameworks', 'Conceptual frameworks'],
      source: 'General Knowledge'
    }],
    ['paradigm', {
      term: 'Paradigm',
      definition: 'A typical example or pattern of something; a model or framework for understanding.',
      context: 'Paradigms represent fundamental assumptions and approaches within a field of study.',
      relatedTerms: ['model', 'framework', 'worldview'],
      examples: ['Scientific paradigm', 'Programming paradigm', 'Educational paradigm'],
      source: 'Philosophy of Science'
    }],
    ['optimization', {
      term: 'Optimization',
      definition: 'The action of making the best or most effective use of a situation or resource.',
      context: 'In various fields, optimization involves finding the best solution from all feasible solutions.',
      relatedTerms: ['efficiency', 'algorithm', 'performance'],
      examples: ['Code optimization', 'Resource optimization', 'Mathematical optimization'],
      source: 'Operations Research'
    }],
    ['infrastructure', {
      term: 'Infrastructure',
      definition: 'The basic physical and organizational structures and facilities needed for operation.',
      context: 'Infrastructure provides the foundation upon which systems, organizations, or technologies operate.',
      relatedTerms: ['architecture', 'foundation', 'system'],
      examples: ['IT infrastructure', 'Network infrastructure', 'Cloud infrastructure'],
      source: 'Systems Engineering'
    }]
  ]);

  // Enhanced term detection
  const isComplexTerm = useCallback((word: string): boolean => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    
    // Check knowledge base first
    if (knowledgeBase.has(cleanWord)) return true;
    
    // Use text analysis service to identify complex terms
    const complexTerms = textAnalysisService.getComplexTerms(word);
    return complexTerms.includes(cleanWord);
  }, []);

  // Generate definition for unknown terms
  const generateDefinition = useCallback(async (term: string): Promise<TooltipData> => {
    // First check knowledge base
    const knownTerm = knowledgeBase.get(term.toLowerCase());
    if (knownTerm) return knownTerm;

    // For unknown terms, create a basic definition based on context
    const contextualDefinition = await generateContextualDefinition(term, documentContext);
    return contextualDefinition;
  }, [documentContext]);

  const generateContextualDefinition = async (term: string, context: string): Promise<TooltipData> => {
    // In a real implementation, this would call an AI service
    // For now, we'll create a basic contextual definition
    
    const baseDefinition = `"${term}" is a term that appears in this document.`;
    const contextHint = context ? ` Based on the context, it relates to the main topic being discussed.` : '';
    
    return {
      term: term.charAt(0).toUpperCase() + term.slice(1),
      definition: baseDefinition + contextHint,
      context: 'This term was identified as potentially complex based on document analysis.',
      relatedTerms: textAnalysisService.getComplexTerms(context).slice(0, 3),
      examples: [`Usage in context: "${term}"`],
      source: 'Document Analysis'
    };
  };

  // Handle mouse enter on text elements
  const handleMouseEnter = useCallback((event: MouseEvent) => {
    if (!isEnabled) return;
    
    const target = event.target as HTMLElement;
    if (!target || target.tagName !== 'SPAN') return;
    
    const text = target.textContent?.trim();
    if (!text || text.length < 3) return;
    
    // Check if this is a complex term
    const words = text.split(/\s+/);
    const complexWord = words.find(word => isComplexTerm(word));
    
    if (!complexWord) return;
    
    setHoveredElement(target);
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer
    const timer = setTimeout(async () => {
      const rect = target.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
      
      setTooltipState(prev => ({
        ...prev,
        visible: true,
        position,
        loading: true,
        data: null
      }));
      
      try {
        const tooltipData = await generateDefinition(complexWord);
        setTooltipState(prev => ({
          ...prev,
          loading: false,
          data: tooltipData
        }));
        
        if (onTermLookup) {
          onTermLookup(complexWord);
        }
      } catch (error) {
        console.error('Error generating tooltip data:', error);
        setTooltipState(prev => ({
          ...prev,
          visible: false,
          loading: false
        }));
      }
    }, 800); // 800ms delay to prevent flickering
    
    setDebounceTimer(timer);
  }, [isEnabled, isComplexTerm, generateDefinition, onTermLookup, debounceTimer]);

  // Handle mouse leave
  const handleMouseLeave = useCallback((event: MouseEvent) => {
    if (!isEnabled) return;
    
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    // Don't hide if moving to tooltip
    if (relatedTarget && tooltipRef.current?.contains(relatedTarget)) {
      return;
    }
    
    // Clear timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
    
    // Hide tooltip after a short delay
    setTimeout(() => {
      setTooltipState(prev => ({
        ...prev,
        visible: false,
        data: null,
        loading: false
      }));
      setHoveredElement(null);
    }, 200);
  }, [isEnabled, debounceTimer]);

  // Close tooltip
  const closeTooltip = useCallback(() => {
    setTooltipState({
      visible: false,
      position: { x: 0, y: 0 },
      data: null,
      loading: false
    });
    setHoveredElement(null);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [debounceTimer]);

  // Set up event listeners
  useEffect(() => {
    if (!isEnabled) return;
    
    const textLayer = document.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) return;
    
    textLayer.addEventListener('mouseenter', handleMouseEnter, true);
    textLayer.addEventListener('mouseleave', handleMouseLeave, true);
    
    return () => {
      textLayer.removeEventListener('mouseenter', handleMouseEnter, true);
      textLayer.removeEventListener('mouseleave', handleMouseLeave, true);
    };
  }, [isEnabled, handleMouseEnter, handleMouseLeave]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  if (!tooltipState.visible) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 max-w-sm bg-gray-900 border border-gray-700 rounded-lg shadow-2xl animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${tooltipState.position.x}px`,
        top: `${tooltipState.position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
      onMouseEnter={() => {
        // Keep tooltip open when hovering over it
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          setDebounceTimer(null);
        }
      }}
      onMouseLeave={() => {
        // Close when leaving tooltip
        setTimeout(closeTooltip, 200);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Do You Know?</span>
        </div>
        <button
          onClick={closeTooltip}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {tooltipState.loading ? (
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            <span className="text-sm text-gray-300">Looking up definition...</span>
          </div>
        ) : tooltipState.data ? (
          <div className="space-y-3">
            {/* Term */}
            <div>
              <h3 className="font-semibold text-white text-base">
                {tooltipState.data.term}
              </h3>
            </div>

            {/* Definition */}
            <div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {tooltipState.data.definition}
              </p>
            </div>

            {/* Context */}
            {tooltipState.data.context && (
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-2">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-200">
                    {tooltipState.data.context}
                  </p>
                </div>
              </div>
            )}

            {/* Examples */}
            {tooltipState.data.examples && tooltipState.data.examples.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-1">Examples:</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  {tooltipState.data.examples.slice(0, 2).map((example, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-gray-500">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Terms */}
            {tooltipState.data.relatedTerms.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Related:</h4>
                <div className="flex flex-wrap gap-1">
                  {tooltipState.data.relatedTerms.slice(0, 3).map((term, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => {
                  if (tooltipState.data?.term && onTermLookup) {
                    onTermLookup(tooltipState.data.term);
                  }
                }}
              >
                <Brain className="h-3 w-3 mr-1" />
                Learn More
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={closeTooltip}
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Got It
              </Button>
            </div>

            {/* Source */}
            {tooltipState.data.source && (
              <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                Source: {tooltipState.data.source}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            Unable to load definition.
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for managing hover tooltips
export function useHoverTooltips(enabled: boolean = true) {
  const [isTooltipEnabled, setIsTooltipEnabled] = useState(enabled);
  const [lookupHistory, setLookupHistory] = useState<string[]>([]);

  const handleTermLookup = useCallback((term: string) => {
    setLookupHistory(prev => {
      const newHistory = [term, ...prev.filter(t => t !== term)];
      return newHistory.slice(0, 10); // Keep last 10 lookups
    });
  }, []);

  const toggleTooltips = useCallback(() => {
    setIsTooltipEnabled(prev => !prev);
  }, []);

  return {
    isTooltipEnabled,
    lookupHistory,
    handleTermLookup,
    toggleTooltips
  };
}