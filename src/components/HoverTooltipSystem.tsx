import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/react';
import { textAnalysisService } from '@/lib/textAnalysisService';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Lightbulb, Info } from 'lucide-react';

interface TooltipData {
  term: string;
  definition: string;
  context: string;
  relatedTerms: string[];
  learnMoreUrl?: string;
}

interface HoverTooltipSystemProps {
  pageElement: HTMLElement | null;
  isEnabled: boolean;
  onTermClick?: (term: string) => void;
}

export function HoverTooltipSystem({ pageElement, isEnabled, onTermClick }: HoverTooltipSystemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  
  const arrowRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isVisible,
    onOpenChange: setIsVisible,
    placement: 'top',
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef })
    ],
    whileElementsMounted: autoUpdate,
  });

  // Debounced hover handler
  const handleMouseEnter = useCallback((event: MouseEvent) => {
    if (!isEnabled) return;

    const target = event.target as HTMLElement;
    if (!target || !target.textContent) return;

    // Clear any existing timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Set a delay before showing tooltip to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      handleTermHover(target, event);
    }, 300);
  }, [isEnabled]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Add a small delay before hiding to allow moving to tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setHoveredElement(null);
    }, 150);
  }, []);

  // Handle term hover detection
  const handleTermHover = async (element: HTMLElement, event: MouseEvent) => {
    try {
      const text = element.textContent?.trim() || '';
      if (text.length < 3) return;

      // Extract potential terms from the text
      const terms = textAnalysisService.extractKeyTerms(text);
      if (terms.length === 0) return;

      // Find the most relevant term based on mouse position
      const relevantTerm = findRelevantTerm(terms, text, event);
      if (!relevantTerm) return;

      // Set reference element for floating UI
      refs.setReference(element);
      setHoveredElement(element);
      setIsLoading(true);
      setIsVisible(true);

      // Generate definition for the term
      const definition = await generateTermDefinition(relevantTerm.term, relevantTerm.context);
      setTooltipData(definition);
      setIsLoading(false);

    } catch (error) {
      console.error('Error handling term hover:', error);
      setIsLoading(false);
    }
  };

  // Find the most relevant term based on cursor position
  const findRelevantTerm = (
    terms: Array<{ term: string; context: string; position: number }>,
    fullText: string,
    event: MouseEvent
  ) => {
    if (terms.length === 0) return null;
    
    // For now, return the first significant term
    // In a more advanced implementation, you could calculate cursor position within text
    return terms.find(term => term.term.length > 5) || terms[0];
  };

  // Generate definition for a term
  const generateTermDefinition = async (term: string, context: string): Promise<TooltipData> => {
    try {
      // This would typically call an API or knowledge base
      // For now, we'll use a simple local knowledge base
      const definition = await getTermDefinition(term, context);
      return definition;
    } catch (error) {
      console.error('Error generating definition:', error);
      return {
        term,
        definition: 'Definition not available',
        context: 'Unable to retrieve information',
        relatedTerms: [],
      };
    }
  };

  // Simple knowledge base for common terms
  const getTermDefinition = async (term: string, context: string): Promise<TooltipData> => {
    const lowerTerm = term.toLowerCase();
    
    // Common AI/ML terms
    const aiTerms: Record<string, Omit<TooltipData, 'term'>> = {
      'artificial intelligence': {
        definition: 'A branch of computer science that aims to create machines capable of intelligent behavior, learning, and decision-making.',
        context: 'Foundational technology for modern computing',
        relatedTerms: ['Machine Learning', 'Deep Learning', 'Neural Networks'],
        learnMoreUrl: 'https://en.wikipedia.org/wiki/Artificial_intelligence'
      },
      'machine learning': {
        definition: 'A subset of AI that enables computers to learn and improve from experience without being explicitly programmed.',
        context: 'Core technique in modern AI systems',
        relatedTerms: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'],
        learnMoreUrl: 'https://en.wikipedia.org/wiki/Machine_learning'
      },
      'deep learning': {
        definition: 'A machine learning technique based on artificial neural networks with multiple layers (deep networks).',
        context: 'Advanced ML technique for complex pattern recognition',
        relatedTerms: ['Neural Networks', 'Convolutional Networks', 'Transformers'],
        learnMoreUrl: 'https://en.wikipedia.org/wiki/Deep_learning'
      },
      'neural network': {
        definition: 'A computing system inspired by biological neural networks, consisting of interconnected nodes (neurons) that process information.',
        context: 'Fundamental architecture in deep learning',
        relatedTerms: ['Artificial Neuron', 'Backpropagation', 'Activation Function'],
        learnMoreUrl: 'https://en.wikipedia.org/wiki/Artificial_neural_network'
      },
      'algorithm': {
        definition: 'A step-by-step procedure or formula for solving a problem or completing a task.',
        context: 'Fundamental concept in computer science and mathematics',
        relatedTerms: ['Data Structure', 'Complexity', 'Optimization'],
        learnMoreUrl: 'https://en.wikipedia.org/wiki/Algorithm'
      }
    };

    // Medical terms
    const medicalTerms: Record<string, Omit<TooltipData, 'term'>> = {
      'diagnosis': {
        definition: 'The identification of a disease or condition through examination of symptoms, tests, and medical history.',
        context: 'Essential process in healthcare',
        relatedTerms: ['Prognosis', 'Treatment', 'Symptoms'],
        learnMoreUrl: 'https://en.wikipedia.org/wiki/Medical_diagnosis'
      },
      'pathology': {
        definition: 'The study of disease, including its causes, development, and effects on the body.',
        context: 'Medical specialty focused on disease mechanisms',
        relatedTerms: ['Histopathology', 'Cytology', 'Autopsy'],
        learnMoreUrl: 'https://en.wikipedia.org/wiki/Pathology'
      }
    };

    // Business terms
    const businessTerms: Record<string, Omit<TooltipData, 'term'>> = {
      'roi': {
        definition: 'Return on Investment - a performance measure used to evaluate the efficiency of an investment.',
        context: 'Key financial metric in business analysis',
        relatedTerms: ['ROE', 'IRR', 'NPV'],
        learnMoreUrl: 'https://en.wikipedia.org/wiki/Return_on_investment'
      },
      'kpi': {
        definition: 'Key Performance Indicator - a measurable value that demonstrates how effectively a company is achieving key business objectives.',
        context: 'Essential metric for business performance tracking',
        relatedTerms: ['Metrics', 'Analytics', 'Dashboard'],
        learnMoreUrl: 'https://en.wikipedia.org/wiki/Performance_indicator'
      }
    };

    // Combine all knowledge bases
    const allTerms = { ...aiTerms, ...medicalTerms, ...businessTerms };
    
    // Check for exact match first
    if (allTerms[lowerTerm]) {
      return { term, ...allTerms[lowerTerm] };
    }

    // Check for partial matches
    const partialMatch = Object.keys(allTerms).find(key => 
      key.includes(lowerTerm) || lowerTerm.includes(key)
    );

    if (partialMatch) {
      return { term, ...allTerms[partialMatch] };
    }

    // Generate a contextual definition based on the term structure
    return generateContextualDefinition(term, context);
  };

  // Generate contextual definition for unknown terms
  const generateContextualDefinition = (term: string, context: string): TooltipData => {
    const lowerTerm = term.toLowerCase();
    
    // Check for common suffixes and prefixes to infer meaning
    if (lowerTerm.endsWith('ology')) {
      return {
        term,
        definition: `The study or science of ${term.replace(/ology$/i, '').toLowerCase()}.`,
        context: 'Scientific discipline or field of study',
        relatedTerms: ['Research', 'Science', 'Study'],
      };
    }
    
    if (lowerTerm.endsWith('ism')) {
      return {
        term,
        definition: `A distinctive practice, system, or philosophy related to ${term.replace(/ism$/i, '').toLowerCase()}.`,
        context: 'Ideology, practice, or system',
        relatedTerms: ['Philosophy', 'System', 'Approach'],
      };
    }
    
    if (lowerTerm.endsWith('tion') || lowerTerm.endsWith('sion')) {
      return {
        term,
        definition: `The process, action, or result of ${term.replace(/(t|s)ion$/i, '').toLowerCase()}ing.`,
        context: 'Process or action',
        relatedTerms: ['Process', 'Method', 'Procedure'],
      };
    }

    // Check if it's an acronym
    if (/^[A-Z]{2,}$/.test(term)) {
      return {
        term,
        definition: `${term} is an acronym commonly used in this field. The specific meaning depends on the context.`,
        context: 'Acronym or abbreviation',
        relatedTerms: ['Abbreviation', 'Technical Term'],
      };
    }

    // Default fallback
    return {
      term,
      definition: `${term} is a specialized term in this context. It appears to be ${context.toLowerCase()}.`,
      context: context || 'Technical or specialized term',
      relatedTerms: [],
    };
  };

  // Set up event listeners
  useEffect(() => {
    if (!pageElement || !isEnabled) return;

    // Add event listeners to text spans in the PDF
    const textSpans = pageElement.querySelectorAll('span');
    
    textSpans.forEach(span => {
      span.addEventListener('mouseenter', handleMouseEnter);
      span.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      textSpans.forEach(span => {
        span.removeEventListener('mouseenter', handleMouseEnter);
        span.removeEventListener('mouseleave', handleMouseLeave);
      });
      
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [pageElement, isEnabled, handleMouseEnter, handleMouseLeave]);

  // Handle tooltip mouse events to prevent hiding when hovering over tooltip
  const handleTooltipMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    setIsVisible(false);
    setHoveredElement(null);
  };

  if (!isVisible || !tooltipData) return null;

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-50 max-w-sm"
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 text-white backdrop-blur-sm">
        {/* Arrow */}
        <div
          ref={arrowRef}
          className="absolute w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45 -translate-x-1/2"
          style={{
            bottom: '-4px',
            left: '50%',
          }}
        />

        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm text-gray-300">Loading definition...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-100 text-sm">Do You Know?</h3>
                <p className="text-xs text-gray-400 mt-1">{tooltipData.term}</p>
              </div>
            </div>

            {/* Definition */}
            <div className="text-sm text-gray-200 leading-relaxed">
              {tooltipData.definition}
            </div>

            {/* Context */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Info className="w-3 h-3" />
              <span>{tooltipData.context}</span>
            </div>

            {/* Related Terms */}
            {tooltipData.relatedTerms.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Lightbulb className="w-3 h-3" />
                  <span>Related:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tooltipData.relatedTerms.slice(0, 3).map((relatedTerm, index) => (
                    <button
                      key={index}
                      onClick={() => onTermClick?.(relatedTerm)}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 hover:text-white transition-colors"
                    >
                      {relatedTerm}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onTermClick?.(tooltipData.term)}
                className="text-xs text-gray-400 hover:text-white h-6 px-2"
              >
                Learn More
              </Button>
              
              {tooltipData.learnMoreUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(tooltipData.learnMoreUrl, '_blank')}
                  className="text-xs text-blue-400 hover:text-blue-300 h-6 px-2"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Wiki
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for managing hover tooltip system
export function useHoverTooltipSystem(isEnabled: boolean = true) {
  const [currentPageElement, setCurrentPageElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const updatePageElement = () => {
      const pageElement = document.querySelector('.react-pdf__Page') as HTMLElement;
      setCurrentPageElement(pageElement);
    };

    // Update immediately
    updatePageElement();

    // Set up observer for page changes
    const observer = new MutationObserver(updatePageElement);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return { currentPageElement };
}