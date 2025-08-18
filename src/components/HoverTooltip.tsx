import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFloating, autoUpdate, offset, flip, shift, useHover, useDismiss, useInteractions, FloatingPortal } from '@floating-ui/react';
import { Brain, ExternalLink, Loader2 } from 'lucide-react';

export interface TooltipDefinition {
  term: string;
  definition: string;
  context: string;
  relatedConcepts?: string[];
  learnMoreUrl?: string;
  confidence: number;
}

interface HoverTooltipProps {
  children: React.ReactNode;
  pageElement?: HTMLElement;
  isEnabled?: boolean;
}

interface TooltipState {
  isVisible: boolean;
  isLoading: boolean;
  definition: TooltipDefinition | null;
  hoveredTerm: string;
}

// Knowledge base for common terms (in a real app, this would be an API call)
const knowledgeBase: Record<string, TooltipDefinition> = {
  'artificial intelligence': {
    term: 'Artificial Intelligence',
    definition: 'The simulation of human intelligence in machines that are programmed to think and learn like humans.',
    context: 'AI encompasses machine learning, natural language processing, computer vision, and robotics.',
    relatedConcepts: ['Machine Learning', 'Deep Learning', 'Neural Networks'],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
    confidence: 0.95
  },
  'machine learning': {
    term: 'Machine Learning',
    definition: 'A subset of AI that enables systems to automatically learn and improve from experience without being explicitly programmed.',
    context: 'ML algorithms build mathematical models based on training data to make predictions or decisions.',
    relatedConcepts: ['Supervised Learning', 'Unsupervised Learning', 'Deep Learning'],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Machine_learning',
    confidence: 0.93
  },
  'deep learning': {
    term: 'Deep Learning',
    definition: 'A subset of machine learning that uses artificial neural networks with multiple layers to model and understand complex patterns.',
    context: 'Deep learning is particularly effective for tasks like image recognition, natural language processing, and speech recognition.',
    relatedConcepts: ['Neural Networks', 'Convolutional Neural Networks', 'Recurrent Neural Networks'],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Deep_learning',
    confidence: 0.91
  },
  'neural network': {
    term: 'Neural Network',
    definition: 'A computing system inspired by biological neural networks, consisting of interconnected nodes (neurons) that process information.',
    context: 'Neural networks can learn complex patterns and relationships in data through training.',
    relatedConcepts: ['Perceptron', 'Backpropagation', 'Activation Function'],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Neural_network',
    confidence: 0.89
  },
  'algorithm': {
    term: 'Algorithm',
    definition: 'A step-by-step procedure or formula for solving a problem or completing a task.',
    context: 'In computing, algorithms are the foundation of all software programs and data processing.',
    relatedConcepts: ['Data Structure', 'Complexity', 'Optimization'],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Algorithm',
    confidence: 0.88
  },
  'nlp': {
    term: 'Natural Language Processing (NLP)',
    definition: 'A branch of AI that helps computers understand, interpret, and manipulate human language.',
    context: 'NLP combines computational linguistics with statistical and machine learning models.',
    relatedConcepts: ['Text Mining', 'Sentiment Analysis', 'Language Models'],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Natural_language_processing',
    confidence: 0.92
  },
  'sensitivity': {
    term: 'Sensitivity',
    definition: 'In medical testing, the ability of a test to correctly identify patients with a disease (true positive rate).',
    context: 'High sensitivity means few false negatives - the test catches most cases of the disease.',
    relatedConcepts: ['Specificity', 'PPV', 'NPV'],
    confidence: 0.87
  },
  'specificity': {
    term: 'Specificity',
    definition: 'In medical testing, the ability of a test to correctly identify patients without a disease (true negative rate).',
    context: 'High specificity means few false positives - the test rarely incorrectly identifies disease.',
    relatedConcepts: ['Sensitivity', 'PPV', 'NPV'],
    confidence: 0.87
  },
  'auc': {
    term: 'Area Under the Curve (AUC)',
    definition: 'A performance measurement for classification problems, representing the degree of separability.',
    context: 'AUC values range from 0 to 1, where 1 indicates perfect classification and 0.5 indicates random guessing.',
    relatedConcepts: ['ROC Curve', 'Precision', 'Recall'],
    confidence: 0.85
  }
};

