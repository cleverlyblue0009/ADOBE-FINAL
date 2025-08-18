import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Brain, 
  Lightbulb, 
  Languages,
  Copy,
  Loader2,
  X,
  Highlighter,
  Palette
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EnhancedContextMenuProps {
  selectedText: string;
  position: { x: number; y: number } | null;
  pageContext?: string;
  documentId?: string;
  pageNumber: number;
  onHighlight?: (color: 'yellow' | 'green' | 'blue' | 'pink') => void;
  onClose: () => void;
  onOpenAIInsights: (text: string) => void;
  onOpenSimplify: (text: string) => void;
  onOpenTranslate: (text: string) => void;
}

export function EnhancedContextMenu({
  selectedText,
  position,
  pageContext,
  documentId,
  pageNumber,
  onHighlight,
  onClose,
  onOpenAIInsights,
  onOpenSimplify,
  onOpenTranslate
}: EnhancedContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
      onClose();
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleSimplify = () => {
    onOpenSimplify(selectedText);
    onClose();
  };

  const handleAIInsights = () => {
    onOpenAIInsights(selectedText);
    onClose();
  };

  const handleTranslate = () => {
    onOpenTranslate(selectedText);
    onClose();
  };

  const highlightColors = [
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-300', fluorescent: 'rgba(255, 255, 0, 0.4)' },
    { name: 'Green', value: 'green', color: 'bg-green-300', fluorescent: 'rgba(0, 255, 0, 0.4)' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-300', fluorescent: 'rgba(0, 150, 255, 0.4)' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-300', fluorescent: 'rgba(255, 20, 147, 0.4)' }
  ];

  if (!position || !selectedText) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Enhanced Context Menu */}
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
        <Card className="shadow-2xl border-2 border-gray-600 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-md text-white min-w-72 animate-in fade-in-0 zoom-in-95">
          <div className="p-4">
            {/* Selected Text Preview */}
            <div className="mb-4 pb-3 border-b border-gray-600">
              <p className="text-xs text-gray-300 font-medium mb-1">Selected Text:</p>
              <p className="text-sm text-white line-clamp-3 bg-gray-800/50 rounded p-2 border-l-2 border-blue-400">
                "{selectedText.substring(0, 120)}{selectedText.length > 120 ? '...' : ''}"
              </p>
              <p className="text-xs text-gray-400 mt-1">Page {pageNumber}</p>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSimplify}
                disabled={isLoading}
                className="gap-2 h-12 flex-col hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-100 border border-indigo-600/30 hover:border-indigo-500/50"
                title="Simplify Text with AI"
              >
                <Brain className="h-5 w-5" />
                <span className="text-xs font-medium">Simplify</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleAIInsights}
                disabled={isLoading}
                className="gap-2 h-12 flex-col hover:bg-purple-600/30 text-purple-300 hover:text-purple-100 border border-purple-600/30 hover:border-purple-500/50"
                title="Generate AI Insights"
              >
                <Lightbulb className="h-5 w-5" />
                <span className="text-xs font-medium">AI Insights</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleTranslate}
                disabled={isLoading}
                className="gap-2 h-12 flex-col hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-100 border border-cyan-600/30 hover:border-cyan-500/50"
                title="Translate Text"
              >
                <Languages className="h-5 w-5" />
                <span className="text-xs font-medium">Translate</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-2 h-12 flex-col hover:bg-green-600/30 text-green-300 hover:text-green-100 border border-green-600/30 hover:border-green-500/50"
                title="Copy Text"
              >
                <Copy className="h-5 w-5" />
                <span className="text-xs font-medium">Copy</span>
              </Button>
            </div>

            {/* Highlight Section */}
            {onHighlight && (
              <div className="border-t border-gray-600 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-200">Highlight</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="gap-2 hover:bg-yellow-600/30 text-yellow-300 hover:text-yellow-100 h-8"
                  >
                    <Highlighter className="h-4 w-4" />
                    <Palette className="h-3 w-3" />
                  </Button>
                </div>

                {/* Fluorescent Color Picker */}
                {showColorPicker && (
                  <div className="grid grid-cols-4 gap-2">
                    {highlightColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => {
                          onHighlight(color.value as any);
                          setShowColorPicker(false);
                          onClose();
                        }}
                        className="group relative w-full h-8 rounded-lg border-2 border-gray-600 hover:border-gray-400 transition-all duration-200 hover:scale-105"
                        style={{ backgroundColor: color.fluorescent }}
                        title={`Highlight in ${color.name}`}
                      >
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-xs font-bold text-gray-800 drop-shadow-sm">
                          {color.name.charAt(0)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}