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
  Sparkles,
  MessageSquare,
  Link2
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
  onOpenSimplifyPanel?: () => void;
  onOpenTranslatePanel?: () => void;
  onOpenAIInsights?: () => void;
}

interface AIResult {
  type: 'simplification' | 'translation' | 'insight' | 'definition' | 'connection';
  content: string;
  title: string;
}

export function EnhancedCustomTextSelectionMenu({
  selectedText,
  position,
  pageContext,
  documentId,
  onHighlight,
  onClose,
  onOpenSimplifyPanel,
  onOpenTranslatePanel,
  onOpenAIInsights
}: EnhancedCustomTextSelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    try {
      // Open the simplify panel immediately
      onOpenSimplifyPanel?.();
      
      // Also provide quick preview in menu
      const result = await apiService.simplifyText(selectedText);
      setAiResult({
        type: 'simplification',
        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        title: '🧠 Simplified Text'
      });
      
      toast({
        title: "Simplify Panel Opened",
        description: "Text simplification is being processed in the right panel",
      });
      
      // Close menu after short delay
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Failed to simplify text:', error);
      toast({
        title: "Simplification Error",
        description: "Failed to simplify the selected text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    try {
      // Open the translate panel immediately
      onOpenTranslatePanel?.();
      
      // Also provide quick preview in menu
      const result = await apiService.translateText(selectedText, 'spanish'); // Default to Spanish
      setAiResult({
        type: 'translation',
        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        title: '🌍 Translated Text'
      });
      
      toast({
        title: "Translate Panel Opened",
        description: "Text translation is being processed in the left panel",
      });
      
      // Close menu after short delay
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Failed to translate text:', error);
      toast({
        title: "Translation Error",
        description: "Failed to translate the selected text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIInsights = async () => {
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    try {
      // Open the AI insights panel immediately
      onOpenAIInsights?.();
      
      // Also provide quick preview in menu
      const result = await apiService.generateInsights(selectedText, 'general', 'understanding');
      setAiResult({
        type: 'insight',
        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        title: '💡 AI Insights'
      });
      
      toast({
        title: "AI Insights Panel Opened",
        description: "AI insights are being generated in the right panel",
      });
      
      // Close menu after short delay
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast({
        title: "Insights Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-300' },
    { name: 'Green', value: 'green', color: 'bg-green-300' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-300' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-300' }
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
        {/* AI Result Display */}
        {aiResult && (
          <div className="p-4 border-b border-gray-700 max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">{aiResult.title}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiResult(null)}
                className="h-6 w-6 p-0 hover:bg-gray-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-sm text-gray-300 max-h-32 overflow-y-auto">
              {aiResult.content}
            </div>
          </div>
        )}

        <div className="p-3">
          {/* Main Actions Row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSimplify}
                disabled={isLoading}
                className="flex flex-col gap-1 h-auto p-3 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200"
                title="Simplify Text (Opens Right Panel)"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                <span className="text-xs">Simplify</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleTranslate}
                disabled={isLoading}
                className="flex flex-col gap-1 h-auto p-3 hover:bg-orange-600/20 text-orange-300 hover:text-orange-200"
                title="Translate Text (Opens Left Panel)"
              >
                <Languages className="h-4 w-4" />
                <span className="text-xs">Translate</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleAIInsights}
                disabled={isLoading}
                className="flex flex-col gap-1 h-auto p-3 hover:bg-purple-600/20 text-purple-300 hover:text-purple-200"
                title="Generate AI Insights"
              >
                <Lightbulb className="h-4 w-4" />
                <span className="text-xs">Insights</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="flex flex-col gap-1 h-auto p-3 hover:bg-gray-600/20 text-gray-300 hover:text-gray-200"
                title="Copy Text"
              >
                <Copy className="h-4 w-4" />
                <span className="text-xs">Copy</span>
              </Button>
            </div>
          </div>

          {/* Highlight Section */}
          {onHighlight && (
            <div className="border-t border-gray-700 pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="gap-2 hover:bg-yellow-600/20 text-yellow-300 hover:text-yellow-200 mb-2 w-full"
                title="Highlight"
              >
                <Highlighter className="h-4 w-4" />
                <span className="text-sm">Highlight Text</span>
              </Button>

              {/* Color Picker */}
              {showColorPicker && (
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xs text-gray-400">Color:</span>
                  {highlightColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        onHighlight(color.value as any);
                        setShowColorPicker(false);
                        toast({
                          title: "Text Highlighted",
                          description: `Highlighted in ${color.name.toLowerCase()}`,
                        });
                        onClose();
                      }}
                      className={`w-6 h-6 rounded-full ${color.color} hover:scale-110 transition-transform border-2 border-gray-600 shadow-sm`}
                      title={color.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Text Preview */}
          <div className="pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400 line-clamp-2">
              "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}