export function HoverTooltipProvider({ children, pageElement, isEnabled = true }: HoverTooltipProps) {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    isVisible: false,
    isLoading: false,
    definition: null,
    hoveredTerm: ''
  });

  const debounceTimer = useRef<NodeJS.Timeout>();
  const currentHoverTarget = useRef<HTMLElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: tooltipState.isVisible,
    onOpenChange: (open) => {
      if (!open) {
        setTooltipState(prev => ({ ...prev, isVisible: false, definition: null }));
      }
    },
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift({ padding: 5 })
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    delay: { open: 500, close: 200 },
    restMs: 40
  });
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
  ]);

  // Function to check if a term should show a tooltip
  const isTooltipWorthy = useCallback((text: string): boolean => {
    if (!text || text.length < 3) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check if it's in our knowledge base
    if (knowledgeBase[lowerText]) return true;
    
    // Check for technical terms, acronyms, or complex words
    const technicalPatterns = [
      /^[A-Z]{2,}$/, // Acronyms like AI, ML, NLP
      /\b\w+ing\b/, // Technical processes ending in -ing
      /\b\w+tion\b/, // Technical terms ending in -tion
      /\b\w+ism\b/, // Technical terms ending in -ism
      /\b\w+ology\b/, // Fields of study ending in -ology
      /\b\w{8,}\b/, // Long technical words
    ];
    
    return technicalPatterns.some(pattern => pattern.test(text));
  }, []);

  // Function to get definition for a term
  const getDefinition = useCallback(async (term: string): Promise<TooltipDefinition | null> => {
    const lowerTerm = term.toLowerCase();
    
    // Check knowledge base first
    if (knowledgeBase[lowerTerm]) {
      return knowledgeBase[lowerTerm];
    }
    
    // For terms not in knowledge base, generate a simple definition
    // In a real app, this would call an API
    return {
      term: term,
      definition: `A technical term related to the document content. Click "Learn More" for detailed information.`,
      context: 'This term appears in the context of the current document and may be important for understanding the content.',
      relatedConcepts: [],
      confidence: 0.6
    };
  }, []);

  // Handle mouse over events on the page
  const handleMouseOver = useCallback(async (event: MouseEvent) => {
    if (!isEnabled) return;

    const target = event.target as HTMLElement;
    if (!target || target.tagName !== 'SPAN') return;

    const text = target.textContent?.trim();
    if (!text || !isTooltipWorthy(text)) return;

    // Clear any existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(async () => {
      if (currentHoverTarget.current === target) {
        setTooltipState(prev => ({ ...prev, isLoading: true, hoveredTerm: text }));
        
        try {
          const definition = await getDefinition(text);
          
          if (definition && currentHoverTarget.current === target) {
            refs.setReference(target);
            setTooltipState({
              isVisible: true,
              isLoading: false,
              definition,
              hoveredTerm: text
            });
          }
        } catch (error) {
          console.error('Error getting definition:', error);
          setTooltipState(prev => ({ ...prev, isLoading: false }));
        }
      }
    }, 300);

    currentHoverTarget.current = target;
  }, [isEnabled, isTooltipWorthy, getDefinition, refs]);

  // Handle mouse leave events
  const handleMouseLeave = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (currentHoverTarget.current === target) {
      currentHoverTarget.current = null;
      setTimeout(() => {
        setTooltipState(prev => ({ ...prev, isVisible: false, definition: null }));
      }, 100);
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const element = pageElement || document;
    
    element.addEventListener('mouseover', handleMouseOver);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mouseover', handleMouseOver);
      element.removeEventListener('mouseleave', handleMouseLeave);
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [pageElement, handleMouseOver, handleMouseLeave]);

  return (
    <>
      {children}
      
      <FloatingPortal>
        {tooltipState.isVisible && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <TooltipCard
              definition={tooltipState.definition}
              isLoading={tooltipState.isLoading}
              term={tooltipState.hoveredTerm}
            />
          </div>
        )}
      </FloatingPortal>
    </>
  );
}

interface TooltipCardProps {
  definition: TooltipDefinition | null;
  isLoading: boolean;
  term: string;
}

function TooltipCard({ definition, isLoading, term }: TooltipCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 max-w-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <span className="text-sm text-gray-300">Looking up "{term}"...</span>
        </div>
      </div>
    );
  }

  if (!definition) return null;

  const handleLearnMore = () => {
    if (definition.learnMoreUrl) {
      window.open(definition.learnMoreUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 max-w-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white text-sm">{definition.term}</h3>
            <span className="text-xs text-gray-400">
              {Math.round(definition.confidence * 100)}% confidence
            </span>
          </div>
          <div className="text-xs text-blue-400 font-medium">Do You Know?</div>
        </div>
      </div>

      {/* Definition */}
      <div className="space-y-3">
        <p className="text-sm text-gray-300 leading-relaxed">
          {definition.definition}
        </p>
        
        {definition.context && (
          <div className="bg-gray-800 rounded-md p-2">
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="font-medium">Context:</span> {definition.context}
            </p>
          </div>
        )}

        {definition.relatedConcepts && definition.relatedConcepts.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-1">Related Concepts:</div>
            <div className="flex flex-wrap gap-1">
              {definition.relatedConcepts.map((concept, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {definition.learnMoreUrl && (
          <button
            onClick={handleLearnMore}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Learn More
          </button>
        )}
      </div>
    </div>
  );
}

export default HoverTooltipProvider;