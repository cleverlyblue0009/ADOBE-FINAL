import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  X, 
  Brain, 
  Lightbulb, 
  Languages,
  Copy,
  Loader2,
  Check,
  ArrowRight,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TodoistStylePopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'simplify' | 'insights' | 'translate';
  selectedText: string;
  pageNumber?: number;
  onOpenSidebar?: (panelType: 'insights' | 'simplifier' | 'highlights') => void;
}

export function TodoistStylePopup({
  isOpen,
  onClose,
  type,
  selectedText,
  pageNumber,
  onOpenSidebar
}: TodoistStylePopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && selectedText && !result) {
      processText();
    }
  }, [isOpen, selectedText, type]);

  useEffect(() => {
    if (isOpen && onOpenSidebar) {
      switch (type) {
        case 'insights':
          onOpenSidebar('insights');
          break;
        case 'simplify':
          onOpenSidebar('simplifier');
          break;
        case 'translate':
          onOpenSidebar('insights');
          break;
      }
    }
  }, [isOpen, onOpenSidebar, type]);

  const processText = async () => {
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    setResult('');
    
    try {
      let response;
      
      switch (type) {
        case 'simplify':
          response = await apiService.simplifyText(selectedText);
          break;
        case 'insights':
          response = await apiService.generateInsights(selectedText, 'general', 'understanding');
          break;
        case 'translate':
          // For now, we'll use a mock translation - you can integrate with Google Translate API
          response = await mockTranslate(selectedText);
          break;
        default:
          throw new Error('Unknown processing type');
      }
      
      setResult(typeof response === 'string' ? response : JSON.stringify(response, null, 2));
    } catch (error) {
      console.error(`Failed to ${type} text:`, error);
      setResult(`Failed to ${type} the selected text. Please try again.`);
      toast({
        title: "Error",
        description: `Failed to ${type} the selected text. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mockTranslate = async (text: string): Promise<string> => {
    // Mock translation - replace with actual translation service
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `[Translated] ${text}`;
  };

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Copied",
        description: "Result copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy result:', error);
      toast({
        title: "Error",
        description: "Failed to copy result to clipboard",
        variant: "destructive"
      });
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'simplify': return <Brain className="h-5 w-5" />;
      case 'insights': return <Lightbulb className="h-5 w-5" />;
      case 'translate': return <Languages className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'simplify': return 'Text Simplification';
      case 'insights': return 'AI Insights';
      case 'translate': return 'Translation';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'simplify': return 'indigo';
      case 'insights': return 'purple';
      case 'translate': return 'cyan';
    }
  };

  if (!isOpen) return null;

  const color = getColor();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in-0">
      <Card className={`
        bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 
        border-2 border-${color}-500/30 
        shadow-2xl 
        ${isExpanded ? 'w-full max-w-4xl h-[80vh]' : 'w-full max-w-2xl max-h-[70vh]'}
        overflow-hidden
        animate-in slide-in-from-bottom-4 zoom-in-95
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4 
          bg-gradient-to-r from-${color}-600/20 to-${color}-500/20 
          border-b border-${color}-500/30
        `}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${color}-600/30`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{getTitle()}</h3>
              {pageNumber && (
                <p className="text-sm text-gray-400">Page {pageNumber}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={processText}
              disabled={isLoading}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
              title="Retry"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Original Text */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-300">Selected Text</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(selectedText)}
                className="text-gray-400 hover:text-white h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-200 max-h-24 overflow-y-auto border-l-2 border-gray-600">
              {selectedText}
            </div>
          </div>

          {/* Result */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-300">
                {type === 'simplify' ? 'Simplified Text' : 
                 type === 'insights' ? 'AI Insights' : 'Translation'}
              </h4>
              {result && !isLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyResult}
                  className="gap-2 text-gray-400 hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                  Copy Result
                </Button>
              )}
            </div>
            
            <div className={`
              flex-1 rounded-lg p-4 text-sm overflow-y-auto
              ${isLoading 
                ? 'bg-gray-800/30 border border-gray-700 flex items-center justify-center' 
                : `bg-${color}-900/20 border border-${color}-600/30 text-white`
              }
            `}>
              {isLoading ? (
                <div className="text-center">
                  <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-3 text-${color}-400`} />
                  <p className="text-gray-400">
                    {type === 'simplify' ? 'Simplifying text...' : 
                     type === 'insights' ? 'Generating insights...' : 'Translating...'}
                  </p>
                </div>
              ) : result ? (
                <div className="whitespace-pre-wrap leading-relaxed">
                  {result}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p>No result available. Click retry to try again.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/30">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Check className="h-3 w-3" />
              <span>Auto-opened in sidebar</span>
            </div>
            
            <div className="flex items-center gap-2">
              {onOpenSidebar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    switch (type) {
                      case 'insights':
                        onOpenSidebar('insights');
                        break;
                      case 'simplify':
                        onOpenSidebar('simplifier');
                        break;
                      case 'translate':
                        onOpenSidebar('insights');
                        break;
                    }
                  }}
                  className="gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  View in Sidebar
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={onClose}
                className={`bg-${color}-600 hover:bg-${color}-700`}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}