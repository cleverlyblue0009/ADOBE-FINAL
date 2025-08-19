import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Lightbulb, 
  BookOpen, 
  Copy,
  Loader2,
  X,
  Highlighter,
  Languages,
  Globe,
  Zap,
  MessageSquare,
  Link
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EnhancedCustomTextSelectionMenuProps {
  selectedText: string;
  position: { x: number; y: number } | null;
  pageContext?: string;
  documentId?: string;
  onHighlight?: (color: 'yellow' | 'green' | 'blue' | 'pink') => void;
  onClose: () => void;
  onOpenSimplify?: (text: string) => void;
  onOpenTranslate?: (text: string) => void;
  onOpenInsights?: (text: string) => void;
}

export function EnhancedCustomTextSelectionMenu({
  selectedText,
  position,
  pageContext,
  documentId,
  onHighlight,
  onClose,
  onOpenSimplify,
  onOpenTranslate,
  onOpenInsights
}: EnhancedCustomTextSelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleSimplify = async () => {
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    setLoadingAction('simplify');
    
    try {
      // Open the simplify panel immediately
      if (onOpenSimplify) {
        onOpenSimplify(selectedText);
      }
      
      toast({
        title: "Opening Simplify Panel",
        description: "Text will be simplified in the right sidebar",
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to open simplify panel:', error);
      toast({
        title: "Error",
        description: "Failed to open simplify panel. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleTranslate = async () => {
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    setLoadingAction('translate');
    
    try {
      // Open the translate panel immediately
      if (onOpenTranslate) {
        onOpenTranslate(selectedText);
      }
      
      toast({
        title: "Opening Translate Panel",
        description: "Text will be translated in the left sidebar",
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to open translate panel:', error);
      toast({
        title: "Error",
        description: "Failed to open translate panel. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleInsights = async () => {
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    setLoadingAction('insights');
    
    try {
      // Open the insights panel immediately
      if (onOpenInsights) {
        onOpenInsights(selectedText);
      }
      
      toast({
        title: "Generating AI Insights",
        description: "Insights will appear in a popup window",
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to open insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard",
        variant: "destructive"
      });
    }
  };

  const highlightColors = [
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-300 hover:bg-yellow-400' },
    { name: 'Green', value: 'green', color: 'bg-green-300 hover:bg-green-400' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-300 hover:bg-blue-400' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-300 hover:bg-pink-400' }
  ];

  if (!position || !selectedText) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <Card className="shadow-2xl border border-gray-700 bg-gray-900/95 backdrop-blur-md text-white min-w-[320px]">
        {/* Header */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">Text Actions</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Selected text preview */}
          <div className="mt-2 text-xs text-gray-400 bg-gray-800/50 rounded p-2 max-h-16 overflow-y-auto">
            "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
          </div>
        </div>

        <div className="p-3">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSimplify}
              disabled={isLoading}
              className="flex flex-col gap-1 h-auto p-3 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 border border-indigo-600/30"
            >
              {isLoading && loadingAction === 'simplify' ? 
                <Loader2 className="h-4 w-4 animate-spin" /> : 
                <Brain className="h-4 w-4" />
              }
              <span className="text-xs font-medium">Simplify</span>
              <span className="text-xs opacity-70">Right Panel</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleTranslate}
              disabled={isLoading}
              className="flex flex-col gap-1 h-auto p-3 hover:bg-green-600/20 text-green-300 hover:text-green-200 border border-green-600/30"
            >
              {isLoading && loadingAction === 'translate' ? 
                <Loader2 className="h-4 w-4 animate-spin" /> : 
                <Languages className="h-4 w-4" />
              }
              <span className="text-xs font-medium">Translate</span>
              <span className="text-xs opacity-70">Left Panel</span>
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInsights}
              disabled={isLoading}
              className="flex-1 gap-2 hover:bg-purple-600/20 text-purple-300 hover:text-purple-200"
            >
              {isLoading && loadingAction === 'insights' ? 
                <Loader2 className="h-3 w-3 animate-spin" /> : 
                <Lightbulb className="h-3 w-3" />
              }
              <span className="text-xs">AI Insights</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="flex-1 gap-2 hover:bg-gray-600/20 text-gray-300 hover:text-gray-200"
            >
              <Copy className="h-3 w-3" />
              <span className="text-xs">Copy</span>
            </Button>
          </div>

          {/* Highlight Section */}
          {onHighlight && (
            <div className="border-t border-gray-700 pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="gap-2 hover:bg-yellow-600/20 text-yellow-300 hover:text-yellow-200 mb-2 w-full justify-start"
              >
                <Highlighter className="h-4 w-4" />
                <span className="text-xs">Highlight Text</span>
              </Button>

              {/* Color Picker */}
              {showColorPicker && (
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-xs text-gray-400">Color:</span>
                  {highlightColors.map((color) => (
                    <Button
                      key={color.value}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onHighlight(color.value as any);
                        setShowColorPicker(false);
                        toast({
                          title: "Highlighted",
                          description: `Text highlighted in ${color.name.toLowerCase()}`,
                        });
                        onClose();
                      }}
                      className={`h-6 w-6 p-0 rounded-full ${color.color} transition-all duration-200 hover:scale-110`}
                      title={`Highlight in ${color.name}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}